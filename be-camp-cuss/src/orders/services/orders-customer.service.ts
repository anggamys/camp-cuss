import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { PrismaErrorHelper } from '../../common/helpers/prisma-error.helper';
import { Order, OrderStatus } from '@prisma/client';
import { AppLoggerService } from '../../common/loggers/app-logger.service';

@Injectable()
export class OrdersCustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findByUserId(userId: number): Promise<Order[]> {
    try {
      return await this.prisma.order.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });
    } catch (e) {
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }

  async cancelOrder(orderId: number, userId: number): Promise<Order> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order)
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );

      if (order.user_id !== userId)
        throw new HttpException('Tidak berwenang', HttpStatus.FORBIDDEN);

      if (order.status === OrderStatus.completed)
        throw new HttpException(
          'Pesanan sudah selesai',
          HttpStatus.BAD_REQUEST,
        );

      const updated = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.cancelled, driver_id: null },
      });

      this.logger.warn(`Pesanan ${orderId} dibatalkan oleh user ${userId}`);
      return updated;
    } catch (e) {
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }
}
