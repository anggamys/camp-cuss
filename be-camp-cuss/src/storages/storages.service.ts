import {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SignedUrlResponse,
  UploadedFileResult,
} from './types/storages.interface';
import { Env } from '../common/constants/env.constant';
import { AppLoggerService } from '../common/loggers/app-logger.service';

@Injectable()
export class StoragesService {
  private readonly context = StoragesService.name;

  private readonly s3: S3Client;
  private readonly bucketPublic: string;
  private readonly bucketPrivate: string;
  private readonly baseUrl: string;
  private readonly supabase: SupabaseClient<any, any, any, any, any>;

  constructor(private readonly logger: AppLoggerService) {
    this.bucketPublic = Env.S3_BUCKET_PUBLIC;
    this.bucketPrivate = Env.S3_BUCKET_PRIVATE;
    this.baseUrl = Env.SUPABASE_PUBLIC_URL;

    this.s3 = new S3Client({
      region: Env.S3_REGION,
      endpoint: Env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: Env.S3_ACCESS_KEY_ID,
        secretAccessKey: Env.S3_SECRET_ACCESS_KEY,
      },
    });

    this.supabase = createClient(
      Env.SUPABASE_PUBLIC_URL,
      Env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  async upload(
    file: Express.Multer.File,
    targetPath: string,
    isPrivate = false,
  ): Promise<UploadedFileResult> {
    if (!file) {
      this.logger.warn('File wajib diunggah pada upload', this.context);
      throw new HttpException('File wajib diunggah', HttpStatus.BAD_REQUEST);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.logger.warn(
        `Ukuran file terlalu besar (${file.size} bytes) pada upload: ${file.originalname}`,
        this.context,
      );
      throw new HttpException(
        'Ukuran file terlalu besar. Maksimal 10MB',
        HttpStatus.BAD_REQUEST,
      );
    }

    const bucket = isPrivate ? this.bucketPrivate : this.bucketPublic;
    const fileKey = this.generateFileKey(targetPath, file.originalname);

    let fileBuffer = file.buffer;

    if (this.isImage(file.mimetype)) {
      try {
        // Validate image buffer
        if (!file.buffer || file.buffer.length === 0) {
          this.logger.error(
            `Buffer gambar kosong atau tidak valid pada upload: ${file.originalname}`,
            this.context,
          );
          throw new Error('Buffer gambar kosong atau tidak valid');
        }

        // Dynamic import for Sharp to handle module loading issues
        const sharp = (await import('sharp')).default;

        const sharpInstance = sharp(file.buffer).resize({
          width: 1280,
          withoutEnlargement: true,
        }); // resize maksimal 1280px

        // Convert to JPEG for consistency and better compression
        // except for PNG with transparency which we'll keep as PNG
        if (file.mimetype === 'image/png') {
          fileBuffer = await sharpInstance
            .png({ quality: 80, compressionLevel: 6 })
            .toBuffer();
        } else {
          fileBuffer = await sharpInstance.jpeg({ quality: 80 }).toBuffer();
        }
        this.logger.debug(
          `Image processed and compressed: ${file.originalname}`,
          this.context,
        );
      } catch (error) {
        const errorMsg = this.getErrorMessage(error);
        const fileInfo = this.getFileInfo(file);

        this.logger.error(
          `Image compression failed for ${fileInfo}: ${errorMsg}`,
          this.context,
        );
        // Use original file buffer as fallback
        this.logger.warn(
          'Using original file buffer as fallback',
          this.context,
        );
        fileBuffer = file.buffer;
      }
    }

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: fileKey,
          Body: fileBuffer,
          ContentType: file.mimetype,
          ACL: isPrivate ? undefined : 'public-read',
        }),
      );
      this.logger.log(
        `File uploaded: ${fileKey} (${file.mimetype}, ${file.size} bytes) to bucket: ${bucket}`,
        this.context,
      );
      return { key: fileKey };
    } catch (err) {
      this.logger.error(
        `Upload gagal untuk file: ${fileKey} (${file.mimetype}, ${file.size} bytes) - ${this.getErrorMessage(err)}`,
        this.context,
      );
      throw new HttpException(
        `Upload gagal: ${this.getErrorMessage(err)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(fileKey: string, isPrivate = false): Promise<void> {
    if (!fileKey) {
      this.logger.warn('File key kosong pada delete', this.context);
      return;
    }
    const bucket = isPrivate ? this.bucketPrivate : this.bucketPublic;
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: fileKey }),
      );
      this.logger.log(
        `File deleted: ${fileKey} from bucket: ${bucket}`,
        this.context,
      );
    } catch (err) {
      this.logger.error(
        `Hapus file gagal: ${fileKey} dari bucket: ${bucket} - ${this.getErrorMessage(err)}`,
        this.context,
      );
      throw new HttpException(
        `Hapus file gagal: ${this.getErrorMessage(err)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createSignedUrl(fileKey: string, expiresIn = 3600): Promise<string> {
    const response = (await this.supabase.storage
      .from(this.bucketPrivate)
      .createSignedUrl(fileKey, expiresIn)) as SignedUrlResponse;

    if (response.error) {
      this.logger.error(
        `Failed to create signed URL for: ${fileKey} - ${response.error.message}`,
        this.context,
      );
      throw new HttpException(
        response.error.message || 'Failed to create signed URL',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!response.data?.signedUrl) {
      this.logger.error(`No signed URL returned for: ${fileKey}`, this.context);
      throw new HttpException('No signed URL returned', HttpStatus.BAD_REQUEST);
    }

    this.logger.debug(
      `Signed URL created for: ${fileKey} (expires in ${expiresIn}s)`,
      this.context,
    );
    return response.data.signedUrl;
  }

  generateFileKey(targetPath: string, originalName: string): string {
    const ext = path.extname(originalName);
    const safeName = `${Date.now()}-${randomUUID()}${ext}`;
    return `${targetPath}/${safeName}`;
  }

  buildPublicUrl(fileKey: string): string {
    return `${this.baseUrl}/storage/v1/object/public/${this.bucketPublic}/${fileKey}`;
  }

  extractFileKey(url: string): string {
    const match = url.match(/uploads-(?:public|private)\/(.+)/);
    return match ? match[1] : '';
  }

  private isImage(mime: string): boolean {
    const supportedFormats = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/tiff',
      'image/bmp',
    ];
    return supportedFormats.includes(mime.toLowerCase());
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }

  private getFileInfo(file: Express.Multer.File): string {
    return `${file.originalname} (${file.mimetype}, ${file.size} bytes)`;
  }
}
