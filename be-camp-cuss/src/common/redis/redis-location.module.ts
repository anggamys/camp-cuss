import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisLocationService } from './redis-location.service';
import { AppLoggerService } from '../loggers/app-logger.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'REDIS_SERVICE',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          const redisUrl = new URL(
            config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
          );

          return {
            transport: Transport.REDIS,
            options: {
              host: redisUrl.hostname,
              port: Number(redisUrl.port) || 6379,
              retryAttempts: 3,
              retryDelay: 1000,
            },
          };
        },
      },
    ]),
  ],
  providers: [RedisLocationService, AppLoggerService],
  exports: [RedisLocationService, ClientsModule],
})
export class RedisLocationModule {}
