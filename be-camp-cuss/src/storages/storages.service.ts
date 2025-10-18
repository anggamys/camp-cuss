import {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SignedUrlResponse {
  data: { signedUrl: string } | null;
  error: { message: string } | null;
}

export interface UploadedFileResult {
  key: string; // hanya file key, tanpa URL
}

@Injectable()
export class StoragesService {
  private readonly s3: S3Client;
  private readonly bucketPublic: string;
  private readonly bucketPrivate: string;
  private readonly baseUrl: string;
  private readonly supabase: SupabaseClient<any, any, any>;

  constructor(private readonly config: ConfigService) {
    this.bucketPublic = this.getEnv('S3_BUCKET_PUBLIC');
    this.bucketPrivate = this.getEnv('S3_BUCKET_PRIVATE');
    this.baseUrl = this.getEnv('SUPABASE_PUBLIC_URL');

    this.s3 = new S3Client({
      region: this.getEnv('S3_REGION'),
      endpoint: this.getEnv('S3_ENDPOINT'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.getEnv('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.getEnv('S3_SECRET_ACCESS_KEY'),
      },
    });

    this.supabase = createClient(
      this.getEnv('SUPABASE_PUBLIC_URL'),
      this.getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  // === Upload file ===
  async upload(
    file: Express.Multer.File,
    targetPath: string,
    isPrivate = false,
  ): Promise<UploadedFileResult> {
    if (!file) throw new BadRequestException('File wajib diunggah');

    const bucket = isPrivate ? this.bucketPrivate : this.bucketPublic;
    const fileKey = this.generateFileKey(targetPath, file.originalname);

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: isPrivate ? undefined : 'public-read',
        }),
      );

      // hanya return key, tanpa URL
      return { key: fileKey };
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      throw new HttpException(`Upload gagal: ${msg}`, HttpStatus.BAD_REQUEST);
    }
  }

  // === Hapus file ===
  async delete(fileKey: string, isPrivate = false): Promise<void> {
    if (!fileKey) return;
    const bucket = isPrivate ? this.bucketPrivate : this.bucketPublic;
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: fileKey }),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      throw new HttpException(
        `Hapus file gagal: ${msg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // === Buat signed URL untuk akses private ===
  async createSignedUrl(fileKey: string, expiresIn = 3600): Promise<string> {
    const response = (await this.supabase.storage
      .from(this.bucketPrivate)
      .createSignedUrl(fileKey, expiresIn)) as SignedUrlResponse;

    if (response.error)
      throw new HttpException(
        response.error.message || 'Failed to create signed URL',
        HttpStatus.BAD_REQUEST,
      );

    if (!response.data?.signedUrl)
      throw new HttpException('No signed URL returned', HttpStatus.BAD_REQUEST);

    return response.data.signedUrl;
  }

  // === Helper umum ===
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
}
