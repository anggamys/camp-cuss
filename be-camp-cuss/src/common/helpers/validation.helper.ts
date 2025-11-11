import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';

@Injectable()
export class ValidationHelper {
  constructor(private readonly prisma: PrismaService) {}

  private async findRecord(
    model: keyof PrismaService,
    field: string,
    value: string | number,
  ): Promise<unknown> {
    try {
      const repo = this.prisma[model] as unknown as {
        findUnique(args: {
          where: Record<string, string | number>;
        }): Promise<unknown>;
      };
      return await repo.findUnique({ where: { [field]: value } });
    } catch (err) {
      throw new HttpException(
        `Error accessing model ${String(model)}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async assertUnique(
    model: keyof PrismaService,
    field: string,
    value: string | number,
    message?: string,
  ): Promise<void> {
    const exists = await this.findRecord(model, field, value);
    if (exists) {
      throw new HttpException(
        {
          message: message ?? 'Validasi gagal',
          errors: { [field]: [`${field} sudah digunakan`] },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async assertExists(
    model: keyof PrismaService,
    field: string,
    value: string | number,
    message?: string,
  ): Promise<void> {
    const exists = await this.findRecord(model, field, value);
    if (!exists) {
      throw new HttpException(
        {
          message: message ?? `${field} tidak ditemukan`,
          errors: { [field]: [`${field} tidak ditemukan`] },
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
