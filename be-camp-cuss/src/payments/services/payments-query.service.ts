import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { FindPaymentResponseDto } from '../dto/find-payment.dto';
import {
  PaymentStatus,
  PaymentType,
} from '../../common/enums/transaction.enum';
import { ApiQueryParams } from '../../common/types/api-request.interface';
import { MetaResponse } from '../../common/types/api-response.interface';
import { ErrorHelper } from '../../common/helpers/error.helper';
import { PrismaHelper } from '../../common/helpers/prisma.helper';
import { Transaction } from '@prisma/client';

@Injectable()
export class PaymentsQueryService {
  private readonly context = PaymentsQueryService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaHelper: PrismaHelper,
    private readonly logger: AppLoggerService,
  ) {}

  async getAll(
    query: ApiQueryParams,
  ): Promise<{ data: FindPaymentResponseDto[]; meta: MetaResponse }> {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const offset = (page - 1) * limit;

      const search = query.search
        ? ({
            field: 'midtrans_order',
            query: String(query.search),
            mode: 'insensitive',
          } as const)
        : undefined;

      const [rawData, total] = await Promise.all([
        this.prismaHelper.findAllRecords('transaction', {
          take: limit,
          skip: offset,
          search,
          orderBy: {
            [query.sortBy || 'created_at']: query.sortOrder || 'desc',
          },
        }),
        this.prismaHelper.countRecords('transaction'),
      ]);

      const rawDataData = rawData as Transaction[];

      const data: FindPaymentResponseDto[] = rawDataData.map((transaction) => ({
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

      const meta: MetaResponse = {
        page,
        perPage: limit,
        total,
        totalPages: Math.ceil(total / limit),
      };

      this.logger.log(
        `Mengambil semua transaksi - Page: ${page}, Limit: ${limit}`,
        this.context,
      );

      return { data, meta };
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Terjadi kesalahan saat mengambil semua transaksi',
      );
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
