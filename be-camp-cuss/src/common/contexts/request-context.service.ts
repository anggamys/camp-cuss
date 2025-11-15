import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { RequestContextData } from '../types/request-context.interface';

@Injectable()
export class RequestContextService {
  private static readonly storage = new AsyncLocalStorage<RequestContextData>();

  run(context: RequestContextData, callback: () => void) {
    RequestContextService.storage.run(context, callback);
  }

  get<T extends keyof RequestContextData>(
    key: T,
  ): RequestContextData[T] | undefined {
    const store = RequestContextService.storage.getStore();
    return store?.[key];
  }

  getAll(): RequestContextData | undefined {
    return RequestContextService.storage.getStore();
  }

  static run(context: RequestContextData, callback: () => void) {
    RequestContextService.storage.run(context, callback);
  }

  static get<T extends keyof RequestContextData>(
    key: T,
  ): RequestContextData[T] | undefined {
    const store = RequestContextService.storage.getStore();
    return store?.[key];
  }

  static getAll(): RequestContextData | undefined {
    return RequestContextService.storage.getStore();
  }
}
