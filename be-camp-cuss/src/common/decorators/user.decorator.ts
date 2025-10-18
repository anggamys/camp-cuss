import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface UserFromJwt {
  id: number;
  username: string;
  role: string;
}

interface RequestWithUser {
  user: UserFromJwt;
}

export const User = createParamDecorator(
  (data: keyof UserFromJwt | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return data ? user[data] : user;
  },
);
