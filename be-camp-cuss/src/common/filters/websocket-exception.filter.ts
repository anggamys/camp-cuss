import { ArgumentsHost, Catch, WsExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ApiResponse } from '../types/api-response.interface';

interface ErrorWithMessage {
  message?: string;
}

@Catch(WsException)
export class WebsocketExceptionFilter implements WsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    const error = exception.getError();

    const message = this.extractMessage(error);

    const response: ApiResponse<null> = {
      status: 'error',
      message,
      data: null,
      errors: null,
      meta: null,
    };

    client.emit('errorResponse', response);
  }

  private extractMessage(error: string | object): string {
    if (typeof error === 'string') {
      return error;
    }

    if (this.isErrorWithMessage(error)) {
      return error.message ?? 'Error WebSocket';
    }

    return 'Error WebSocket';
  }

  private isErrorWithMessage(error: object): error is ErrorWithMessage {
    return 'message' in error;
  }
}
