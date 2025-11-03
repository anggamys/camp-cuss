import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { RequestWithUser } from '../../common/types/user-context.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // 1. Jika route publik, lewati role check
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    // 2. Ambil role yang dibutuhkan dari metadata
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // 3. Ambil user dari request
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException({
        status: 'error',
        message: 'Anda tidak memiliki akses ke resource ini',
        data: null,
        errors: {
          auth: ['Informasi pengguna tidak ditemukan dalam permintaan'],
        },
        meta: null,
      });
    }

    // 4. Cek apakah role user termasuk yang diizinkan
    if (!requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException({
        status: 'error',
        message: 'Anda tidak memiliki akses ke resource ini',
        data: null,
        errors: {
          role: [
            `Role '${user.role}' tidak memiliki izin untuk mengakses resource ini`,
          ],
        },
        meta: null,
      });
    }

    return true;
  }
}
