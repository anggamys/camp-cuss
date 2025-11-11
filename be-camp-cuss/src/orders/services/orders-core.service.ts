import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { PrismaErrorHelper } from '../../common/helpers/prisma-error.helper';
import {
  CreateOrderDto,
  CreateOrderResponseDto,
} from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { Order, OrderStatus } from '@prisma/client';
import { OrdersBroadcastService } from './orders-broadcast.service';
import { AppLoggerService } from '../../common/loggers/app-logger.service';

@Injectable()
export class OrdersCoreService {
  private readonly context = 'OrdersCoreService';

  constructor(
    private readonly logger: AppLoggerService,
    private readonly prisma: PrismaService,
    private readonly broadcast: OrdersBroadcastService,
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
        this.logger.warn(
          `User ${customerId} mencoba membuat pesanan ke tujuan tidak valid (${dto.destination_id})`,
          this.context,
        );
        throw new HttpException(
          'Tempat tujuan tidak ditemukan',
          HttpStatus.BAD_REQUEST,
        );
      }

      const order = await this.prisma.order.create({
        data: { ...dto, user_id: customerId },
      });

      this.logger.log(
        `Pesanan #${order.id} berhasil dibuat oleh user ${customerId}`,
        this.context,
      );

      if (order.status === OrderStatus.pending) {
        this.logger.debug(
          `Menjadwalkan broadcast untuk order #${order.id}`,
          this.context,
        );

        this.broadcast.broadcastAndSchedule(order.id, order);
      }

      return order as CreateOrderResponseDto;
    } catch (e) {
      this.logger.error(
        `Gagal membuat pesanan untuk user ${customerId}`,
        e instanceof Error ? e.stack : String(e),
        this.context,
      );

      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }

  async findAll(): Promise<Order[]> {
    try {
      const orders = await this.prisma.order.findMany({
        orderBy: { created_at: 'desc' },
      });
      this.logger.debug(
        `Mengambil ${orders.length} pesanan dari database`,
        this.context,
      );
      return orders;
    } catch (e) {
      this.logger.error(
        'Gagal mengambil daftar pesanan',
        e instanceof Error ? e.stack : String(e),
        this.context,
      );
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }

  async findOne(id: number): Promise<Order> {
    try {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (!order) {
        this.logger.warn(`Pesanan #${id} tidak ditemukan`, this.context);
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }
      return order;
    } catch (e) {
      this.logger.error(
        `Gagal mengambil pesanan #${id}`,
        e instanceof Error ? e.stack : String(e),
        this.context,
      );
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    try {
      const updated = await this.prisma.order.update({
        where: { id },
        data: dto,
      });

      this.logger.log(`Pesanan #${id} diperbarui`, this.context);
      return updated;
    } catch (e) {
      this.logger.error(
        `Gagal memperbarui pesanan #${id}`,
        e instanceof Error ? e.stack : String(e),
        this.context,
      );
      PrismaErrorHelper.handle(e);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      await this.prisma.order.delete({ where: { id } });
      this.logger.log(`Pesanan #${id} berhasil dihapus`, this.context);
      return { message: `Pesanan ${id} berhasil dihapus` };
    } catch (e) {
      this.logger.error(
        `Gagal menghapus pesanan #${id}`,
        e instanceof Error ? e.stack : String(e),
        this.context,
      );
      PrismaErrorHelper.handle(e);
    }
  }
}
