import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaErrorMapper } from './prisma-error.helper';
import { AppLoggerService } from '../loggers/app-logger.service';

export class ErrorHelper {
  static handle(
    err: unknown,
    logger: AppLoggerService,
    context: string,
    fallbackMessage = 'Terjadi kesalahan pada server',
  ): never {
    if (err instanceof HttpException) throw err;

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(`Prisma error ${err.code}`, err.message, context);
      throw PrismaErrorMapper.map(err);
    }

    logger.error(
      `Error umum`,
      err instanceof Error ? err.stack : String(err),
      context,
    );

    throw new HttpException(fallbackMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
