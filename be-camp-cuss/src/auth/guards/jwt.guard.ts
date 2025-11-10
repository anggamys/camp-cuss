import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
} from 'jsonwebtoken';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { UserPayload } from '../../common/types/user-context.interface';
import { ApiResponse } from '../../common/types/api-response.interface';
import { AuthService } from '../auth.service';

interface RequestWithHeaders {
  headers: {
    authorization?: string;
    [key: string]: string | string[] | undefined;
  };
  isPublic?: boolean;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const request = context.switchToHttp().getRequest<RequestWithHeaders>();
      request.isPublic = true;
      return true;
    }

    // Cek token blacklist sebelum validasi JWT
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const token = this.extractTokenFromHeader(request);

    if (token && this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException(
        this.buildError('Token telah di-revoke', {
          token: ['Sesi telah berakhir, silakan login ulang'],
        }),
      );
    }

    const result = await super.canActivate(context);
    return result as boolean;
  }

  handleRequest<TUser = UserPayload>(
    err: unknown,
    user: TUser | false,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const authHeader = request.headers.authorization;

    // 1. Route publik — lewati semua validasi
    if (request.isPublic) return user as TUser;

    // 2. Tidak ada Authorization header
    if (!authHeader) {
      throw new UnauthorizedException(
        this.buildError('Token tidak disertakan', {
          token: [
            'Header Authorization dengan format Bearer <token> diperlukan',
          ],
        }),
      );
    }

    // 3. Format Bearer salah
    if (typeof authHeader === 'string' && !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        this.buildError('Format token salah', {
          token: ['Gunakan format Authorization: Bearer <token>'],
        }),
      );
    }

    // 4. Token tidak valid
    if (info instanceof JsonWebTokenError) {
      const friendly = this.getFriendlyJwtErrorMessage(info.message);
      throw new UnauthorizedException(
        this.buildError('Token tidak valid', { token: [friendly] }),
      );
    }

    // 5. Token kedaluwarsa
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException(
        this.buildError('Token telah kedaluwarsa', {
          token: [
            'Sesi Anda telah berakhir, silakan login ulang untuk melanjutkan',
          ],
        }),
      );
    }

    // 6. Token belum aktif
    if (info instanceof NotBeforeError) {
      throw new ForbiddenException(
        this.buildError('Token belum aktif', {
          token: ['Token belum dapat digunakan saat ini'],
        }),
      );
    }

    // 7. User tidak ditemukan
    if (!user) {
      throw new UnauthorizedException(
        this.buildError('User tidak ditemukan', {
          auth: [
            'Akun tidak ditemukan atau telah dihapus, silakan hubungi admin',
          ],
        }),
      );
    }

    // 8. Error umum lainnya
    if (err) {
      throw new UnauthorizedException(
        this.buildError('Autentikasi gagal', {
          auth: ['Terjadi kesalahan saat memverifikasi identitas Anda'],
        }),
      );
    }

    return user;
  }

  private extractTokenFromHeader(
    request: RequestWithHeaders,
  ): string | undefined {
    const authHeader = request.headers.authorization;
    if (typeof authHeader !== 'string') return undefined;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private buildError(
    message: string,
    errors: Record<string, string[] | string>,
  ): ApiResponse<null> {
    return { status: 'error', message, data: null, errors, meta: null };
  }

  private getFriendlyJwtErrorMessage(original: string): string {
    const map: Record<string, string> = {
      'jwt malformed': 'Format token tidak valid atau rusak',
      'invalid token': 'Token tidak valid',
      'invalid signature': 'Tanda tangan token tidak valid',
      'jwt signature is required': 'Tanda tangan token diperlukan',
      'invalid algorithm': 'Algoritma token tidak didukung',
      'jwt audience invalid': 'Audience token tidak valid',
      'jwt issuer invalid': 'Penerbit token tidak valid',
      'jwt id invalid': 'ID token tidak valid',
      'jwt subject invalid': 'Subject token tidak valid',
    };

    const lower = original.toLowerCase();
    for (const [key, val] of Object.entries(map)) {
      if (lower.includes(key)) return val;
    }
    return 'Token tidak dapat diverifikasi, silakan login ulang';
  }
}
