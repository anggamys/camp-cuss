import { BadRequestException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

export function normalizeWsError(error: unknown): Error {
  if (error instanceof WsException || error instanceof BadRequestException) {
    return error;
  }

  const msg = error instanceof Error ? error.message : 'Unknown error';
  const stack = error instanceof Error ? error.stack : undefined;

  const globalWithContext = global as typeof global & {
    __ws_context_active?: boolean;
  };
  const isWsContext =
    typeof global !== 'undefined' &&
    globalWithContext.__ws_context_active === true;

  if (isWsContext) {
    return new WsException(msg);
  }

  const err = new BadRequestException(msg);
  if (stack) {
    (err as Error & { stack?: string }).stack = stack;
  }
  return err;
}
