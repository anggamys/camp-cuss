import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { OrderStatus } from '../../common/enums/order.enum';
import { ErrorHelper } from '../../common/helpers/error.helper';
import { OrderResponseDto, toResponseDto } from '../dto/order-response.dto';

@Injectable()
export class OrdersCustomerService {
  private readonly context = OrdersCustomerService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async cancelOrder(
    orderId: number,
    customerId: number,
  ): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order)
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );

      if (order.customer_id !== customerId)
        throw new HttpException('Tidak berwenang', HttpStatus.FORBIDDEN);

      if (order.status === String(OrderStatus.completed))
        throw new HttpException(
          'Pesanan sudah selesai',
          HttpStatus.BAD_REQUEST,
        );

      const updated = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.canceled, driver_id: null },
      });

      this.logger.warn(
        `Pesanan ${orderId} dibatalkan oleh user ${customerId}`,
        this.context,
      );

      const data: OrderResponseDto = toResponseDto({
        ...updated,
      });

      return data;
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal membatalkan pesanan #${orderId} untuk customer #${customerId}`,
      );
    }
  }
}
