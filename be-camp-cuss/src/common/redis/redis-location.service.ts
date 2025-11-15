import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppLoggerService } from '../loggers/app-logger.service';

export interface DriverLocationData {
  driver_id: number;
  latitude: number;
  longitude: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

@Injectable()
export class RedisLocationService implements OnModuleDestroy {
  private readonly CHANNEL = 'driver:location';
  private readonly context = 'RedisLocationService';

  constructor(
    @Inject('REDIS_SERVICE') private readonly redisClient: ClientProxy,
    private readonly logger: AppLoggerService,
  ) {}

  publishLocationUpdate(data: DriverLocationData) {
    if (!this.isValidDriverLocationData(data)) {
      this.logger.warn('Data lokasi driver tidak valid', this.context);
      return;
    }

    this.logger.debug(
      `Publishing lokasi driver ${data.driver_id} ke Redis`,
      this.context,
    );

    this.redisClient.emit(this.CHANNEL, {
      ...data,
      timestamp: data.timestamp ?? Date.now(),
    });
  }

  private isValidDriverLocationData(data: unknown): data is DriverLocationData {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.driver_id === 'number' &&
      typeof d.latitude === 'number' &&
      typeof d.longitude === 'number' &&
      d.latitude >= -90 &&
      d.latitude <= 90 &&
      d.longitude >= -180 &&
      d.longitude <= 180
    );
  }

  async onModuleDestroy() {
    await this.redisClient.close();
    this.logger.log('Redis client closed', this.context);
  }
}
