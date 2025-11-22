import { Injectable, Inject } from '@nestjs/common';
import { RedisBaseService } from './redis-base.service';
import { AppLoggerService } from '../loggers/app-logger.service';
import { REDIS_CLIENT } from './redis.provider';
import { Redis } from 'ioredis';
import { DriverLocationData } from '../types/driver.interface';
import { RedisCacheKey, RedisChannel } from '../enums/redis.enum';

@Injectable()
export class RedisLocationService extends RedisBaseService {
  protected readonly context = 'RedisLocationService';
  private readonly baseTTL = 60;

  constructor(@Inject(REDIS_CLIENT) redis: Redis, logger: AppLoggerService) {
    super(redis, logger);
  }

  async publishActiveLocation(data: DriverLocationData): Promise<void> {
    const payload = { ...data, timestamp: data.timestamp ?? Date.now() };

    await Promise.all([
      this.publish(RedisChannel.DRIVER_ACTIVE_LOCATION, payload),
      this.set(
        `${RedisCacheKey.DRIVER_ACTIVE_LOCATION}${data.driver_id}`,
        payload,
        this.baseTTL,
      ),
    ]);

    this.logger.debug(
      `Lokasi driver ${data.driver_id} dipublish ke channel aktif`,
      this.context,
    );
  }

  async publishAvailableLocation(data: DriverLocationData): Promise<void> {
    const payload = { ...data, timestamp: data.timestamp ?? Date.now() };

    await Promise.all([
      this.publish(RedisChannel.DRIVER_AVAILABLE_LOCATION, payload),
      this.set(
        `${RedisCacheKey.DRIVER_AVAILABLE_LOCATION}${data.driver_id}`,
        payload,
        this.baseTTL,
      ),
    ]);

    this.logger.log(
      `Lokasi driver ${data.driver_id} dipublish ke channel ${RedisChannel.DRIVER_AVAILABLE_LOCATION}`,
      this.context,
    );
  }

  async getLastActiveLocation(
    driverId: number,
  ): Promise<DriverLocationData | null> {
    const cache = await this.get(
      `${RedisCacheKey.DRIVER_ACTIVE_LOCATION}${driverId}`,
    );

    return cache ? (JSON.parse(cache) as DriverLocationData) : null;
  }

  async getLastAvailableLocation(
    driverId: number,
  ): Promise<DriverLocationData | null> {
    const cache = await this.get(
      `${RedisCacheKey.DRIVER_AVAILABLE_LOCATION}${driverId}`,
    );
    return cache ? (JSON.parse(cache) as DriverLocationData) : null;
  }
}
