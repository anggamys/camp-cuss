import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { StorageS3Service } from './services/storage-s3.service';
import { StorageImageService } from './services/storage-image.service';
import { StorageSupabaseService } from './services/storage-supabase.service';
import { Env } from '../common/constants/env.constant';
import { UploadedFileResult } from './types/storages.interface';
import { getErrorMessage } from '../common/utils/error-utils';
import { isImageMime } from '../common/utils/file-utils';

@Injectable()
export class StoragesService {
  private readonly context = StoragesService.name;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly s3Service: StorageS3Service,
    private readonly imageService: StorageImageService,
    private readonly supabaseService: StorageSupabaseService,
  ) {}

  async upload(
    file: Express.Multer.File,
    targetPath: string,
    isPrivate = false,
  ): Promise<UploadedFileResult> {
    if (!file) {
      throw new HttpException('File wajib diunggah', HttpStatus.BAD_REQUEST);
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new HttpException(
        'Ukuran file maksimal 10MB',
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    const bucket = isPrivate ? Env.S3_BUCKET_PRIVATE : Env.S3_BUCKET_PUBLIC;
    const ext = path.extname(file.originalname);
    const fileKey = `${targetPath}/${Date.now()}-${randomUUID()}${ext}`;

    let fileBuffer = file.buffer;

    if (isImageMime(file.mimetype)) {
      fileBuffer = await this.imageService.compressImage(file);
    }

    try {
      await this.s3Service.uploadFile(
        bucket,
        fileKey,
        fileBuffer,
        file.mimetype,
        isPrivate,
      );
      this.logger.log(`File uploaded: ${fileKey}`, this.context);
      return { key: fileKey };
    } catch (err) {
      this.logger.error(`Upload gagal: ${getErrorMessage(err)}`, this.context);
      throw new HttpException('Upload gagal', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(fileKey: string, isPrivate = false): Promise<void> {
    const bucket = isPrivate ? Env.S3_BUCKET_PRIVATE : Env.S3_BUCKET_PUBLIC;
    try {
      await this.s3Service.deleteFile(bucket, fileKey);
      this.logger.log(`File deleted: ${fileKey}`, this.context);
    } catch (err) {
      this.logger.error(
        `Hapus file gagal: ${getErrorMessage(err)}`,
        this.context,
      );
      throw new HttpException(
        'Gagal menghapus file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createSignedUrl(fileKey: string, expiresIn = 3600): Promise<string> {
    return this.supabaseService.createSignedUrl(fileKey, expiresIn);
  }

  buildPublicUrl(fileKey: string): string {
    return this.supabaseService.buildPublicUrl(fileKey);
  }
}
