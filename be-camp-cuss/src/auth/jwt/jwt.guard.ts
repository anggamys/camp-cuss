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
            'Header Authorization dengan format Bearer <token> wajib dikirim',
          ],
        }),
      );
    }

    // 2. Header ada tapi kosong (Bearer saja tanpa token)
    if (typeof authHeader === 'string' && authHeader.trim() === 'Bearer') {
      throw new UnauthorizedException(
        this.buildError('Token tidak disertakan', {
          token: ['Token tidak boleh kosong'],
        }),
      );
    }

    // 3. Token tidak valid (signature atau format rusak)
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException(
        this.buildError('Token tidak valid', {
          token: [info.message],
        }),
      );
    }

    // 4. Token kedaluwarsa
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException(
        this.buildError('Token telah kedaluwarsa', {
          token: ['Silakan login ulang untuk mendapatkan token baru'],
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

    // 6. User tidak ditemukan (JWT valid tapi data user tidak ada)
    if (!user) {
      throw new UnauthorizedException(
        this.buildError('User tidak ditemukan', {
          auth: ['Data pengguna tidak ditemukan dari token'],
        }),
      );
    }

    // 7. Error lain dari Passport
    if (err) {
      throw new UnauthorizedException(
        this.buildError('Autentikasi gagal', {
          auth: ['Gagal memverifikasi identitas pengguna'],
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
}
