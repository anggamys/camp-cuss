import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, MetaResponse } from '../types/api-response.interface';

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
        // Inisialisasi nilai default
        let message = 'Success';
        let data: T | undefined = undefined;
        let meta: MetaResponse | null = null;

        // Jika controller mengembalikan objek standar { message, data, meta }
        if (this.isApiResponse(response)) {
          if (typeof response.message === 'string') message = response.message;
          if ('data' in response) data = response.data as T;
          if (response.meta && typeof response.meta === 'object') {
            meta = this.normalizeMeta(response.meta as Record<string, unknown>);
          }
        } else {
          // Jika return bukan object (misal string/boolean/number)
          data = response;
        }

        return {
          status: 'success',
          message,
          data,
          meta,
        };
      }),
    );
  }

  private isApiResponse(
    response: unknown,
  ): response is Partial<ApiResponse<unknown>> {
    return (
      response !== null &&
      typeof response === 'object' &&
      ('message' in response || 'data' in response || 'meta' in response)
    );
  }

  private normalizeMeta(meta: Record<string, unknown>): MetaResponse {
    // Pastikan meta selalu punya susunan umum bila ada data paginasi
    const normalized: MetaResponse = {};

    if ('page' in meta) normalized.page = Number(meta.page) || 1;
    if ('perPage' in meta) normalized.perPage = Number(meta.perPage) || 10;
    if ('total' in meta) normalized.total = Number(meta.total) || 0;

    if ('totalPages' in meta) {
      normalized.totalPages = Number(meta.totalPages);
    } else if (normalized.total && normalized.perPage) {
      normalized.totalPages = Math.ceil(normalized.total / normalized.perPage);
    }

    // Gabungkan field tambahan lain (misal sort, filter, cursor)
    Object.entries(meta).forEach(([key, value]) => {
      if (!(key in normalized)) {
        (normalized as Record<string, unknown>)[key] = value;
      }
    });

    return normalized;
  }
}
