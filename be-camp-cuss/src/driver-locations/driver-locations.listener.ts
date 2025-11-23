import {
  Controller,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_SUBSCRIBER } from '../common/redis/redis.provider';
import { DriverLocationsGateway } from './driver-locations.gateway';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { RedisChannel } from '../common/enums/redis.enum';
import { DriverLocationData } from '../common/types/driver.interface';

@Controller()
export class DriverLocationsListener implements OnModuleInit, OnModuleDestroy {
  private readonly context = DriverLocationsListener.name;
  private isSubscribed = false;

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly subscriber: Redis,
    private readonly gateway: DriverLocationsGateway,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit() {
    try {
      await this.subscriber.subscribe(
        RedisChannel.DRIVER_ACTIVE_LOCATION,
        RedisChannel.DRIVER_AVAILABLE_LOCATION,
      );

      this.isSubscribed = true;
      this.logger.log(
        'Redis subscriber aktif untuk channel lokasi driver',
        this.context,
      );

      this.subscriber.on('message', (channel, message) => {
        try {
          const data = JSON.parse(message) as DriverLocationData;

          if (
            channel === String(RedisChannel.DRIVER_ACTIVE_LOCATION) &&
            data?.order_id
          ) {
            const room = `order:${data.order_id}`;
            this.logger.debug(
              `Broadcast lokasi driver ${data.driver_id} ke room ${room}`,
              this.context,
            );
            this.gateway.broadcastToOrderRoom(room, data);
          }

          if (channel === String(RedisChannel.DRIVER_AVAILABLE_LOCATION)) {
            this.logger.log(
              `Broadcast lokasi driver ${data.driver_id} ke channel ${channel}`,
              this.context,
            );

            this.gateway.broadcastToAvailableDrivers(data);
          }
        } catch (err) {
          this.logger.error(
            `Gagal memproses pesan Redis: ${err instanceof Error ? err.message : err}`,
            this.context,
          );
        }
      });

      this.subscriber.on('error', (err) =>
        this.logger.error(
          `Redis subscriber error: ${err.message}`,
          this.context,
        ),
      );
    } catch (err) {
      this.logger.error(
        `Gagal subscribe Redis channel: ${err instanceof Error ? err.message : err}`,
        this.context,
      );
    }
  }

  async onModuleDestroy() {
    if (this.isSubscribed) {
      await this.subscriber.unsubscribe(
        RedisChannel.DRIVER_ACTIVE_LOCATION,
        RedisChannel.DRIVER_AVAILABLE_LOCATION,
      );
      this.logger.log('Redis subscriber berhenti', this.context);
    }
  }
}
