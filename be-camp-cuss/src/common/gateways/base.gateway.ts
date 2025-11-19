import { WsException } from '@nestjs/websockets';
import { AppLoggerService } from '../loggers/app-logger.service';
import { Socket } from 'socket.io';

export abstract class BaseGateway {
  protected abstract readonly context: string;

  constructor(protected readonly logger: AppLoggerService) {}

  protected safeHandle<T>(
    client: Socket,
    event: string,
    handler: () => Promise<T>,
  ): void {
    setImmediate(() => {
      handler()
        .then((result) => {
          this.emitAck(client, event, 'Berhasil diproses', result);
        })
        .catch((error) => {
          this.emitError(client, event, error);
        });
    });
  }

  protected emitAck(
    client: Socket,
    event: string,
    message: string,
    data?: unknown,
  ) {
    const eventName = `${event}:ack`;
    client.emit(eventName, {
      status: 'success',
      message,
      data,
      meta: { event, timestamp: new Date().toISOString() },
    });
  }

  protected emitError(client: Socket, event: string, error: unknown) {
    const message = this.extractErrorMessage(error);
    const eventName = `${event}:error`;

    this.logger.warn(`WS error: ${message}`, this.context);

    client.emit(eventName, {
      status: 'error',
      message,
      data: null,
      meta: { event, timestamp: new Date().toISOString() },
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (!error) return 'Kesalahan tidak diketahui';
    if (error instanceof WsException) return error.message;

    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      error.response !== null
    ) {
      const resp = error.response as { message?: unknown };
      if ('message' in resp) {
        const msg = resp.message;
        if (Array.isArray(msg)) {
          return msg.map((item) => String(item)).join(', ');
        }
        if (typeof msg === 'string') return msg;
      }
    }

    if (error instanceof Error && error.message) return error.message;
    return error instanceof Error ? error.message : 'Kesalahan tidak diketahui';
  }
}
