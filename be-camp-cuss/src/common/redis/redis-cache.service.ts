import { Injectable, Inject } from '@nestjs/common';
import { RedisBaseService } from './redis-base.service';
import { AppLoggerService } from '../loggers/app-logger.service';
import { REDIS_CLIENT } from './redis.provider';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService extends RedisBaseService {
  constructor(@Inject(REDIS_CLIENT) redis: Redis, logger: AppLoggerService) {
    super(redis, logger);
  }

  async setCache(key: string, value: unknown, ttl = 60) {
    await this.set(`cache:${key}`, value, ttl);
  }

  async getCache<T>(key: string): Promise<T | null> {
    const data = await this.get(`cache:${key}`);
    return data ? (JSON.parse(data) as T) : null;
  }
}
