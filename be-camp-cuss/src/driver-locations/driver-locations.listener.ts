import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DriverLocationsGateway } from './driver-locations.gateway';
import { AppLoggerService } from '../common/loggers/app-logger.service';

interface DriverLocationEventData {
  driver_id: number;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

@Controller()
export class DriverLocationsListener {
  private readonly context = 'DriverLocationsListener';

  constructor(
    private readonly gateway: DriverLocationsGateway,
    private readonly logger: AppLoggerService,
  ) {}

  @EventPattern('driver:location')
  handleLocationEvent(@Payload() data: DriverLocationEventData) {
    this.logger.debug(
      `Broadcast lokasi driver ${data.driver_id} ke semua client`,
      this.context,
    );
    this.gateway.broadcastLocation(data);
  }
}
