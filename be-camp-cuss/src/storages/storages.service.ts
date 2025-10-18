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

@Injectable()
export class StoragesService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.getEnv('S3_BUCKET');
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
  }

  async upload(file: Express.Multer.File, targetPath: string) {
    if (!file) throw new BadRequestException('File wajib diunggah');

    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${randomUUID()}${ext}`;
    const fileKey = `${targetPath}/${safeName}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        }),
      );

      const publicUrl = `${this.baseUrl}/storage/v1/object/public/${this.bucket}/${fileKey}`;

      return { key: fileKey, url: publicUrl };
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      throw new HttpException(`Upload gagal: ${msg}`, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(fileKey: string) {
    if (!fileKey) return;
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: fileKey }),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      throw new HttpException(
        `Hapus file gagal: ${msg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private getEnv(name: string) {
    const value = this.config.get<string>(name) || process.env[name];
    if (!value)
      throw new HttpException(
        `Environment variable ${name} is required`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    return value;
  }
}
