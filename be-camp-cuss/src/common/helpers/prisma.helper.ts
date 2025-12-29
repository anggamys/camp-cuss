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
      select?: Record<string, boolean>;
      where?: Record<string, any>;
      orderBy?: Record<string, 'asc' | 'desc'>;
    },
  ): Promise<T[]> {
    const repo = this.prisma[model] as
      | { findMany?: (args?: any) => Promise<any[]> }
      | undefined;

    if (!repo || typeof repo.findMany !== 'function') {
      this.logger.error(`Model "${String(model)}" tidak valid untuk findMany`);
      throw new Error(`Model "${String(model)}" tidak valid untuk findMany`);
    }

    try {
      return (await repo.findMany({
        take: options?.take ?? 50,
        skip: options?.skip ?? 0,
        select: options?.select,
        where: options?.where,
        orderBy: options?.orderBy ?? { createdAt: 'desc' },
      })) as T[];
    } catch (err) {
      this.logger.error(
        `Prisma findAllRecords error on model "${String(model)}": ${
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
        throw new BadRequestException(`Kesalahan Prisma: ${err.message}`);
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
        `Model "${String(model)}" bukan model Prisma yang valid`,
      );

      throw new Error(`Model "${String(model)}" bukan model Prisma yang valid`);
    }

    try {
      return (await repo.findUnique({
        where: { [field]: value },
      } as any)) as T | null;
    } catch (err) {
      this.logger.error(
        `Prisma findRecord error on model "${String(model)}", field "${String(field)}", value "${value}": ${
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
        throw new BadRequestException(`Kesalahan query Prisma: ${err.message}`);
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
        `assertUnique failed: ${field} dengan value "${value}" sudah terdaftar pada model "${String(model)}"`,
      );

      throw new BadRequestException({
        message: message ?? `${field} sudah digunakan`,
        errors: { [field]: `${value} sudah terdaftar` },
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
        `assertExists failed: ${field} dengan value "${value}" tidak ditemukan pada model "${String(model)}"`,
      );

      throw new NotFoundException({
        message: message ?? `${field} tidak ditemukan`,
        errors: { [field]: `${value} tidak ditemukan` },
      });
    }
  }
}
