import { Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppLoggerService } from '../loggers/app-logger.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';
const context = 'RedisProvider';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (logger: AppLoggerService): Redis => {
    const url = process.env.REDIS_URL || '';
    const client = new Redis(url);

    client.on('error', (err) => {
      logger.error(`[Redis] Kesalahan koneksi: ${err.message}`, context);
    });

    client.on('connect', () => {
      logger.log(`[Redis] Terhubung ke ${url}`, context);
    });

    return client;
  },

  inject: [AppLoggerService],
};
