import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { Order, UserRole } from '@prisma/client';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { OrderStatus } from '../../common/enums/order.enum';
import { ErrorHelper } from '../../common/helpers/error.helper';
import { PrismaHelper } from '../../common/helpers/prisma.helper';
import { ChatsService } from '../../chats/chats.service';

@Injectable()
export class OrdersDriverService {
  private readonly context = OrdersDriverService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaHelper: PrismaHelper,
    private readonly chatsService: ChatsService,
    private readonly logger: AppLoggerService,
  ) {}

  async acceptOrder(orderId: number, driverId: number): Promise<Order> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const [order, driver] = await Promise.all([
          tx.order.findUnique({ where: { id: orderId } }),
          tx.user.findUnique({ where: { id: driverId } }),
        ]);

        if (!order) {
          throw new HttpException(
            'Pesanan tidak ditemukan',
            HttpStatus.NOT_FOUND,
          );
        }

        if (!driver || driver.role !== UserRole.driver) {
          throw new HttpException(
            'Pengguna bukan driver',
            HttpStatus.BAD_REQUEST,
          );
        }

        const activeOrder = await tx.order.findFirst({
          where: {
            driver_id: driverId,
            status: { in: [OrderStatus.accepted, OrderStatus.pending] },
          },
        });

        if (activeOrder) {
          this.logger.warn(
            `Driver ${driverId} masih memiliki order aktif #${activeOrder.id}`,
            this.context,
          );

          throw new HttpException(
            `Selesaikan pesanan #${activeOrder.id} terlebih dahulu`,
            HttpStatus.CONFLICT,
          );
        }

        if ((order.status as OrderStatus) === OrderStatus.canceled) {
          throw new HttpException(
            'Pesanan sudah dibatalkan',
            HttpStatus.BAD_REQUEST,
          );
        }

        if ((order.status as OrderStatus) !== OrderStatus.pending) {
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
          throw new HttpException(
            'Pesanan sudah diambil driver lain',
            HttpStatus.CONFLICT,
          );
        }

        this.logger.log(
          `Driver ${driverId} menerima pesanan #${orderId}`,
          this.context,
        );

        const updatedOrder = await tx.order.findUnique({
          where: { id: orderId },
        });

        await this.chatsService.createChatRoom({
          orderId: orderId,
          userIds: [driverId, order.customer_id],
        });

        return updatedOrder!;
      });
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal menerima pesanan #${orderId} oleh driver ${driverId}`,
      );
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
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      if (order.driver_id !== driverId) {
        throw new HttpException(
          'Tidak berwenang menyelesaikan pesanan ini',
          HttpStatus.FORBIDDEN,
        );
      }

      if ((order.status as OrderStatus) !== OrderStatus.accepted) {
        throw new HttpException('Pesanan belum aktif', HttpStatus.BAD_REQUEST);
      }

      const updated = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.completed },
      });

      await this.chatsService.closeChatRoom(orderId);

      this.logger.log(
        `Driver ${driverId} menyelesaikan pesanan #${orderId}`,
        this.context,
      );

      return updated;
    } catch (e) {
      ErrorHelper.handle(
        e,
        this.logger,
        this.context,
        `Gagal menyelesaikan pesanan #${orderId} oleh driver ${driverId}`,
      );
    }
  }
}
