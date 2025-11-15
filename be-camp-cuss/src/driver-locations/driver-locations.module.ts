import { forwardRef, Module } from '@nestjs/common';
import { DriverLocationsService } from './driver-locations.service';
import { DriverLocationsGateway } from './driver-locations.gateway';
import { PrismaService } from '../prisma/prisma.services';
import { RedisLocationService } from '../common/redis/redis-location.service';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { RedisLocationModule } from '../common/redis/redis-location.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [forwardRef(() => CommonModule), RedisLocationModule],
  providers: [
    DriverLocationsService,
    DriverLocationsGateway,
    PrismaService,
    RedisLocationService,
    AppLoggerService,
  ],
  exports: [DriverLocationsService],
})
export class DriverLocationsModule {}
