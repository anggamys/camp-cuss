import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DriverLocationsGateway } from './driver-locations.gateway';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { DriverLocationData } from '../common/types/driver.interface';
import { RedisChannel } from '../common/enums/redis.enum';

@Controller()
export class DriverLocationsListener {
  private readonly context: string;

  constructor(
    private readonly gateway: DriverLocationsGateway,
    private readonly logger: AppLoggerService,
  ) {}

  @EventPattern(RedisChannel.DRIVER_ACTIVE_LOCATION)
  handleActiveDriverLocation(@Payload() data: DriverLocationData) {
    if (!data?.order_id) return;

    const room = `order:${data.order_id}`;

    this.logger.debug(
      `Broadcast lokasi driver ${data.driver_id} ke room ${room}`,
      this.context,
    );

    this.gateway.broadcastToOrderRoom(room, data);
  }

  @EventPattern(RedisChannel.DRIVER_AVAILABLE_LOCATION)
  handleAvailableDriverLocation(@Payload() data: DriverLocationData) {
    const channel = RedisChannel.DRIVER_AVAILABLE_LOCATION;

    this.logger.debug(
      `Broadcast lokasi driver ${data.driver_id} ke channel ${channel}`,
      this.context,
    );

    this.gateway.broadcastToAvailableDrivers(data);
  }
}
