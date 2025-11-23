import { Injectable } from '@nestjs/common';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { RedisLocationService } from '../common/redis/redis-location.service';
import { PrismaService } from '../prisma/prisma.services';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class DriverLocationsService {
  private readonly context = DriverLocationsService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly redisLocation: RedisLocationService,
  ) {}

  async updateDriverLocation(
    driverId: number,
    data: UpdateDriverLocationDto,
  ): Promise<void> {
    try {
      // validasi koordinat
      if (
        typeof data.latitude !== 'number' ||
        typeof data.longitude !== 'number' ||
        isNaN(data.latitude) ||
        isNaN(data.longitude)
      ) {
        throw new WsException('Koordinat tidak valid');
      }

      // cek apakah driver sedang punya order aktif
      const activeOrder = await this.prisma.order.findFirst({
        where: {
          driver_id: driverId,
          status: { in: ['accepted'] },
        },
        select: { id: true },
      });

      // data lokasi dasar
      const baseLocation = {
        driver_id: driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
        timestamp: data.timestamp ?? Date.now(),
      };

      if (activeOrder) {
        // publish ke channel aktif
        const location = { ...baseLocation, order_id: activeOrder.id };
        await this.redisLocation.publishActiveLocation(location);

        this.logger.log(
          `Lokasi driver ${driverId} (order ${activeOrder.id}) dipublish ke channel aktif`,
          this.context,
        );
      } else {
        // publish ke channel available
        await this.redisLocation.publishAvailableLocation(baseLocation);

        this.logger.log(
          `Lokasi driver ${driverId} dipublish ke channel available`,
          this.context,
        );
      }
    } catch (error) {
      if (error instanceof WsException) {
        this.logger.verbose(error.message, this.context);
      } else {
        this.logger.error(
          `Gagal update lokasi driver ${driverId}: ${error}`,
          (error as Error)?.stack,
          this.context,
        );
      }
      // biarkan gateway yang mengirim emitError ke client
      throw error;
    }
  }
}
