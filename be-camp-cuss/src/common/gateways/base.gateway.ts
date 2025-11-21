import { WsException } from '@nestjs/websockets';
import { AppLoggerService } from '../loggers/app-logger.service';
import { Socket } from 'socket.io';
import { WsSystemSuffix } from '../enums/topic-socket-io.enum';
import { randomUUID } from 'crypto';
import { WsResponse } from '../types/ws-response.interface';

export abstract class BaseGateway {
  protected abstract readonly context: string;

  constructor(protected readonly logger: AppLoggerService) {}

  protected async safeHandle<T>(
    client: Socket,
    event: string,
    handler: () => Promise<T>,
  ): Promise<void> {
    const requestId = randomUUID();
    const start = Date.now();

    try {
      const result = await handler();
      const durationMs = Date.now() - start;

      this.emitAck(client, event, 'Berhasil diproses', result, {
        requestId,
        durationMs,
        clientId: client.id,
      });
    } catch (error) {
      const durationMs = Date.now() - start;
      this.emitError(client, event, error, {
        requestId,
        durationMs,
        clientId: client.id,
      });
    }
  }

  protected emitAck<T>(
    client: Socket,
    event: string,
    message: string,
    data?: T,
    metaExtra?: Partial<WsResponse['meta']>,
  ): void {
    const payload: WsResponse<T> = this.buildResponse(
      'success',
      event,
      message,
      data ?? null,
      metaExtra,
    );
    client.emit(`${event}:${WsSystemSuffix.ACK}`, payload);
  }

  protected emitError(
    client: Socket,
    event: string,
    error: unknown,
    metaExtra?: Partial<WsResponse['meta']>,
  ): void {
    const message = this.extractErrorMessage(error);
    this.logger.warn(`[${this.context}] ${event} gagal: ${message}`);

    const payload: WsResponse<null> = this.buildResponse(
      'error',
      event,
      message,
      null,
      metaExtra,
    );
    client.emit(`${event}:${WsSystemSuffix.ERROR}`, payload);
  }

  private buildResponse<T>(
    status: 'success' | 'error',
    event: string,
    message: string,
    data: T | null,
    metaExtra?: Partial<WsResponse['meta']>,
  ): WsResponse<T> {
    return {
      status,
      message,
      data,
      meta: {
        event,
        context: this.context,
        timestamp: new Date().toISOString(),
        ...metaExtra,
      },
    };
  }

  private extractErrorMessage(error: unknown): string {
    if (!error) return 'Kesalahan tidak diketahui';
    if (error instanceof WsException) return error.message;
    if (error instanceof Error && error.message) return error.message;

    if (typeof error === 'object' && error !== null) {
      // Type guard for object with response property
      if (
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null
      ) {
        const response = error.response as Record<string, unknown>;
        if ('message' in response) {
          const message = response.message;
          if (Array.isArray(message)) {
            // Ensure all array elements are strings
            return message
              .filter((item): item is string => typeof item === 'string')
              .join(', ');
          }
          if (typeof message === 'string') {
            return message;
          }
        }
      }
    }

    return 'Kesalahan tidak diketahui';
  }
}
