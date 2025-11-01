import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { UsersUploadService } from './services/users-upload.service';
import { UsersApprovalService } from './services/users-approval.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StoragesModule } from '../storages/storages.module';

@Module({
  imports: [PrismaModule, StoragesModule],
  controllers: [UsersController],
  providers: [UsersService, UsersUploadService, UsersApprovalService],
  exports: [UsersService, UsersUploadService, UsersApprovalService],
})
export class UsersModule {}
