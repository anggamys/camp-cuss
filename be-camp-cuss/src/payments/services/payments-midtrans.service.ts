import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { MidtransService } from '../midtrans.service';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { CreatePaymentResponseDto } from '../dto/create-payment.dto';
import type {
  gopayTransactionRequest,
  TransactionResponseType,
  gopayTransactionResponseType,
} from '../../common/types/transaction.interface';
import { PaymentType } from '../../common/enums/transaction.enum';
import { Env } from '../../common/constants/env.constant';
import { generateOrderCode } from '../../common/utils/order-code.util';
import { OrderService } from '../../common/enums/order.enum';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { MidtransHelpers } from '../../common/helpers/midtrans.helpers';

@Injectable()
export class PaymentsMidtransService {
  private readonly context = PaymentsMidtransService.name;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly midtransService: MidtransService,
    private readonly logger: AppLoggerService,
  ) {}

  async createTransaction(orderId: number): Promise<CreatePaymentResponseDto> {
    try {
      const order = await this.prismaService.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) {
        this.logger.warn(
          `Order dengan ID ${orderId} tidak ditemukan`,
          this.context,
        );
        throw new HttpException('Order tidak ditemukan', 404);
      }

      // Cari transaksi aktif (pending/paid)
      const existingTransaction =
        await this.prismaService.transaction.findFirst({
          where: {
            order_id: order.id,
            status: {
              in: [PaymentStatus.pending, PaymentStatus.paid],
            },
          },
          orderBy: { created_at: 'desc' },
        });

      if (existingTransaction) {
        // Tolak jika transaksi masih aktif
        if (
          existingTransaction.status === PaymentStatus.pending ||
          existingTransaction.status === PaymentStatus.paid
        ) {
          this.logger.warn(
            `Transaksi masih aktif untuk Order #${orderId} dengan status ${existingTransaction.status}`,
            this.context,
          );
          throw new HttpException(
            `Transaksi masih aktif (${existingTransaction.status}), tidak dapat membuat ulang`,
            400,
          );
        }
      }

      // Siapkan order code dan total biaya
      const orderCode = generateOrderCode(OrderService.ride, order.id);
      const midtransFee = MidtransHelpers.qrisFee(order.total_price);
      const serviceFee = 2000;
      const updatedGrossAmount = order.total_price + midtransFee + serviceFee;

      const transactionParams: gopayTransactionRequest = {
        paymentType: PaymentType.gopay,
        transactionDetails: {
          orderId: orderCode,
          grossAmount: updatedGrossAmount,
        },
        itemDetails: [
          {
            id: `order-${order.id}`,
            price: order.total_price,
            quantity: 1,
            name: 'Ride Payment',
          },
          {
            id: 'service_fee',
            price: serviceFee,
            quantity: 1,
            name: 'Service Fee',
          },
          {
            id: 'midtrans_fee',
            price: Math.round(midtransFee),
            quantity: 1,
            name: 'Midtrans Transaction Fee',
          },
        ],
        customerDetails: {
          firstName: order.user?.username ?? 'Customer',
          email: order.user?.email ?? '',
          phone: order.user?.no_phone ?? undefined,
        },
        gopay: {
          enableCallback: false,
          callbackUrl: Env.APP_URL ?? '',
        },
      };

      // Kirim ke Midtrans
      const transactionResponse =
        await this.midtransService.createTransaction(transactionParams);

      this.logger.log(
        `Transaksi Midtrans dibuat untuk Order #${orderId}`,
        this.context,
      );

      const trxData = {
        order_id: order.id,
        midtrans_order: orderCode,
        transaction_id:
          (transactionResponse as TransactionResponseType).transaction_id ??
          null,
        payment_type:
          (transactionResponse as TransactionResponseType).payment_type ??
          PaymentType.gopay,
        gross_amount:
          parseFloat(
            (transactionResponse as TransactionResponseType).gross_amount ??
              '0',
          ) || 0,
        qr_url:
          (transactionResponse as gopayTransactionResponseType).actions?.find(
            (a) => a.name === 'generate-qr-code',
          )?.url ?? null,
        deeplink_url:
          (transactionResponse as gopayTransactionResponseType).actions?.find(
            (a) => a.name === 'deeplink-redirect',
          )?.url ?? null,
        expiry_time: (transactionResponse as TransactionResponseType)
          .expiry_time
          ? new Date(
              (transactionResponse as TransactionResponseType).expiry_time!,
            )
          : null,
        status: MidtransHelpers.mapTransactionStatus(
          (transactionResponse as TransactionResponseType).transaction_status,
        ),
      };

      if (!existingTransaction) {
        // Buat transaksi baru
        await this.prismaService.transaction.create({ data: trxData });
      } else {
        // Perbarui transaksi lama yang sudah gagal/refunded
        await this.prismaService.transaction.update({
          where: { id: existingTransaction.id },
          data: trxData,
        });
      }

      // Update order
      await this.prismaService.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.pending,
          payment_method: PaymentType.gopay,
        },
      });

      const response: CreatePaymentResponseDto = {
        orderId: transactionParams.transactionDetails.orderId ?? '',
        transactionId:
          (transactionResponse as TransactionResponseType).transaction_id ?? '',
        paymentType:
          ((transactionResponse as TransactionResponseType)
            .payment_type as PaymentType) ?? PaymentType.gopay,
        grossAmount:
          (transactionResponse as TransactionResponseType).gross_amount ?? '0',
        status:
          (transactionResponse as TransactionResponseType).transaction_status ??
          'pending',
        qrCodeUrl:
          (transactionResponse as gopayTransactionResponseType).actions?.find(
            (a) => a.name === 'generate-qr-code-v2',
          )?.url ?? '',
        deepLink:
          (transactionResponse as gopayTransactionResponseType).actions?.find(
            (a) => a.name === 'deeplink-redirect',
          )?.url ?? '',
        expiryTime:
          (transactionResponse as TransactionResponseType).expiry_time ?? '',
      };

      return response;
    } catch (error) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : String(error);

      this.logger.error(
        `Gagal membuat transaksi Midtrans untuk orderId ${orderId}: ${errorMessage}`,
        this.context,
        typeof error === 'string' ? error : JSON.stringify(error),
      );

      throw error;
    }
  }
}
