import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
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
  private readonly logger = new Logger(WsJwtGuard.name);

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
      const secret =
        this.configService.get<string>(JwtEnvKeys.JWT_ACCESS_SECRET, '') || '';
      if (!secret) {
        this.logger.error('JWT_ACCESS_SECRET tidak ditemukan di konfigurasi');
        throw new UnauthorizedException(
          this.buildError('Konfigurasi server bermasalah', {
            server: ['JWT secret tidak ditemukan'],
          }),
        );
      }

      const payload = this.jwtService.verify<UserPayload>(token, { secret });

      if (!payload?.id) {
        throw new UnauthorizedException(
          this.buildError('Payload token tidak valid', {
            token: ['Data pengguna tidak ditemukan dalam token'],
          }),
        );
      }

      client.user = payload;
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(`Autentikasi gagal: ${errorMessage}`);

      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          this.buildError('Token telah kedaluwarsa', {
            token: [
              'Sesi Anda telah berakhir, silakan login ulang untuk melanjutkan',
            ],
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
        const friendlyMessage = this.getFriendlyJwtErrorMessage(err.message);
        throw new UnauthorizedException(
          this.buildError('Token tidak valid', { token: [friendlyMessage] }),
        );
      }

      throw new UnauthorizedException(
        this.buildError('Autentikasi gagal', {
          auth: ['Terjadi kesalahan saat memverifikasi identitas pengguna'],
        }),
      );
    }
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token.trim()) return token;
    }

    const queryToken = client.handshake.query.token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
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

  private getFriendlyJwtErrorMessage(originalMessage: string): string {
    const mappings: Record<string, string> = {
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

    const lower = originalMessage.toLowerCase();
    for (const [key, value] of Object.entries(mappings)) {
      if (lower.includes(key)) return value;
    }

    return 'Token tidak dapat diverifikasi, silakan login ulang';
  }
}
