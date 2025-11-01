import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Order, OrderStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.services';
import { PrismaErrorHelper } from '../common/helpers/prisma-error.helper';
import { CreateOrderDto, CreateOrderResponseDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersNotificationsGateway } from '../orders-notifications/orders-notifications.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersNotificationsGateway: OrdersNotificationsGateway,
  ) {}

  async create(dto: CreateOrderDto): Promise<CreateOrderResponseDto> {
    try {
      const order = await this.prisma.order.create({ data: dto });

      if (!order) {
        throw new HttpException(
          'Gagal membuat pesanan',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (order.status === OrderStatus.pending) {
        this.ordersNotificationsGateway.broadcastNewOrderAvailable(order);
      }

      return { ...order };
    } catch (error) {
      PrismaErrorHelper.handle(error);
      throw error;
    }
  }

  async findAll(): Promise<Order[]> {
    try {
      const result = await this.prisma.order.findMany({
        orderBy: { created_at: 'desc' },
      });

      if (result.length === 0) {
        throw new HttpException(
          'Tidak ada data pesanan ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      return result;
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async findOne(id: number): Promise<Order> {
    try {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (!order) {
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }
      return order;
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    try {
      await this.findOne(id);
      const updated = await this.prisma.order.update({
        where: { id },
        data: dto,
      });
      return updated;
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      await this.findOne(id);
      await this.prisma.order.delete({ where: { id } });
      return { message: `Pesanan ${id} berhasil dihapus` };
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async acceptOrder(orderId: number, driverId: number): Promise<Order> {
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

      const driver = await this.prisma.user.findUnique({
        where: { id: driverId },
      });

      if (driver?.role !== UserRole.driver) {
        throw new HttpException(
          'Pengguna bukan seorang driver',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (order.status !== OrderStatus.pending && order.driver_id !== null) {
        throw new HttpException(
          'Pesanan sudah diambil oleh driver lain',
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          driver_id: driverId,
          status: OrderStatus.accepted,
        },
      });

      return updatedOrder;
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  private scheduleRebroadcast(orderId: number): void {
    setTimeout(() => {
      void this.checkAndRebroadcast(orderId);
    }, 30_000);
  }

  private async checkAndRebroadcast(orderId: number): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (order && order.status === OrderStatus.pending) {
        this.ordersNotificationsGateway.broadcastNewOrderAvailable(order);

        this.scheduleRebroadcast(orderId);
      }
    } catch (error) {
      console.error('Error rebroadcasting order:', error);
    }
  }
}
