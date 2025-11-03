import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { PrismaErrorHelper } from '../../common/helpers/prisma-error.helper';
import { Order, OrderStatus, UserRole } from '@prisma/client';

@Injectable()
export class OrdersDriverService {
  private readonly logger = new Logger(OrdersDriverService.name);

  constructor(private readonly prisma: PrismaService) {}

  async acceptOrder(orderId: number, driverId: number): Promise<Order> {
    try {
      const [order, driver] = await this.prisma.$transaction([
        this.prisma.order.findUnique({ where: { id: orderId } }),
        this.prisma.user.findUnique({ where: { id: driverId } }),
      ]);

      if (!order)
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      if (!driver || driver.role !== UserRole.driver)
        throw new HttpException(
          'Pengguna bukan driver',
          HttpStatus.BAD_REQUEST,
        );
      if (order.status !== OrderStatus.pending)
        throw new HttpException('Pesanan sudah diambil', HttpStatus.CONFLICT);

      const updated = await this.prisma.order.update({
        where: { id: orderId },
        data: { driver_id: driverId, status: OrderStatus.accepted },
      });

      this.logger.log(`Pesanan ${orderId} diterima oleh driver ${driverId}`);
      return updated;
    } catch (e) {
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }

  async completeOrder(orderId: number, driverId: number): Promise<Order> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!order)
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      if (order.driver_id !== driverId)
        throw new HttpException('Tidak berwenang', HttpStatus.FORBIDDEN);
      if (order.status !== OrderStatus.accepted)
        throw new HttpException(
          'Pesanan belum diterima',
          HttpStatus.BAD_REQUEST,
        );

      const updated = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.completed },
      });

      this.logger.log(
        `Pesanan ${orderId} diselesaikan oleh driver ${driverId}`,
      );
      return updated;
    } catch (e) {
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }
}
