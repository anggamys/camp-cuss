import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { UsersUploadService } from './services/users-upload.service';
import { UsersDriverRequestService } from './services/users-driver-request.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StoragesModule } from '../storages/storages.module';

@Module({
  imports: [PrismaModule, StoragesModule],
  controllers: [UsersController],
  providers: [UsersService, UsersUploadService, UsersDriverRequestService],
  exports: [UsersService, UsersUploadService, UsersDriverRequestService],
})
export class UsersModule {}
