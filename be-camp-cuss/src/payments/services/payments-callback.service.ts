import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { MidtransHelpers } from '../../common/helpers/midtrans.helpers';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import { MidtransCallbackDto } from '../dto/midtrans-callback.dto';

@Injectable()
export class PaymentsCallbackService {
  private readonly context = PaymentsCallbackService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async process(data: MidtransCallbackDto) {
    try {
      const tx = await this.prisma.transaction.findUnique({
        where: { midtrans_order: data.order_id },
        include: { order: true },
      });

      if (!tx) {
        this.logger.warn(
          `Transaksi ${data.order_id} tidak ditemukan atau sudah dihapus`,
          this.context,
        );
        throw new HttpException('Transaksi tidak ditemukan', 404);
      }

      const newStatus = MidtransHelpers.mapTransactionStatus(
        data.transaction_status,
      );

      await this.prisma.transaction.update({
        where: { id: tx.id },
        data: {
          fraud_status: data.fraud_status,
          status: newStatus as PaymentStatus,
          settlement_time: data.settlement_time
            ? new Date(data.settlement_time)
            : null,
        },
      });

      if ((newStatus as PaymentStatus) === PaymentStatus.paid) {
        await this.prisma.order.update({
          where: { id: tx.order_id },
          data: {
            status: OrderStatus.completed,
            payment_status: PaymentStatus.paid,
          },
        });
      }

      this.logger.log(
        `Callback: ${data.transaction_id} -> ${newStatus}`,
        this.context,
      );
    } catch (error: any) {
      const errorMessage =
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : String(error);

      this.logger.error(
        `Gagal memproses callback Midtrans untuk order_id ${data.order_id}: ${errorMessage}`,
        this.context,
        typeof error === 'string' ? error : JSON.stringify(error),
      );

      throw error;
    }
  }
}
