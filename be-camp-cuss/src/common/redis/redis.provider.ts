import { Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppLoggerService } from '../loggers/app-logger.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';
const CONTEXT = 'RedisProvider';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (logger: AppLoggerService): Redis => {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = new Redis(url);

    client.on('error', (err) => {
      logger.error(`[Redis] Connection error: ${err.message}`, CONTEXT);
    });

    client.on('connect', () => {
      logger.log(`[Redis] Connected to ${url}`, CONTEXT);
    });

    return client;
  },
  inject: [AppLoggerService],
};
