import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { PrismaErrorHelper } from '../../common/helpers/prisma-error.helper';
import { Order, UserRole } from '@prisma/client';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { OrderStatus } from '../../common/enums/order.enum';

@Injectable()
export class OrdersDriverService {
  private readonly context = OrdersDriverService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async acceptOrder(orderId: number, driverId: number): Promise<Order> {
    this.logger.debug(
      `Driver ${driverId} mencoba menerima pesanan #${orderId}`,
      this.context,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const [order, driver] = await Promise.all([
          tx.order.findUnique({ where: { id: orderId } }),
          tx.user.findUnique({ where: { id: driverId } }),
        ]);

        if (!order) {
          this.logger.warn(`Pesanan #${orderId} tidak ditemukan`, this.context);
          throw new HttpException(
            'Pesanan tidak ditemukan',
            HttpStatus.NOT_FOUND,
          );
        }

        if (!driver || driver.role !== UserRole.driver) {
          this.logger.debug(`User ${driverId} bukan driver`, this.context);
          throw new HttpException(
            'Pengguna bukan driver',
            HttpStatus.BAD_REQUEST,
          );
        }

        if (order.status === String(OrderStatus.canceled)) {
          this.logger.warn(
            `Pesanan #${orderId} sudah dibatalkan`,
            this.context,
          );
          throw new HttpException(
            'Pesanan sudah dibatalkan',
            HttpStatus.BAD_REQUEST,
          );
        }

        if (order.status !== String(OrderStatus.pending)) {
          this.logger.warn(
            `Pesanan #${orderId} tidak dalam status pending`,
            this.context,
          );
          throw new HttpException(
            'Pesanan tidak dapat diterima',
            HttpStatus.BAD_REQUEST,
          );
        }

        // Hindari race condition
        const updated = await tx.order.updateMany({
          where: { id: orderId, status: OrderStatus.pending },
          data: { driver_id: driverId, status: OrderStatus.accepted },
        });

        if (updated.count === 0) {
          this.logger.warn(
            `Pesanan #${orderId} sudah diambil driver lain`,
            this.context,
          );
          throw new HttpException('Pesanan sudah diambil', HttpStatus.CONFLICT);
        }

        this.logger.log(
          `Driver ${driverId} menerima pesanan #${orderId}`,
          this.context,
        );

        const updatedOrder = await tx.order.findUnique({
          where: { id: orderId },
        });
        if (!updatedOrder) {
          this.logger.error(
            `Pesanan #${orderId} tidak ditemukan setelah update`,
            undefined,
            this.context,
          );
          throw new HttpException(
            'Pesanan tidak ditemukan setelah update',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        return updatedOrder;
      });
    } catch (e) {
      // hanya log error berat (bukan error bisnis seperti 400/409)
      if (!(e instanceof HttpException)) {
        this.logger.error(
          `Kesalahan tak terduga saat menerima pesanan #${orderId} oleh driver ${driverId}`,
          e instanceof Error ? e.stack : String(e),
          this.context,
        );
        PrismaErrorHelper.handle(e);
      } else {
        // cukup warn, bukan error
        this.logger.warn(`Operasi dibatalkan: ${e.message}`, this.context);
      }
      throw e;
    }
  }

  async completeOrder(orderId: number, driverId: number): Promise<Order> {
    this.logger.debug(
      `Driver ${driverId} mencoba menyelesaikan pesanan #${orderId}`,
      this.context,
    );

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        this.logger.warn(`Pesanan #${orderId} tidak ditemukan`, this.context);
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      if (order.driver_id !== driverId) {
        this.logger.warn(
          `Driver ${driverId} mencoba menyelesaikan pesanan milik ${order.driver_id}`,
          this.context,
        );
        throw new HttpException('Tidak berwenang', HttpStatus.FORBIDDEN);
      }

      if (order.status !== String(OrderStatus.accepted)) {
        this.logger.warn(
          `Pesanan #${orderId} belum dalam status accepted`,
          this.context,
        );
        throw new HttpException(
          'Pesanan belum diterima',
          HttpStatus.BAD_REQUEST,
        );
      }

      const updated = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.completed },
      });

      this.logger.log(
        `Driver ${driverId} menyelesaikan pesanan #${orderId}`,
        this.context,
      );
      return updated;
    } catch (e) {
      this.logger.error(
        `Gagal menyelesaikan pesanan #${orderId} oleh driver ${driverId}`,
        e instanceof Error ? e.stack : String(e),
        this.context,
      );
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }
}
