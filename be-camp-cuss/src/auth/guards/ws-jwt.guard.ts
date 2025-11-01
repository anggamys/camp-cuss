import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { JwtEnvKeys } from '../../common/enums/env-keys.enum';
import { UserPayload } from '../../common/types/user-context.interface';
import { ApiResponse } from '../../common/types/api-response.interface';
import {
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
} from 'jsonwebtoken';

interface SocketWithUser extends Socket {
  user?: UserPayload;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<SocketWithUser>();
    const token = this.extractToken(client);

    if (!token) {
      throw new UnauthorizedException(
        this.buildError('Token tidak disertakan', {
          token: [
            'Header Authorization (Bearer <token>) atau query parameter token wajib dikirim',
          ],
        }),
      );
    }

    try {
      const secret = this.configService.get<string>(
        JwtEnvKeys.JWT_ACCESS_SECRET,
      );
      const payload = this.jwtService.verify<UserPayload>(token, { secret });

      // simpan user agar bisa diakses di handler gateway
      client.user = payload;
      return true;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          this.buildError('Token telah kedaluwarsa', {
            token: ['Silakan login ulang untuk mendapatkan token baru'],
          }),
        );
      }

      if (err instanceof NotBeforeError) {
        throw new UnauthorizedException(
          this.buildError('Token belum aktif', {
            token: ['Token belum dapat digunakan saat ini'],
          }),
        );
      }

      if (err instanceof JsonWebTokenError) {
        throw new UnauthorizedException(
          this.buildError('Token tidak valid', {
            token: [err.message],
          }),
        );
      }

      throw new UnauthorizedException(
        this.buildError('Autentikasi gagal', {
          auth: ['Gagal memverifikasi identitas pengguna'],
        }),
      );
    }
  }

  private extractToken(client: Socket): string | null {
    // 1. Cek dari header Authorization
    const authHeader = client.handshake.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    // 2. Cek dari query parameter (misal token dikirim via ?token=xxxxx)
    const queryToken = client.handshake.query.token;
    if (typeof queryToken === 'string' && queryToken.trim() !== '') {
      return queryToken;
    }

    return null;
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
