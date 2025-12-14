import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Env } from '../../common/constants/env.constant';

@Injectable()
export class StorageS3Service {
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: Env.S3_REGION,
      endpoint: Env.S3_ENDPOINT,
      forcePathStyle: true,
      maxAttempts: 3, // retry
      credentials: {
        accessKeyId: Env.S3_ACCESS_KEY_ID,
        secretAccessKey: Env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(
    bucket: string,
    key: string,
    body: Buffer,
    mime: string,
    isPrivate = false,
  ) {
    return this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: mime,
        ACL: isPrivate ? undefined : 'public-read',
      }),
    );
  }

  async deleteFile(bucket: string, key: string) {
    return this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}
