import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env } from '../../common/constants/env.constant';
import { AppLoggerService } from '../../common/loggers/app-logger.service';

@Injectable()
export class StorageSupabaseService {
  private readonly supabase: SupabaseClient<any, any, any, any, any>;
  private readonly context = StorageSupabaseService.name;

  constructor(private readonly logger: AppLoggerService) {
    this.supabase = createClient(
      Env.SUPABASE_URL,
      Env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  async createSignedUrl(fileKey: string, expiresIn = 3600): Promise<string> {
    const response = await this.supabase.storage
      .from(Env.S3_BUCKET_PRIVATE)
      .createSignedUrl(fileKey, expiresIn);

    if (response.error || !response.data?.signedUrl) {
      this.logger.error(
        `Signed URL gagal: ${response.error?.message}`,
        this.context,
      );
      throw new HttpException(
        'Gagal membuat signed URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.debug(`Signed URL created: ${fileKey}`, this.context);
    return response.data.signedUrl;
  }

  buildPublicUrl(fileKey: string): string {
    return `${Env.SUPABASE_URL}/storage/v1/object/public/${Env.S3_BUCKET_PUBLIC}/${fileKey}`;
  }
}
