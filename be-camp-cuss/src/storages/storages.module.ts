import { Module } from '@nestjs/common';
import { StoragesService } from './storages.service';
import { StoragesController } from './storages.controller';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.services';

@Module({
  controllers: [StoragesController],
  providers: [StoragesService, UsersService, PrismaService],
  exports: [StoragesService],
})
export class StoragesModule {}
