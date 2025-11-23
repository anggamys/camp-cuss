import { HttpException, HttpStatus } from '@nestjs/common';

import { StoragesService } from '../../storages/storages.service';
import { AppLoggerService } from '../loggers/app-logger.service';

export interface EntityWithFiles {
  [key: string]: unknown;
}

export class StorageUrlHelper {
  private readonly loggerContext = StorageUrlHelper.name;

  private readonly publicFields = ['photo_profile', 'image_place'];
  private readonly privateFields = [
    'photo_driving_license',
    'photo_student_card',
    'photo_id_card',
  ];

  constructor(
    private readonly storages: StoragesService,
    private readonly logger: AppLoggerService,
  ) {}

  static create(
    storages: StoragesService,
    logger: AppLoggerService,
  ): StorageUrlHelper {
    return new StorageUrlHelper(storages, logger);
  }

  async buildFileUrls(entity: EntityWithFiles): Promise<EntityWithFiles> {
    if (!entity || typeof entity !== 'object') {
      this.logger.error(
        'Entity harus berupa object pada buildFileUrls',
        undefined,
        this.loggerContext,
      );
      throw new HttpException(
        'Entity harus berupa object',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = { ...entity };

    for (const field of Object.keys(entity)) {
      const value = entity[field] as string | null | undefined;
      if (!this.isValidFileValue(value)) continue;

      try {
        if (this.isPublicField(field)) {
          result[field] = this.storages.buildPublicUrl(value);
        } else if (this.isPrivateField(field)) {
          result[field] = await this.storages.createSignedUrl(value);
        }
      } catch (err) {
        this.logger.error(
          `Gagal membangun URL untuk field ${field}: ${(err as Error)?.message}`,
          (err as Error)?.stack,
          this.loggerContext,
        );
        throw new HttpException(
          `Gagal membangun URL untuk field ${field}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return result;
  }

  async buildFileUrlsForArray(
    entities: EntityWithFiles[],
  ): Promise<EntityWithFiles[]> {
    if (!Array.isArray(entities)) {
      this.logger.error(
        'Entities harus berupa array pada buildFileUrlsForArray',
        undefined,
        this.loggerContext,
      );
      throw new HttpException(
        'Entities harus berupa array',
        HttpStatus.BAD_REQUEST,
      );
    }

    return Promise.all(entities.map((entity) => this.buildFileUrls(entity)));
  }

  private isValidFileValue(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
  }

  private isPublicField(field: string): boolean {
    return this.publicFields.includes(field);
  }

  private isPrivateField(field: string): boolean {
    return this.privateFields.includes(field);
  }
}
