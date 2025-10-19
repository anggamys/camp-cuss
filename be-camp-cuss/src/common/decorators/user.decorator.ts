import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser, UserPayload } from '../types/user-context.interface';

export const User = createParamDecorator(
  (key: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const { user } = request;

    return key ? user[key] : user;
  },
);
