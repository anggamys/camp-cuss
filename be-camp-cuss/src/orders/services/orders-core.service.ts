import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { PrismaErrorHelper } from '../../common/helpers/prisma-error.helper';
import {
  CreateOrderDto,
  CreateOrderResponseDto,
} from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { Order, OrderStatus } from '@prisma/client';
import { OrdersBroadcastService } from './orders-broadcast.service';

@Injectable()
export class OrdersCoreService {
  private readonly logger = new Logger(OrdersCoreService.name);

  constructor(
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
      if (!destination)
        throw new HttpException(
          'Tempat tujuan tidak ditemukan',
          HttpStatus.BAD_REQUEST,
        );

      const order = await this.prisma.order.create({
        data: { ...dto, user_id: customerId },
      });

      this.logger.log(`Pesanan #${order.id} dibuat oleh user ${customerId}`);

      if (order.status === OrderStatus.pending) {
        this.broadcast.broadcastAndSchedule(order.id, order);
      }

      return order as CreateOrderResponseDto;
    } catch (e) {
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }

  async findAll(): Promise<Order[]> {
    try {
      return await this.prisma.order.findMany({
        orderBy: { created_at: 'desc' },
      });
    } catch (e) {
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }

  async findOne(id: number): Promise<Order> {
    try {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (!order)
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      return order;
    } catch (e) {
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    try {
      const existing = await this.prisma.order.findUnique({ where: { id } });
      if (!existing)
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );

      return await this.prisma.order.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      const existing = await this.prisma.order.findUnique({ where: { id } });
      if (!existing)
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );

      await this.prisma.order.delete({ where: { id } });
      return { message: `Pesanan ${id} berhasil dihapus` };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      PrismaErrorHelper.handle(e);
    }
  }
}
