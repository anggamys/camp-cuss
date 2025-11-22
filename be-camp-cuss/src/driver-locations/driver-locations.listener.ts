import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_SUBSCRIBER } from '../common/redis/redis.provider';
import { DriverLocationsGateway } from './driver-locations.gateway';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { RedisChannel } from '../common/enums/redis.enum';
import { DriverLocationData } from '../common/types/driver.interface';

@Controller()
export class DriverLocationsListener implements OnModuleInit {
  private readonly context = 'DriverLocationsListener';

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly subscriber: Redis,
    private readonly gateway: DriverLocationsGateway,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit() {
    await this.subscriber.subscribe(
      RedisChannel.DRIVER_ACTIVE_LOCATION,
      RedisChannel.DRIVER_AVAILABLE_LOCATION,
    );

    this.subscriber.on('message', (channel, message) => {
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
        this.logger.debug(
          `Broadcast lokasi driver ${data.driver_id} ke channel ${channel}`,
          this.context,
        );
        this.gateway.broadcastToAvailableDrivers(data);
      }
    });

    this.logger.log(
      'Redis subscriber aktif untuk channel lokasi driver',
      this.context,
    );
  }
}
