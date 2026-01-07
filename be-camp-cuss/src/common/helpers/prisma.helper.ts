import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { Prisma } from '@prisma/client';
import { AppLoggerService } from '../loggers/app-logger.service';

@Injectable()
export class PrismaHelper {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAllRecords<M extends keyof PrismaService, T = unknown>(
    model: M,
    options?: {
      take?: number;
      skip?: number;
      select?: Record<string, any>;
      where?: Record<string, any>;
      orderBy?: Record<string, 'asc' | 'desc'>;
      include?: Record<string, any>;
      search?: {
        fields?: string[]; // Support multiple fields
        query: string;
        mode?: 'default' | 'insensitive';
        relation?: string;
        relationFields?: string[]; // Support multiple relation fields
      };
    },
  ): Promise<T[]> {
    const repo = this.prisma[model] as
      | { findMany?: (args?: any) => Promise<any[]> }
      | undefined;

    if (!repo || typeof repo.findMany !== 'function') {
      this.logger.error(
        `Model "${String(model)}" tidak valid untuk operasi findMany.`,
      );

      throw new Error(
        `Model "${String(model)}" tidak valid untuk operasi findMany.`,
      );
    }

    try {
      let where = options?.where ? { ...options.where } : {};

      // Support search in multiple columns and relation fields
      if (options?.search && options.search.query) {
        const searchMode = options.search.mode || 'insensitive';
        const searchQuery = options.search.query;

        const or: any[] = [];

        // Search in direct fields
        if (options.search.fields && Array.isArray(options.search.fields)) {
          for (const field of options.search.fields) {
            or.push({
              [field]: {
                contains: searchQuery,
                mode: searchMode,
              },
            });
          }
        }

        // Search in relation fields
        if (
          options.search.relation &&
          options.search.relationFields &&
          Array.isArray(options.search.relationFields)
        ) {
          for (const relField of options.search.relationFields) {
            or.push({
              [options.search.relation]: {
                [relField]: {
                  contains: searchQuery,
                  mode: searchMode,
                },
              },
            });
          }
        }

        if (or.length > 0) {
          where = {
            ...where,
            OR: or,
          };
        }
      }

      return (await repo.findMany({
        take: options?.take ?? 10,
        skip: options?.skip ?? 0,
        select: options?.select,
        include: options?.include,
        where,
        orderBy: options?.orderBy ?? { created_at: 'desc' },
      })) as T[];
    } catch (err) {
      this.logger.error(
        `Terjadi kesalahan saat mengambil data dari model "${String(model)}": ${
          err && typeof err === 'object' && err !== null && 'message' in err
            ? (err as { message: string }).message
            : String(err)
        }`,
        err &&
          typeof err === 'object' &&
          err !== null &&
          'stack' in err &&
          typeof (err as Record<string, unknown>).stack === 'string'
          ? (err as { stack: string }).stack
          : undefined,
      );

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(
          `Terjadi kesalahan pada Prisma: ${err.message}`,
        );
      }

      throw err;
    }
  }

  async findRecord<
    M extends keyof PrismaService,
    F extends string,
    V extends string | number,
    T = unknown,
  >(model: M, field: F, value: V): Promise<T | null> {
    const repo = this.prisma[model] as
      | { findUnique?: (args: any) => Promise<any> }
      | undefined;

    if (
      !repo ||
      typeof repo !== 'object' ||
      typeof repo.findUnique !== 'function'
    ) {
      this.logger.error(
        `Model "${String(model)}" bukan model Prisma yang valid.`,
      );

      throw new Error(
        `Model "${String(model)}" bukan model Prisma yang valid.`,
      );
    }

    try {
      return (await repo.findUnique({
        where: { [field]: value },
      } as any)) as T | null;
    } catch (err) {
      this.logger.error(
        `Terjadi kesalahan saat mencari data pada model "${String(model)}", field "${String(field)}", value "${value}": ${
          err && typeof err === 'object' && err !== null && 'message' in err
            ? (err as { message: string }).message
            : String(err)
        }`,
        err &&
          typeof err === 'object' &&
          err !== null &&
          'stack' in err &&
          typeof (err as Record<string, unknown>).stack === 'string'
          ? (err as { stack: string }).stack
          : undefined,
      );

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(
          `Terjadi kesalahan pada query Prisma: ${err.message}`,
        );
      }

      throw err;
    }
  }

  async assertUnique<
    M extends keyof PrismaService,
    F extends string,
    V extends string | number,
  >(model: M, field: F, value: V, message?: string) {
    const record = await this.findRecord(model, field, value);

    if (record) {
      this.logger.warn(
        `Validasi gagal: Nilai "${value}" pada field "${field}" sudah terdaftar di model "${String(model)}".`,
      );
      throw new BadRequestException({
        message:
          message ?? `Nilai "${value}" pada field "${field}" sudah digunakan.`,
        errors: { [field]: `Nilai "${value}" sudah digunakan.` },
      });
    }
  }

  async assertExists<
    M extends keyof PrismaService,
    F extends string,
    V extends string | number,
  >(model: M, field: F, value: V, message?: string) {
    const record = await this.findRecord(model, field, value);

    if (!record) {
      this.logger.warn(
        `Validasi gagal: Data dengan "${field}" bernilai "${value}" tidak ditemukan di model "${String(model)}".`,
      );

      throw new NotFoundException({
        message:
          message ??
          `Data dengan "${field}" bernilai "${value}" tidak ditemukan.`,
        errors: { [field]: `Data tidak ditemukan.` },
      });
    }
  }

  async countRecords<M extends keyof PrismaService>(
    model: M,
    where?: Record<string, any>,
  ): Promise<number> {
    const repo = this.prisma[model] as
      | { count?: (args?: any) => Promise<number> }
      | undefined;

    if (!repo || typeof repo.count !== 'function') {
      this.logger.error(
        `Model "${String(model)}" tidak valid untuk operasi count.`,
      );

      throw new Error(
        `Model "${String(model)}" tidak valid untuk operasi count.`,
      );
    }

    try {
      return await repo.count({
        where: where || {},
      });
    } catch (err) {
      this.logger.error(
        `Terjadi kesalahan saat menghitung data pada model "${String(model)}": ${
          err && typeof err === 'object' && err !== null && 'message' in err
            ? (err as { message: string }).message
            : String(err)
        }`,
        err &&
          typeof err === 'object' &&
          err !== null &&
          'stack' in err &&
          typeof (err as Record<string, unknown>).stack === 'string'
          ? (err as { stack: string }).stack
          : undefined,
      );

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(
          `Terjadi kesalahan pada query Prisma: ${err.message}`,
        );
      }

      throw err;
    }
  }
}
