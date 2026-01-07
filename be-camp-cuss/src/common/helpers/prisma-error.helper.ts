import {
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export class PrismaErrorMapper {
  static map(error: Prisma.PrismaClientKnownRequestError): HttpException {
    switch (error.code) {
      case 'P2002':
        return new ConflictException('Data sudah ada, tidak boleh duplikat');
      case 'P2025':
        return new NotFoundException('Data tidak ditemukan');
      case 'P2003':
        return new BadRequestException('Relasi tidak valid atau hilang');
      case 'P2014':
        return new BadRequestException('Referensi relasi tidak valid');
      default:
        return new InternalServerErrorException({
          message: 'Kesalahan pada database',
          meta: error.meta,
          code: error.code,
        });
    }
  }
}
