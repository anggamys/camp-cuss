import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

interface ErrorResponse {
  status: 'error' | 'success';
  message: string;
  data: null;
  errors: Record<string, string[]> | null;
  meta: null;
}

interface HttpErrorBody {
  message?: string | string[] | ValidationError[];
  errors?: Record<string, string[]> | Record<string, string>;
  [key: string]: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
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

        // Format error hasil ValidationPipe
        if (body.errors && typeof body.errors === 'object') {
          errors = Object.entries(body.errors).reduce<Record<string, string[]>>(
            (acc, [key, val]) => {
              if (val === undefined || val === null) return acc;
              const values: string[] = Array.isArray(val)
                ? (val as string[]).map((v) => String(v))
                : [String(val)];
              acc[key] = values;
              return acc;
            },
            {},
          );
        }

        // Fallback: handle ValidationError[] (misal belum diubah di ValidationPipe)
        if (
          Array.isArray(body.message) &&
          body.message[0] instanceof ValidationError
        ) {
          message = 'Validation failed';
          const validationErrors = body.message as ValidationError[];
          errors = validationErrors.reduce<Record<string, string[]>>(
            (acc, err) => {
              acc[err.property] = Object.values(err.constraints ?? {});
              return acc;
            },
            {},
          );
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Logging ringkas di console dev
    if (process.env.NODE_ENV !== 'production') {
      const exceptionName =
        exception instanceof Error
          ? exception.constructor.name
          : typeof exception;
      console.error(
        `[HttpExceptionFilter] ${exceptionName}: ${message}`,
        errors ? JSON.stringify(errors, null, 2) : '',
      );
    }

    const errorResponse: ErrorResponse = {
      status: status >= HttpStatus.BAD_REQUEST ? 'error' : 'success',
      message,
      data: null,
      errors,
      meta: null,
    };

    response.status(status).json(errorResponse);
  }
}
