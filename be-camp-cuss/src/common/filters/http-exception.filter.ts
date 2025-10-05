/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, string> | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        message = body.message ?? message;

        // Jika structure memiliki "errors" sebagai object
        if (body.errors && typeof body.errors === 'object') {
          errors = body.errors;
        }

        // Jika message dari validation pipe berupa array
        if (Array.isArray(body.message)) {
          message = 'Validation failed';
          errors = Object.fromEntries(
            body.message.map((msg: string, i: number) => [
              `field_${i + 1}`,
              msg,
            ]),
          );
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      status: 'error',
      message,
      data: null,
      errors,
      meta: null,
    });
  }
}
