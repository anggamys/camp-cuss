import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { FindPaymentResponseDto } from '../dto/find-payment.dto';
import {
  PaymentStatus,
  PaymentType,
} from '../../common/enums/transaction.enum';

@Injectable()
export class PaymentsQueryService {
  private readonly context = PaymentsQueryService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async getAll(): Promise<FindPaymentResponseDto[]> {
    try {
      this.logger.log('Mengambil semua transaksi', this.context);

      const transactions = await this.prisma.transaction.findMany({
        include: { order: true },
      });

      this.logger.log(
        `Berhasil mengambil ${transactions.length} transaksi`,
        this.context,
      );

      return transactions.map((transaction) => ({
        id: transaction.id,
        orderId: transaction.order_id,
        midtransOrderId: transaction.midtrans_order,
        trasactionId: transaction.transaction_id ?? '',
        paymentType:
          (transaction.payment_type as PaymentType) ??
          ('DEFAULT_PAYMENT_TYPE' as PaymentType),
        grossAmount: transaction.gross_amount,
        expireTime: transaction.expiry_time,
        fraudStatus: transaction.fraud_status ?? '',
        status:
          (transaction.status as PaymentStatus) ??
          ('DEFAULT_PAYMENT_STATUS' as PaymentStatus),
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      }));
    } catch (error) {
      this.logger.error(
        'Terjadi kesalahan saat mengambil semua transaksi',
        this.context,
        error instanceof Error ? error.message : String(error),
      );

      throw error;
    }
  }

  async getByMidtransId(
    midtransOrderId: string,
  ): Promise<FindPaymentResponseDto> {
    try {
      this.logger.log(
        `Mencari transaksi dengan midtrans_order: ${midtransOrderId}`,
        this.context,
      );

      const transaction = await this.prisma.transaction.findUnique({
        where: { midtrans_order: midtransOrderId },
        include: { order: true },
      });

      if (!transaction) {
        this.logger.warn(
          `Transaksi dengan midtrans_order: ${midtransOrderId} tidak ditemukan`,
          this.context,
        );

        throw new Error(`Transaction with id ${midtransOrderId} not found`);
      }

      this.logger.log(
        `Transaksi ditemukan: ${midtransOrderId} (DB ID: ${transaction.id})`,
        this.context,
      );

      const paymentResp: FindPaymentResponseDto = {
        id: transaction.id,
        orderId: transaction.order_id,
        midtransOrderId: transaction.midtrans_order,
        trasactionId: transaction.transaction_id ?? '',
        paymentType:
          (transaction.payment_type as PaymentType) ??
          ('DEFAULT_PAYMENT_TYPE' as PaymentType),
        grossAmount: transaction.gross_amount,
        expireTime: transaction.expiry_time,
        fraudStatus: transaction.fraud_status ?? '',
        status:
          (transaction.status as PaymentStatus) ??
          ('DEFAULT_PAYMENT_STATUS' as PaymentStatus),
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      };

      return paymentResp;
    } catch (error) {
      this.logger.error(
        `Terjadi kesalahan saat mengambil transaksi dengan id: ${midtransOrderId}`,
        this.context,

        error instanceof Error ? error.message : String(error),
      );

      throw error;
    }
  }
}
