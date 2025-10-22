import { Module } from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { DestinationsController } from './destinations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StoragesModule } from '../storages/storages.module';

@Module({
  imports: [PrismaModule, StoragesModule],
  controllers: [DestinationsController],
  providers: [DestinationsService],
})
export class DestinationsModule {}
