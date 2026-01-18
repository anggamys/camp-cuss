import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import {
  CreateOrderDto,
  CreateOrderResponseDto,
} from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { Order, OrderStatus, User } from '@prisma/client';
import { OrdersBroadcastService } from './orders-broadcast.service';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { Role } from '../../common/enums/user.enum';
import { ApiQueryParams } from '../../common/types/api-request.interface';
import { MetaResponse } from '../../common/types/api-response.interface';
import { PrismaHelper } from '../../common/helpers/prisma.helper';
import { ErrorHelper } from '../../common/helpers/error.helper';
import { FindOrderResponseDto } from '../dto/find-order.dto';

@Injectable()
export class OrdersCoreService {
  private readonly context = OrdersCoreService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly prismaHelper: PrismaHelper,
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
          {
            message: 'Tempat tujuan tidak ditemukan',
            error: '',
          },

          HttpStatus.BAD_REQUEST,
        );
      }

      const order = await this.prisma.order.create({
        data: { ...dto, customer_id: customerId, total_price: 5000 },
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

      const orderResp: CreateOrderResponseDto = { ...order };

      return orderResp;
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Gagal membuat pesanan baru',
      );
    }
  }

  async findAll(
    role: Role,
    userId: number,
    query: ApiQueryParams,
  ): Promise<{ data: FindOrderResponseDto[]; meta: MetaResponse }> {
    try {
      let where = {};

      if (role === Role.Driver) {
        where = { driver_id: userId };
      }
      if (role === Role.Customer) {
        where = { customer_id: userId };
      }

      const page =
        Number.isInteger(Number(query.page)) && Number(query.page) > 0
          ? Number(query.page)
          : 1;

      const limit =
        Number.isInteger(Number(query.limit)) && Number(query.limit) > 0
          ? Number(query.limit)
          : 10;

      const skip = (page - 1) * limit;

      const search = query.search
        ? {
            query: String(query.search),
            numericFields: ['id'],
            relations: [
              { name: 'customer', stringFields: ['username', 'email'] },
              { name: 'driver', stringFields: ['username', 'email'] },
            ],
          }
        : undefined;

      this.logger.debug(
        `FindAllOrders: role=${role}, userId=${userId}, page=${page}, limit=${limit}, search=${JSON.stringify(
          search,
        )}, where=${JSON.stringify(where)}`,
        this.context,
      );

      const [rawData, total] = await Promise.all([
        this.prismaHelper.findAllRecords('order', {
          where,
          skip,
          take: limit,
          include: { customer: true, driver: true },
          search,
        }),
        this.prisma.order.count({ where }),
      ]);

      const data: FindOrderResponseDto[] = rawData.map(
        (order: Order & { customer: User | null; driver: User | null }) => ({
          id: order.id,
          driverId: order.driver_id === null ? 0 : order.driver_id,
          customerId: order.customer_id,
          destinationId: order.destination_id,
          totalPrice: order.total_price,
          status: order.status,
          pickupLatitude: order.pick_up_latitude,
          pickupLongitude: order.pick_up_longitude,
          pickupLocation: order.pick_up_location,
          createdAt:
            order.created_at instanceof Date
              ? order.created_at.getTime()
              : order.created_at,
          updatedAt:
            order.updated_at instanceof Date
              ? order.updated_at.getTime()
              : order.updated_at,
          customerInfo: {
            id: order.customer?.id ?? 0,
            username: order.customer?.username ?? '',
            email: order.customer?.email ?? '',
            noPhone: order.customer?.no_phone ?? '',
          },
          driverInfo: {
            id: order.driver?.id ?? 0,
            username: order.driver?.username ?? '',
            email: order.driver?.email ?? '',
            noPhone: order.driver?.no_phone ?? '',
          },
        }),
      );

      return {
        data,
        meta: {
          page,
          per_page: limit,
          total,
          last_page: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Gagal mengambil daftar pesanan',
      );
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
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal mengambil data pesanan #${id}`,
      );
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
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal memperbarui data pesanan #${id}`,
      );
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      await this.prisma.order.delete({ where: { id } });
      this.logger.log(`Pesanan #${id} berhasil dihapus`, this.context);
      return { message: `Pesanan ${id} berhasil dihapus` };
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal menghapus data pesanan #${id}`,
      );
    }
  }
}
