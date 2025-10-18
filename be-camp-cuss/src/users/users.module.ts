import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StoragesModule } from '../storages/storages.module';

@Module({
  imports: [PrismaModule, StoragesModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
