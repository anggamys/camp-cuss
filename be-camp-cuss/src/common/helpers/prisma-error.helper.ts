import {
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export class PrismaErrorHelper {
  static handle(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException('Resource already exists');
        case 'P2025':
          throw new NotFoundException({
            message: 'Data not found',
            errors: { record: 'No record found with given ID or criteria' },
          });
        case 'P2003':
          throw new BadRequestException({
            message: 'Foreign key constraint failed',
            errors: { relation: 'Referenced record not found' },
          });
        case 'P2014':
          throw new BadRequestException({
            message: 'Invalid relation reference',
            errors: { relation: 'Incorrect relation ID or data' },
          });
        default:
          throw new InternalServerErrorException({
            message: 'Database error',
            errors: {
              code: error.code,
              meta: error.meta,
              target:
                'meta' in error && typeof error.meta === 'object'
                  ? (error.meta as { target?: string }).target
                  : undefined,
            },
          });
      }
    }

    // Log for non-Prisma errors
    console.error('🔥 Non-Prisma error detail:', error);
    throw new InternalServerErrorException({
      message: 'Unexpected server error',
      errors: { detail: (error as Error)?.message },
    });
  }
}
