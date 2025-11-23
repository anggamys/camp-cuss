import { Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppLoggerService } from '../loggers/app-logger.service';
import { Env } from '../constants/env.constant';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';
const context = 'RedisProvider';

export const RedisProvider: Provider[] = [
  {
    provide: REDIS_CLIENT,
    useFactory: (logger: AppLoggerService): Redis => {
      const url = Env.REDIS_URL || '';
      const client = new Redis(url);
      client.on('connect', () =>
        logger.log(`[Redis] Publisher connected -> ${url}`, context),
      );
      client.on('error', (err) =>
        logger.error(`[Redis] Error: ${err.message}`, context),
      );
      return client;
    },
    inject: [AppLoggerService],
  },
  {
    provide: REDIS_SUBSCRIBER,
    useFactory: (client: Redis, logger: AppLoggerService): Redis => {
      const sub = client.duplicate();
      sub.on('connect', () =>
        logger.log(`[Redis] Subscriber connected (duplicate)`, context),
      );
      sub.on('error', (err) =>
        logger.error(`[Redis] Subscriber error: ${err.message}`, context),
      );
      return sub;
    },
    inject: [REDIS_CLIENT, AppLoggerService],
  },
];
