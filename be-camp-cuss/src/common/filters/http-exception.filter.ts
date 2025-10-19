import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';
import { ErrorResponse, HttpErrorBody } from '../types/http-error.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Terjadi kesalahan pada server';
    let errors: Record<string, string[]> | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const body = exceptionResponse as HttpErrorBody;

        // Ambil pesan utama
        if (typeof body.message === 'string') {
          message = body.message;
        }

        // Jika ada field errors di body
        if (body.errors && typeof body.errors === 'object') {
          errors = Object.entries(body.errors).reduce<Record<string, string[]>>(
            (acc, [key, val]) => {
              if (!val) return acc;
              const values: string[] = Array.isArray(val)
                ? val.map((v) => String(v))
                : [String(val)];
              acc[key] = values;
              return acc;
            },
            {},
          );
        }

        // Fallback untuk ValidationPipe default
        if (
          Array.isArray(body.message) &&
          typeof body.message[0] === 'object' &&
          body.message[0] !== null &&
          'constraints' in body.message[0]
        ) {
          message = 'Validasi gagal';
          const validationErrors = body.message as unknown as ValidationError[];
          errors = validationErrors.reduce<Record<string, string[]>>(
            (acc, err) => {
              acc[err.property] = Object.values(err.constraints ?? {});
              return acc;
            },
            {},
          );
        }
      }

      // Jika pesan masih default dari Passport (bukan dari JwtAuthGuard)
      if (status === HttpStatus.UNAUTHORIZED && message === 'Unauthorized') {
        message = 'Token tidak disertakan atau tidak valid';
      }
    } else if (exception instanceof Error) {
      // Untuk error non-HTTP (runtime)
      message = exception.message;
    }

    // Logging ringan untuk development
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        `[HttpExceptionFilter] ${
          exception instanceof Error ? exception.name : typeof exception
        }: ${message}`,
        errors ? JSON.stringify(errors, null, 2) : '',
      );
    }

    const errorResponse: ErrorResponse = {
      status: 'error',
      message,
      data: null,
      errors,
      meta: null,
    };

    response.status(status).json(errorResponse);
  }
}
