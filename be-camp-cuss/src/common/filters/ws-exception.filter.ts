import {
  ArgumentsHost,
  Catch,
  Logger,
  WsExceptionFilter,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WsTransformResult } from '../interceptors/ws-transform.interceptor';

@Catch(WsException)
export class WsGlobalExceptionFilter implements WsExceptionFilter {
  private readonly logger = new Logger(WsGlobalExceptionFilter.name);

  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const clientId = client?.id ?? 'unknown';

    const errorOrValue: unknown = exception.getError();
    let err: string;

    if (typeof errorOrValue === 'string') {
      err = errorOrValue;
    } else if (
      errorOrValue &&
      typeof errorOrValue === 'object' &&
      'message' in errorOrValue &&
      typeof (errorOrValue as { message?: unknown }).message === 'string'
    ) {
      err = (errorOrValue as { message: string }).message;
    } else {
      err = 'Unknown error';
    }

    this.logger.warn(`WS Error: ${err}`);

    const payload: WsTransformResult = {
      event: 'error',
      status: 'error',
      message: err,
      data: null,
      meta: { timestamp: new Date().toISOString(), clientId },
    };

    client.emit('error', payload);
  }
}
