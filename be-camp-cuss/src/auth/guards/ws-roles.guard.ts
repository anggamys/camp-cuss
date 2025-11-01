import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Socket } from 'socket.io';
import { Role } from '../../common/enums/role.enum';
import { ApiResponse } from '../../common/types/api-response.interface';
import { UserPayload } from '../../common/types/user-context.interface';

interface SocketWithUser extends Socket {
  user?: UserPayload;
}

@Injectable()
export class WsRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // Jika tidak ada @Roles decorator, artinya public di level role
    if (!requiredRoles.length) return true;

    const client = context.switchToWs().getClient<SocketWithUser>();
    const user = client.user;

    if (!user || !user.role) {
      throw new ForbiddenException(
        this.buildError('Akses ditolak', {
          role: ['Data pengguna tidak ditemukan di koneksi WebSocket'],
        }),
      );
    }

    if (!requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException(
        this.buildError('Akses ditolak', {
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
    return {
      status: 'error',
      message,
      data: null,
      errors,
      meta: null,
    };
  }
}
