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
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { User } from '../common/decorators/user.decorator';
import { UsersUploadService } from '../users/services/users-upload.service';
import { DestinationsService } from '../destinations/destinations.service';
import { StoragesService } from './storages.service';
import {
  UploadConfig,
  UploadResponse,
} from './types/storages-controller.interface';

@UseGuards(JwtAuthGuard)
@Controller('storages')
export class StoragesController {
  constructor(
    private readonly usersUpload: UsersUploadService,
    private readonly storages: StoragesService,
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

    const mapping: Record<string, UploadConfig> = {
      'photo-profile': {
        field: 'photo_profile',
        folder: 'users/avatar',
        isPrivate: false,
      },
      'photo-id-card': {
        field: 'photo_id_card',
        folder: 'users/id-cards',
        isPrivate: true,
      },
      'photo-student-card': {
        field: 'photo_student_card',
        folder: 'users/student-cards',
        isPrivate: true,
      },
      'photo-driving-license': {
        field: 'photo_driving_license',
        folder: 'users/licenses',
        isPrivate: true,
      },
    };

    const config = mapping[type];
    if (!config)
      throw new HttpException(
        `Tipe upload '${type}' tidak dikenal`,
        HttpStatus.BAD_REQUEST,
      );

    const result = await this.usersUpload.updateUserFile(
      id,
      config.field,
      file,
      config.folder,
      config.isPrivate,
    );

    return {
      status: 'success',
      ...result,
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

    try {
      // Delegate upload and DB update to destinations service which expects the file
      const updatedDestination = await this.destinations.updateImagePlace(
        id,
        file,
      );

      return {
        status: 'success',
        message: 'Upload image_place berhasil',
        data: updatedDestination,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Gagal upload file destination',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
