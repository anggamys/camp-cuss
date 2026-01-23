import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrdersBroadcastService } from './orders-broadcast.service';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { Role } from '../../common/enums/user.enum';
import { ApiQueryParams } from '../../common/types/api-request.interface';
import { MetaResponse } from '../../common/types/api-response.interface';
import { ErrorHelper } from '../../common/helpers/error.helper';
import { OrderResponseDto, toResponseDto } from '../dto/order-response.dto';
import { OrderStatus } from '../../common/enums/order.enum';

@Injectable()
export class OrdersCoreService {
  private readonly context = OrdersCoreService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly broadcast: OrdersBroadcastService,
  ) {}

  async create(
    customerId: number,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
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
        include: { driver: true, customer: true },
      });

      this.logger.log(
        `Pesanan #${order.id} berhasil dibuat oleh user ${customerId}`,
        this.context,
      );

      if ((order.status as OrderStatus) === OrderStatus.pending) {
        this.logger.debug(
          `Menjadwalkan broadcast untuk order #${order.id}`,
          this.context,
        );

        this.broadcast.broadcastAndSchedule(
          order.id,
          toResponseDto({
            ...order,
            driver: order.driver === null ? undefined : order.driver,
          }),
        );
      }

      return toResponseDto({
        ...order,
        driver: order.driver === null ? undefined : order.driver,
      });
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
  ): Promise<{ data: OrderResponseDto[]; meta: MetaResponse }> {
    try {
      const where: { driver_id?: number; customer_id?: number } = {};

      if (role === Role.Driver) {
        where.driver_id = userId;
      } else if (role === Role.Customer) {
        where.customer_id = userId;
      }

      const page = Number(query.page) > 0 ? Number(query.page) : 1;
      const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
      const skip = (page - 1) * limit;

      this.logger.debug(
        `FindAllOrders: role=${role}, userId=${userId}, page=${page}, limit=${limit}, where=${JSON.stringify(where)}`,
        this.context,
      );

      const [rawData, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          include: { customer: true, driver: true },
          orderBy: { id: 'desc' },
        }),
        this.prisma.order.count({ where }),
      ]);

      const data: OrderResponseDto[] = rawData.map((order) =>
        toResponseDto({
          ...order,
          driver: order.driver === null ? undefined : order.driver,
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

  async findOne(id: number): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: { customer: true, driver: true },
      });

      if (!order) {
        this.logger.warn(`Pesanan #${id} tidak ditemukan`, this.context);

        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }
      return toResponseDto({
        ...order,
        driver: order.driver === null ? undefined : order.driver,
      });
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal mengambil data pesanan #${id}`,
      );
    }
  }

  async update(id: number, dto: UpdateOrderDto): Promise<OrderResponseDto> {
    try {
      const updated = await this.prisma.order.update({
        where: { id },
        data: dto,
        include: { driver: true, customer: true },
      });

      this.logger.log(`Pesanan #${id} diperbarui`, this.context);

      return toResponseDto({
        ...updated,
        driver: updated.driver === null ? undefined : updated.driver,
      });
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
