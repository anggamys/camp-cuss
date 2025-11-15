import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class WsExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err: unknown) => {
        if (!(err instanceof WsException)) {
          let message = 'Unknown WebSocket error';

          if (err instanceof Error) {
            message = err.message;
          } else if (
            err &&
            typeof err === 'object' &&
            'message' in err &&
            typeof err.message === 'string'
          ) {
            message = err.message;
          }

          return throwError(() => new WsException(message));
        }
        return throwError(() => err);
      }),
    );
  }
}
