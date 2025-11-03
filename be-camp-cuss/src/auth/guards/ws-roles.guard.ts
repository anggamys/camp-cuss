import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Socket } from 'socket.io';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ApiResponse } from '../../common/types/api-response.interface';
import { UserPayload } from '../../common/types/user-context.interface';

interface SocketWithUser extends Socket {
  user?: UserPayload;
}

@Injectable()
export class WsRolesGuard implements CanActivate {
  private readonly logger = new Logger(WsRolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (!requiredRoles.length) return true;

    const client = context.switchToWs().getClient<SocketWithUser>();
    const user = client.user;

    if (!user?.role) {
      this.logger.warn('User role tidak ditemukan pada koneksi WebSocket');
      throw new ForbiddenException(
        this.buildError('Anda tidak memiliki akses ke resource ini', {
          role: ['Data pengguna tidak ditemukan di koneksi WebSocket'],
        }),
      );
    }

    if (!requiredRoles.includes(user.role as Role)) {
      this.logger.warn(
        `Akses ditolak untuk role: ${user.role}, dibutuhkan: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        this.buildError('Anda tidak memiliki akses ke resource ini', {
          role: [
            `Role '${user.role}' tidak memiliki izin untuk mengakses event ini`,
          ],
        }),
      );
    }

    return true;
  }

  private buildError(
    message: string,
    errors: Record<string, string[] | string>,
  ): ApiResponse<null> {
    return { status: 'error', message, data: null, errors, meta: null };
  }
}
