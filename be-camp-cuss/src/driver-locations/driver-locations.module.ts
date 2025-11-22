import { Module } from '@nestjs/common';
import { DriverLocationsService } from './driver-locations.service';
import { DriverLocationsGateway } from './driver-locations.gateway';
import { DriverLocationsListener } from './driver-locations.listener';
import { PrismaService } from '../prisma/prisma.services';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [DriverLocationsService, DriverLocationsGateway, PrismaService],
  controllers: [DriverLocationsListener],
  exports: [DriverLocationsService],
})
export class DriverLocationsModule {}
