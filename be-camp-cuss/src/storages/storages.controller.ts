import {
  Controller,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { StoragesService } from './storages.service';
import { UsersService } from '../users/users.service';
import { User } from '../common/decorators/user.decorator';
import { DestinationsService } from '../destinations/destinations.service';

interface UploadConfig {
  folder: string;
  isPrivate: boolean;
  oldKey?: string | null;
  update: (
    uid: number,
    fileKey: string,
  ) => Promise<{ id: number; [key: string]: any }>;
}

interface UploadResponse {
  status: string;
  message: string;
  data: { id: number; [key: string]: any };
}

@UseGuards(JwtAuthGuard)
@Controller('storages')
export class StoragesController {
  constructor(
    private readonly storages: StoragesService,
    private readonly users: UsersService,
    private readonly destinations: DestinationsService,
  ) {}

  @Post('users/:id/upload/:type')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadUserFile(
    @User('id') accessUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('type') type: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponse> {
    if (accessUserId !== id)
      throw new HttpException('Akses ditolak', HttpStatus.FORBIDDEN);

    if (!file)
      throw new HttpException('File wajib diunggah', HttpStatus.BAD_REQUEST);

    const user = await this.users.findOne(id);

    // Mapping tiap tipe upload
    const mapping: Record<string, UploadConfig> = {
      'photo-profile': {
        folder: 'users/avatar',
        isPrivate: false,
        oldKey: user.photo_profile,
        update: (uid, fileKey) =>
          this.users.updateUserPhotoProfile(uid, fileKey),
      },
      'photo-id-card': {
        folder: 'users/id-cards',
        isPrivate: true,
        oldKey: user.photo_id_card,
        update: (uid, fileKey) => this.users.updatePhotoIdCard(uid, fileKey),
      },
      'photo-student-card': {
        folder: 'users/student-cards',
        isPrivate: true,
        oldKey: user.photo_student_card,
        update: (uid, fileKey) =>
          this.users.updatePhotoStudentCard(uid, fileKey),
      },
      'photo-driving-license': {
        folder: 'users/licenses',
        isPrivate: true,
        oldKey: user.photo_driving_license,
        update: (uid, fileKey) =>
          this.users.updatePhotoDrivingLicense(uid, fileKey),
      },
    };

    const config = mapping[type];
    if (!config)
      throw new HttpException(
        `Tipe upload '${type}' tidak dikenal`,
        HttpStatus.BAD_REQUEST,
      );

    // Hapus file lama (jika ada)
    if (config.oldKey) {
      await this.storages
        .delete(config.oldKey, config.isPrivate)
        .catch(console.error);
    }

    // Upload file baru dan simpan fileKey di database
    const uploaded = await this.storages.upload(
      file,
      config.folder,
      config.isPrivate,
    );
    const updatedUser = await config.update(id, uploaded.key);

    return {
      status: 'success',
      message: `Upload ${type} berhasil`,
      data: updatedUser,
    };
  }

  @Post('destinations/:id/upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadDestinationFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponse> {
    if (!file)
      throw new HttpException('File wajib diunggah', HttpStatus.BAD_REQUEST);

    const destination = await this.destinations.findOne(id);

    // Hapus file lama (jika ada)
    if (destination.image_place) {
      await this.storages
        .delete(destination.image_place, true)
        .catch(console.error);
    }

    // Upload file baru dan simpan fileKey di database
    const uploaded = await this.storages.upload(file, 'destinations', false);
    const updatedDestination = await this.destinations.updateImagePlace(
      id,
      uploaded.key,
    );

    return {
      status: 'success',
      message: `Upload image_place berhasil`,
      data: updatedDestination,
    };
  }
}
