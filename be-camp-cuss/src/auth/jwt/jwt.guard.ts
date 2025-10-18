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

interface UserFromJwt {
  id: number;
  username: string;
  role: string;
}

interface RequestWithHeaders {
  headers: {
    authorization?: string;
    [key: string]: string | string[] | undefined;
  };
}

interface AuthErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = UserFromJwt>(
    err: unknown,
    user: TUser | false,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const authHeader = request.headers.authorization;

    // 1. Tidak ada Authorization header sama sekali
    if (!authHeader) {
      const errorResponse: AuthErrorResponse = {
        message: 'Token tidak disertakan',
        errors: {
          token: [
            'Header Authorization dengan format Bearer <token> wajib dikirim',
          ],
        },
      };
      throw new UnauthorizedException(errorResponse);
    }

    // 2. Header ada tapi kosong (Bearer saja tanpa token)
    if (typeof authHeader === 'string' && authHeader.trim() === 'Bearer') {
      const errorResponse: AuthErrorResponse = {
        message: 'Token tidak disertakan',
        errors: { token: ['Token tidak boleh kosong'] },
      };
      throw new UnauthorizedException(errorResponse);
    }

    // 3. Token tidak valid (signature atau format rusak)
    if (info instanceof JsonWebTokenError) {
      const errorResponse: AuthErrorResponse = {
        message: 'Token tidak valid',
        errors: { token: [info.message] },
      };
      throw new UnauthorizedException(errorResponse);
    }

    // 4. Token kedaluwarsa
    if (info instanceof TokenExpiredError) {
      const errorResponse: AuthErrorResponse = {
        message: 'Token telah kedaluwarsa',
        errors: {
          token: ['Silakan login ulang untuk mendapatkan token baru'],
        },
      };
      throw new UnauthorizedException(errorResponse);
    }

    // 5. Token belum aktif
    if (info instanceof NotBeforeError) {
      const errorResponse: AuthErrorResponse = {
        message: 'Token belum aktif',
        errors: { token: ['Token belum dapat digunakan saat ini'] },
      };
      throw new ForbiddenException(errorResponse);
    }

    // 6. User tidak ditemukan (JWT valid tapi data user tidak ada)
    if (!user) {
      const errorResponse: AuthErrorResponse = {
        message: 'User tidak ditemukan',
        errors: {
          auth: ['Data pengguna tidak ditemukan dari token'],
        },
      };
      throw new UnauthorizedException(errorResponse);
    }

    // 7. Error lain dari Passport
    if (err) {
      const errorResponse: AuthErrorResponse = {
        message: 'Autentikasi gagal',
        errors: { auth: ['Gagal memverifikasi identitas pengguna'] },
      };
      throw new UnauthorizedException(errorResponse);
    }

    return user;
  }
}
