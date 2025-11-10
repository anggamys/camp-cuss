import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ValidationError } from 'class-validator';
import { ErrorResponse, HttpErrorBody } from '../types/http-error.interface';
import { AppLoggerService } from '../loggers/app-logger.service';
import { RequestContextService } from '../contexts/request-context.service';

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly context: RequestContextService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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
        if (typeof body.message === 'string') message = body.message;

        // Ambil field errors
        if (body.errors && typeof body.errors === 'object') {
          errors = Object.entries(body.errors).reduce<Record<string, string[]>>(
            (acc, [key, val]) => {
              if (!val) return acc;
              const values = Array.isArray(val)
                ? val.map((v) => String(v))
                : [String(val)];
              acc[key] = values;
              return acc;
            },
            {},
          );
        }

        // Fallback: error dari ValidationPipe
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

      if (status === HttpStatus.UNAUTHORIZED && message === 'Unauthorized') {
        message = 'Token tidak disertakan atau tidak valid';
      }
    } else if (exception instanceof Error) {
      // Error runtime biasa
      message = exception.message;
    }

    const ctxData = this.context.getAll();
    const requestId = ctxData?.requestId ?? 'unknown';
    const userId = ctxData?.userId ?? null;
    const path = ctxData?.path ?? request.url;
    const method = ctxData?.method ?? request.method;

    const baseLogMsg = `HTTP ${method} ${path} [${status}] - ${message}`;
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        baseLogMsg,
        (exception as Error)?.stack,
        'HttpExceptionFilter',
      );
    } else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(baseLogMsg, 'HttpExceptionFilter');
    } else {
      this.logger.log(baseLogMsg, 'HttpExceptionFilter');
    }

    const errorResponse: ErrorResponse = {
      status: 'error',
      message,
      data: null,
      errors,
      meta: {
        requestId,
        userId,
        path,
        method,
      },
    };

    response.status(status).json(errorResponse);
  }
}
