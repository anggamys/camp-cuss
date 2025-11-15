import { Injectable, Inject } from '@nestjs/common';
import { RedisBaseService } from './redis-base.service';
import { AppLoggerService } from '../loggers/app-logger.service';
import { REDIS_CLIENT } from './redis.provider';
import { Redis } from 'ioredis';

export interface DriverLocationData {
  driver_id: number;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

@Injectable()
export class RedisLocationService extends RedisBaseService {
  private readonly channel = 'driver:location';
  private readonly cacheKeyPrefix = 'driver:location:';
  private readonly cacheTTL = 60; // detik

  constructor(@Inject(REDIS_CLIENT) redis: Redis, logger: AppLoggerService) {
    super(redis, logger);
  }

  async publishLocationUpdate(data: DriverLocationData): Promise<void> {
    const payload = { ...data, timestamp: data.timestamp ?? Date.now() };
    await this.publish(this.channel, payload);
    await this.set(
      `${this.cacheKeyPrefix}${data.driver_id}`,
      payload,
      this.cacheTTL,
    );
  }

  async getLastLocation(driverId: number): Promise<DriverLocationData | null> {
    const cache = await this.get(`${this.cacheKeyPrefix}${driverId}`);
    return cache ? (JSON.parse(cache) as DriverLocationData) : null;
  }
}
