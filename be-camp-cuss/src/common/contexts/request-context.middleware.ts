import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from './request-context.service';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const contextData = {
      requestId: randomUUID(),
      userId: undefined,
      path: req.path,
      method: req.method,
    };

    this.context.run(contextData, () => next());
  }
}
