import { Module } from '@nestjs/common';
import { StoragesService } from './storages.service';
import { StoragesController } from './storages.controller';
import { PrismaService } from '../prisma/prisma.services';
import { DestinationsService } from '../destinations/destinations.service';
import { UsersUploadService } from '../users/services/users-upload.service';
import { StorageS3Service } from './services/storage-s3.service';
import { StorageImageService } from './services/storage-image.service';
import { StorageSupabaseService } from './services/storage-supabase.service';

@Module({
  controllers: [StoragesController],

  providers: [
    StoragesService,
    UsersUploadService,
    PrismaService,
    DestinationsService,
    StorageS3Service,
    StorageImageService,
    StorageSupabaseService,
  ],

  exports: [
    StoragesService,
    UsersUploadService,
    PrismaService,
    StorageS3Service,
    StorageImageService,
    StorageSupabaseService,
  ],
})
export class StoragesModule {}
