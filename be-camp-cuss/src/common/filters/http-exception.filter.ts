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
  errors: Record<string, string[]> | string[] | null;
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
    let errors: Record<string, string[]> | string[] | null = null;

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
        message = typeof body.message === 'string' ? body.message : message;

        // Handle explicit error object
        if (body.errors && typeof body.errors === 'object') {
          errors = Object.entries(body.errors).reduce<Record<string, string[]>>(
            (acc, [key, val]) => {
              const values = Array.isArray(val)
                ? (val as string[])
                : [String(val)];
              acc[key] = values;
              return acc;
            },
            {},
          );
        }

        // Handle ValidationPipe array message (simple strings)
        if (
          Array.isArray(body.message) &&
          typeof body.message[0] === 'string'
        ) {
          message = 'Validation failed';
          errors = body.message as string[];
        }

        // Handle ValidationError[] from class-validator
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

    // Log error only in non-production
    if (process.env.NODE_ENV !== 'production') {
      console.error('[HttpExceptionFilter]', exception);
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
