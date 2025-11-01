import {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageEnvKeys } from '../common/enums/env-keys.enum';
import {
  SignedUrlResponse,
  UploadedFileResult,
} from './types/storages.interface';

@Injectable()
export class StoragesService {
  private readonly s3: S3Client;
  private readonly bucketPublic: string;
  private readonly bucketPrivate: string;
  private readonly baseUrl: string;
  private readonly supabase: SupabaseClient<any, any, any, any, any>;

  constructor(private readonly config: ConfigService) {
    this.bucketPublic = this.getEnv(StorageEnvKeys.S3_BUCKET_PUBLIC);
    this.bucketPrivate = this.getEnv(StorageEnvKeys.S3_BUCKET_PRIVATE);
    this.baseUrl = this.getEnv(StorageEnvKeys.SUPABASE_PUBLIC_URL);

    this.s3 = new S3Client({
      region: this.getEnv(StorageEnvKeys.S3_REGION),
      endpoint: this.getEnv(StorageEnvKeys.S3_ENDPOINT),
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.getEnv(StorageEnvKeys.S3_ACCESS_KEY_ID),
        secretAccessKey: this.getEnv(StorageEnvKeys.S3_SECRET_ACCESS_KEY),
      },
    });

    this.supabase = createClient(
      this.getEnv(StorageEnvKeys.SUPABASE_PUBLIC_URL),
      this.getEnv(StorageEnvKeys.SUPABASE_SERVICE_ROLE_KEY),
    );
  }

  async upload(
    file: Express.Multer.File,
    targetPath: string,
    isPrivate = false,
  ): Promise<UploadedFileResult> {
    if (!file)
      throw new HttpException('File wajib diunggah', HttpStatus.BAD_REQUEST);

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
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
      } catch (error) {
        const errorMsg = this.getErrorMessage(error);
        const fileInfo = this.getFileInfo(file);

        // Log the error for debugging but don't fail the upload
        console.error(`Image compression failed for ${fileInfo}: ${errorMsg}`);

        // Use original file buffer as fallback
        console.log('Using original file buffer as fallback');
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

      return { key: fileKey };
    } catch (err) {
      throw new HttpException(
        `Upload gagal: ${this.getErrorMessage(err)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(fileKey: string, isPrivate = false): Promise<void> {
    if (!fileKey) return;
    const bucket = isPrivate ? this.bucketPrivate : this.bucketPublic;
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: fileKey }),
      );
    } catch (err) {
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
      throw new HttpException(
        response.error.message || 'Failed to create signed URL',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!response.data?.signedUrl)
      throw new HttpException('No signed URL returned', HttpStatus.BAD_REQUEST);

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

  private getEnv(name: string): string {
    const value = this.config.get<string>(name) || process.env[name];
    if (!value)
      throw new HttpException(
        `Environment variable ${name} is required`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    return value;
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
