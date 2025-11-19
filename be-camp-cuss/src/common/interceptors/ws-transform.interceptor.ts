import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Socket } from 'socket.io';
import { WsTransformResult } from '../types/ws-response.interface';

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
            dataVal = resp['data'] as T;
          } else {
            dataVal = response as T;
          }
        } else {
          if (response !== undefined && response !== null) {
            dataVal = response as T;
          } else {
            dataVal = null;
          }
        }

        return {
          status: 'success',
          message,
          data: dataVal,
          meta: {
            event: eventName,
            clientId,
            timestamp: now,
          },
        };
      }),
    );
  }
}
