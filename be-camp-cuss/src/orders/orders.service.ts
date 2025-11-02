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

  async create(
    customerId: number,
    dto: CreateOrderDto,
  ): Promise<CreateOrderResponseDto> {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id: dto.destination_id },
      });

      if (!destination) {
        throw new HttpException(
          'Tempat tujuan tidak ditemukan',
          HttpStatus.BAD_REQUEST,
        );
      }

      const order = await this.prisma.order.create({
        data: {
          ...dto,
          user_id: customerId,
        },
      });

      if (!order) {
        throw new HttpException(
          'Gagal membuat pesanan',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (order.status === OrderStatus.pending) {
        this.ordersNotificationsGateway.broadcastNewOrderAvailable(order);
        // Schedule rebroadcast to ensure drivers see the order
        this.scheduleRebroadcast(order.id);
      }

      return { ...order };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  async findAll(): Promise<Order[]> {
    try {
      const result = await this.prisma.order.findMany({
        orderBy: { created_at: 'desc' },
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      const orders = await this.prisma.order.findMany({
        where: { status },
        orderBy: { created_at: 'desc' },
      });

      return orders;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  async findByUserId(userId: number): Promise<Order[]> {
    try {
      const orders = await this.prisma.order.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });

      return orders;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  async findByDriverId(driverId: number): Promise<Order[]> {
    try {
      const orders = await this.prisma.order.findMany({
        where: { driver_id: driverId },
        orderBy: { created_at: 'desc' },
      });

      return orders;
    } catch (error) {
      if (error instanceof HttpException) throw error;
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
      if (error instanceof HttpException) throw error;
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
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      await this.findOne(id);
      await this.prisma.order.delete({ where: { id } });
      return { message: `Pesanan ${id} berhasil dihapus` };
    } catch (error) {
      if (error instanceof HttpException) throw error;
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

      if (!driver || driver.role !== UserRole.driver) {
        throw new HttpException(
          'Pengguna bukan seorang driver',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (order.status !== OrderStatus.pending || order.driver_id !== null) {
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
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  async completeOrder(orderId: number, driverId: number): Promise<Order> {
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
          'Anda tidak berwenang menyelesaikan pesanan ini',
          HttpStatus.FORBIDDEN,
        );
      }

      if (order.status !== OrderStatus.accepted) {
        throw new HttpException(
          'Pesanan belum dalam status diterima',
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.completed },
      });

      return updatedOrder;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  async cancelOrder(orderId: number, userId: number): Promise<Order> {
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

      if (order.user_id !== userId) {
        throw new HttpException(
          'Anda tidak berwenang membatalkan pesanan ini',
          HttpStatus.FORBIDDEN,
        );
      }

      if (order.status === OrderStatus.completed) {
        throw new HttpException(
          'Pesanan yang sudah selesai tidak dapat dibatalkan',
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.cancelled,
          driver_id: null, // Remove driver assignment if any
        },
      });

      return updatedOrder;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  private scheduleRebroadcast(orderId: number): void {
    try {
      setTimeout(() => {
        void this.checkAndRebroadcast(orderId);
      }, 30_000);
    } catch (error) {
      console.error('Error scheduling rebroadcast:', error);
    }
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
