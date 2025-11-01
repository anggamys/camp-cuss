import { Module } from '@nestjs/common';
import { StoragesService } from './storages.service';
import { StoragesController } from './storages.controller';
import { UsersService } from '../users/services/users.service';
import { PrismaService } from '../prisma/prisma.services';
import { DestinationsService } from '../destinations/destinations.service';
import { UsersUploadService } from '../users/services/users-upload.service';

@Module({
  controllers: [StoragesController],
  providers: [
    StoragesService,
    UsersService,
    UsersUploadService,
    PrismaService,
    DestinationsService,
  ],
  exports: [StoragesService],
})
export class StoragesModule {}
