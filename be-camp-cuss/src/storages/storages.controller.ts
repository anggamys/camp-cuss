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

@UseGuards(JwtAuthGuard)
@Controller('storages')
export class StoragesController {
  constructor(
    private readonly storages: StoragesService,
    private readonly users: UsersService,
  ) {}

  @Post('users/:id/photo-profile')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadUserPhoto(
    @User('id') accessUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (accessUserId !== id) {
      throw new HttpException('Akses ditolak', HttpStatus.FORBIDDEN);
    }

    if (!file) {
      throw new HttpException('File wajib diunggah', HttpStatus.BAD_REQUEST);
    }

    const user = await this.users.findOne(id);

    // Hapus foto lama (jika ada)
    if (user.photo_profile) {
      const oldFileKey = this.extractFileKey(user.photo_profile);
      if (oldFileKey) {
        await this.storages.delete(oldFileKey).catch(console.error);
      }
    }

    // Upload file baru ke Supabase Storage
    const uploaded = await this.storages.upload(file, 'users/avatar');

    if (!uploaded.url) {
      throw new HttpException(
        'Gagal mengunggah foto profil',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update URL foto profil di tabel user
    const updatedUser = await this.users.updateUserPhotoProfile(
      id,
      uploaded.url,
    );

    return {
      status: 'success',
      message: 'Foto profil diperbarui',
      data: updatedUser,
    };
  }

  private extractFileKey(url: string): string {
    // Ambil key setelah 'uploads/'
    const parts = url.split('/uploads/');
    return parts[1] ?? '';
  }
}
