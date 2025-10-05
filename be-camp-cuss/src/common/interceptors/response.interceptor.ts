import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T | null;
  errors: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
}

interface ResponseData {
  message?: string;
  data?: unknown;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response: T): ApiResponse<T> => {
        // Type guard to check if response is an object with expected properties
        const responseObj = response as unknown as ResponseData;

        // Safely extract properties with proper typing
        const message =
          typeof responseObj === 'object' &&
          responseObj !== null &&
          'message' in responseObj &&
          typeof responseObj.message === 'string'
            ? responseObj.message
            : 'Success';

        const data =
          typeof responseObj === 'object' &&
          responseObj !== null &&
          'data' in responseObj
            ? (responseObj.data as T)
            : response;

        const meta =
          typeof responseObj === 'object' &&
          responseObj !== null &&
          'meta' in responseObj &&
          typeof responseObj.meta === 'object' &&
          responseObj.meta !== null
            ? responseObj.meta
            : null;

        return {
          status: 'success',
          message,
          data,
          errors: null,
          meta,
        };
      }),
    );
  }
}
