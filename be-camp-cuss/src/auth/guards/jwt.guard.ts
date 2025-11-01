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

interface RequestWithHeaders {
  headers: {
    authorization?: string;
    [key: string]: string | string[] | undefined;
  };
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Jika route publik, lewati guard
    if (isPublic) return true;

    return super.canActivate(context);
  }

  handleRequest<TUser = UserPayload>(
    err: unknown,
    user: TUser | false,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const authHeader = request.headers.authorization;

    // 1. Tidak ada Authorization header
    if (!authHeader) {
      throw new UnauthorizedException(
        this.buildError('Token tidak disertakan', {
          token: [
            'Header Authorization dengan format Bearer <token> diperlukan',
          ],
        }),
      );
    }

    // 2. Header ada tapi kosong
    if (typeof authHeader === 'string' && authHeader.trim() === 'Bearer') {
      throw new UnauthorizedException(
        this.buildError('Token tidak disertakan', {
          token: ['Token tidak boleh kosong setelah kata Bearer'],
        }),
      );
    }

    // 3. Token tidak valid
    if (info instanceof JsonWebTokenError) {
      const friendlyMessage = this.getFriendlyJwtErrorMessage(info.message);
      throw new UnauthorizedException(
        this.buildError('Token tidak valid', {
          token: [friendlyMessage],
        }),
      );
    }

    // 4. Token kedaluwarsa
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException(
        this.buildError('Token telah kedaluwarsa', {
          token: [
            'Sesi Anda telah berakhir, silakan login ulang untuk melanjutkan',
          ],
        }),
      );
    }

    // 5. Token belum aktif
    if (info instanceof NotBeforeError) {
      throw new ForbiddenException(
        this.buildError('Token belum aktif', {
          token: ['Token belum dapat digunakan saat ini'],
        }),
      );
    }

    // 6. User tidak ditemukan
    if (!user) {
      throw new UnauthorizedException(
        this.buildError('User tidak ditemukan', {
          auth: [
            'Akun tidak ditemukan atau telah dihapus, silakan hubungi admin',
          ],
        }),
      );
    }

    // 7. Error lain dari Passport
    if (err) {
      throw new UnauthorizedException(
        this.buildError('Autentikasi gagal', {
          auth: ['Terjadi kesalahan saat memverifikasi identitas Anda'],
        }),
      );
    }

    return user;
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

  private getFriendlyJwtErrorMessage(originalMessage: string): string {
    const errorMappings: Record<string, string> = {
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

    // Cari pesan yang cocok (case-insensitive)
    const lowerOriginal = originalMessage.toLowerCase();
    for (const [key, value] of Object.entries(errorMappings)) {
      if (lowerOriginal.includes(key)) {
        return value;
      }
    }

    // Jika tidak ada yang cocok, kembalikan pesan default
    return 'Token tidak dapat diverifikasi, silakan login ulang';
  }
}
