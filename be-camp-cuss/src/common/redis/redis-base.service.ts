import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';
import { AppLoggerService } from '../loggers/app-logger.service';

@Injectable()
export class RedisBaseService {
  protected readonly context: string;

  constructor(
    @Inject(REDIS_CLIENT) protected readonly redis: Redis,
    protected readonly logger: AppLoggerService,
  ) {}

  async publish(channel: string, payload: unknown) {
    try {
      await this.redis.publish(channel, JSON.stringify(payload));
      this.logger.debug(`Redis publish -> ${channel}`, this.context);
    } catch (err) {
      this.logger.error(
        `Failed publish ${channel}: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
        this.context,
      );
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: unknown, ttl?: number) {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, val);
    } else {
      await this.redis.set(key, val);
    }
  }

  async del(key: string) {
    await this.redis.del(key);
  }
}
