import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from '../contexts/request-context.service';
import { UserPayload } from '../types/user-context.interface';

interface RequestWithUser {
  user?: UserPayload;
}

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  constructor(private readonly context: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (request.user?.id) {
      const currentContext = this.context.getAll();
      if (currentContext) {
        currentContext.userId = request.user.id;
      }
    }

    return next.handle();
  }
}
