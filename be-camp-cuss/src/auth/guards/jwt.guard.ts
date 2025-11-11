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
import { AppLoggerService } from '../../common/loggers/app-logger.service';

interface RequestWithHeaders {
  headers: Record<string, string | string[] | undefined>;
  isPublic?: boolean;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly context = 'JwtAuthGuard';

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly logger: AppLoggerService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Jika route public, lewati validasi
    if (isPublic) {
      const req = context.switchToHttp().getRequest<RequestWithHeaders>();
      req.isPublic = true;
      this.logger.debug('Route publik, guard dilewati', this.context);
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithHeaders>();
    const token = this.extractToken(req);

    // Jika tidak ada token
    if (!token) {
      this.logger.warn('Token tidak ditemukan di header', this.context);
      throw new UnauthorizedException(
        this.buildError('Token tidak disertakan', {
          token: [
            'Header Authorization dengan format Bearer <token> wajib dikirim',
          ],
        }),
      );
    }

    // Token sudah masuk blacklist (logout sebelumnya)
    if (this.authService.isTokenBlacklisted(token)) {
      this.logger.warn('Token sudah di-blacklist', this.context);
      throw new UnauthorizedException(
        this.buildError('Token telah di-revoke', {
          token: ['Sesi Anda telah berakhir, silakan login ulang'],
        }),
      );
    }

    return (await super.canActivate(context)) as boolean;
  }

  handleRequest<TUser = UserPayload>(
    err: unknown,
    user: TUser | false,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const req = context.switchToHttp().getRequest<RequestWithHeaders>();

    if (req.isPublic) return user as TUser;

    // Validasi error JWT
    if (info instanceof TokenExpiredError) {
      this.logger.warn('Token kedaluwarsa', this.context);
      throw new UnauthorizedException(
        this.buildError('Token telah kedaluwarsa', {
          token: [
            'Sesi Anda telah berakhir, silakan login ulang untuk melanjutkan',
          ],
        }),
      );
    }

    if (info instanceof NotBeforeError) {
      this.logger.warn('Token belum aktif', this.context);
      throw new ForbiddenException(
        this.buildError('Token belum aktif', {
          token: ['Token belum dapat digunakan saat ini'],
        }),
      );
    }

    if (info instanceof JsonWebTokenError) {
      const friendly = this.getFriendlyJwtErrorMessage(info.message);
      this.logger.warn(`Token tidak valid: ${friendly}`, this.context);
      throw new UnauthorizedException(
        this.buildError('Token tidak valid', { token: [friendly] }),
      );
    }

    if (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(
        `Kesalahan autentikasi: ${errorMessage}`,
        err instanceof Error ? err.stack : undefined,
        this.context,
      );
      throw new UnauthorizedException(
        this.buildError('Autentikasi gagal', {
          auth: ['Terjadi kesalahan saat memverifikasi identitas Anda'],
        }),
      );
    }

    if (!user) {
      this.logger.warn('User tidak ditemukan pada payload token', this.context);
      throw new UnauthorizedException(
        this.buildError('User tidak ditemukan', {
          auth: [
            'Akun tidak ditemukan atau telah dihapus, silakan hubungi admin',
          ],
        }),
      );
    }

    const username = this.getUsernameFromUser(user);
    this.logger.debug(
      `Autentikasi berhasil untuk user ${username}`,
      this.context,
    );
    return user;
  }

  private getUsernameFromUser(user: unknown): string {
    if (
      user &&
      typeof user === 'object' &&
      'username' in user &&
      typeof (user as { username: unknown }).username === 'string'
    ) {
      return (user as { username: string }).username;
    }
    return 'unknown';
  }

  private extractToken(req: RequestWithHeaders): string | undefined {
    const header = req.headers['authorization'];
    if (typeof header !== 'string') return undefined;
    const [type, token] = header.trim().split(' ');
    return type === 'Bearer' && token ? token : undefined;
  }

  private buildError(
    message: string,
    errors: Record<string, string[] | string>,
  ): ApiResponse<null> {
    return { status: 'error', message, data: null, errors, meta: null };
  }

  private getFriendlyJwtErrorMessage(msg: string): string {
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

    const lower = msg.toLowerCase();
    for (const [key, val] of Object.entries(map)) {
      if (lower.includes(key)) return val;
    }
    return 'Token tidak dapat diverifikasi, silakan login ulang';
  }
}
