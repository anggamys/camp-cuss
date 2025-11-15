import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { RedisLocationService } from '../common/redis/redis-location.service';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { WsException } from '@nestjs/websockets';
import { normalizeWsError } from '../common/helpers/ws-error.helper';

@Injectable()
export class DriverLocationsService {
  private readonly context = 'DriverLocationsService';

  constructor(
    private readonly redisLocationService: RedisLocationService,
    private readonly logger: AppLoggerService,
  ) {}

  updateDriverLocation(driverId: number, data: UpdateDriverLocationDto) {
    try {
      if (
        typeof data.latitude !== 'number' ||
        typeof data.longitude !== 'number'
      ) {
        throw new WsException('Koordinat driver tidak valid');
      }

      const record = {
        driver_id: driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp ?? Date.now(),
        ...(typeof data.heading === 'number' && { heading: data.heading }),
        ...(typeof data.speed === 'number' && { speed: data.speed }),
      };

      this.redisLocationService.publishLocationUpdate(record);

      this.logger.debug(
        `Lokasi driver ${driverId} dikirim ke Redis`,
        this.context,
      );
    } catch (err) {
      this.logger.error(
        `Gagal update lokasi driver ${driverId}`,
        err instanceof Error ? err.stack : String(err),
        this.context,
      );
      throw normalizeWsError(err);
    }
  }
}
