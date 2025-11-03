import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Socket } from 'socket.io';

export interface WsTransformResult<T = unknown> {
  event: string;
  status: 'success' | 'error';
  message: string;
  data: T | null;
  meta: {
    timestamp: string;
    clientId: string;
  };
}

@Injectable()
export class WsTransformInterceptor implements NestInterceptor {
  intercept<T>(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<WsTransformResult<T>> {
    const now = new Date().toISOString();
    const client = context.switchToWs().getClient<Socket>();
    const data = context.switchToWs().getData<{ event?: string }>();

    const clientId = client.id ?? 'unknown';
    const eventName = data?.event ?? 'response';

    return next.handle().pipe(
      map((response: unknown): WsTransformResult<T> => {
        let message = 'OK';
        let dataVal: T | null = null;

        if (response !== null && typeof response === 'object') {
          const resp = response as Record<string, unknown>;
          if (typeof resp['message'] === 'string') {
            message = resp['message'];
          }

          if ('data' in resp) {
            // explicit data property present
            dataVal = resp['data'] as T;
          } else {
            // no data property — use the whole response object as data where appropriate
            dataVal = response as T;
          }
        } else {
          // primitive value or null/undefined
          if (response !== undefined && response !== null) {
            dataVal = response as T;
          } else {
            dataVal = null;
          }
        }

        return {
          event: eventName,
          status: 'success',
          message,
          data: dataVal,
          meta: { timestamp: now, clientId },
        };
      }),
    );
  }
}
