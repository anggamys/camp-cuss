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
  private readonly context = PrismaHelper.name;

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
      include?: Record<string, any>;
      where?: Record<string, any>;
      orderBy?: Record<string, 'asc' | 'desc'>;
      search?: {
        query: string;
        numericFields?: string[];
        stringFields?: string[];
        relations?: {
          name: string;
          stringFields: string[];
        }[];
      };
    },
  ): Promise<T[]> {
    const repo = this.prisma[model] as
      | { findMany: (args: any) => Promise<any[]> }
      | undefined;

    if (!repo) {
      throw new Error(`Model "${String(model)}" tidak valid`);
    }

    try {
      let where = options?.where ? { ...options.where } : {};
      let or: any[] = [];

      if (options?.search?.query) {
        const q = options.search.query;
        const isNumeric = !isNaN(Number(q));

        // Numeric search
        if (isNumeric && Array.isArray(options.search.numericFields)) {
          or = or.concat(
            options.search.numericFields.map((field) => ({
              [field]: Number(q),
            })),
          );
        }

        // Relation string search
        if (Array.isArray(options.search.relations)) {
          for (const rel of options.search.relations) {
            if (Array.isArray(rel.stringFields)) {
              or = or.concat(
                rel.stringFields.map((field) => ({
                  [rel.name]: {
                    [field]: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },
                })),
              );
            }
          }
        }

        if (or.length > 0) {
          where =
            Object.keys(where).length > 0
              ? { AND: [where, { OR: or }] }
              : { OR: or };
        }
      }

      this.logger.debug(
        `FindAllRecords: model=${String(model)}, where=${JSON.stringify(where)}`,
        this.context,
      );

      const result = await repo.findMany({
        take: options?.take ?? 10,
        skip: options?.skip ?? 0,
        select: options?.select,
        include: options?.include,
        where,
        orderBy: options?.orderBy ?? { id: 'desc' },
      });

      this.logger.debug(
        `FindAllRecords: returned ${Array.isArray(result) ? result.length : 0} records`,
        this.context,
      );

      return result as T[];
    } catch (err) {
      this.logger.error(
        `Prisma error pada model "${String(model)}": ${
          err instanceof Error ? err.message : String(err)
        }`,
        err instanceof Error ? err.stack : undefined,
      );

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(err.message);
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
