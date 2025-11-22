import { Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppLoggerService } from '../loggers/app-logger.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';
const context = 'RedisProvider';

export const RedisProvider: Provider[] = [
  {
    provide: REDIS_CLIENT,
    useFactory: (logger: AppLoggerService): Redis => {
      const url = process.env.REDIS_URL || '';
      const client = new Redis(url);

      client.on('error', (err) =>
        logger.error(`[Redis] Error: ${err.message}`, context),
      );
      client.on('connect', () =>
        logger.log(`[Redis] Connected (publisher) -> ${url}`, context),
      );

      return client;
    },
    inject: [AppLoggerService],
  },
  {
    provide: REDIS_SUBSCRIBER,
    useFactory: (logger: AppLoggerService): Redis => {
      const url = process.env.REDIS_URL || '';
      const subscriber = new Redis(url);

      subscriber.on('error', (err) =>
        logger.error(`[Redis] Subscriber error: ${err.message}`, context),
      );
      subscriber.on('connect', () =>
        logger.log(`[Redis] Subscriber connected -> ${url}`, context),
      );

      return subscriber;
    },
    inject: [AppLoggerService],
  },
];
