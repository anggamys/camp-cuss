import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import {
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
} from 'jsonwebtoken';
import { JwtEnvKeys } from '../../common/enums/env-keys.enum';
import { UserPayload } from '../../common/types/user-context.interface';
import { ApiResponse } from '../../common/types/api-response.interface';
import { AppLoggerService } from '../../common/loggers/app-logger.service';

interface SocketWithUser extends Socket {
  user?: UserPayload;
}

interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly context = 'WsJwtGuard';

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<SocketWithUser>();
    const token = this.extractToken(client);

    if (!token) {
      this.logger.warn('Token tidak ditemukan pada koneksi WS', this.context);
      throw new UnauthorizedException(
        this.buildError('Token tidak disertakan', {
          token: [
            'Header Authorization (Bearer <token>) atau query parameter token wajib dikirim',
          ],
        }),
      );
    }

    try {
      const secret = this.config.getOrThrow<string>(
        JwtEnvKeys.JWT_ACCESS_SECRET,
      );

      const decoded: unknown = this.jwt.verify(token, { secret });

      if (!this.isValidJwtPayload(decoded)) {
        this.logger.warn(
          'Payload token tidak valid atau tidak lengkap',
          this.context,
        );
        throw new UnauthorizedException(
          this.buildError('Payload token tidak valid', {
            token: ['Token tidak memiliki format yang benar'],
          }),
        );
      }

      client.user = {
        id: decoded.sub,
        username: decoded.username,
        role: decoded.role,
      };

      this.logger.debug(
        `Autentikasi WS berhasil untuk user ${decoded.username ?? decoded.sub}`,
        this.context,
      );
      return true;
    } catch (err) {
      this.handleJwtError(err);
    }
  }

  /** Type guard untuk memvalidasi JWT payload */
  private isValidJwtPayload(decoded: unknown): decoded is JwtPayload {
    if (
      decoded === null ||
      typeof decoded !== 'object' ||
      !('sub' in decoded) ||
      !('username' in decoded) ||
      !('role' in decoded)
    ) {
      return false;
    }

    const obj = decoded as Record<string, unknown>;
    return (
      typeof obj.sub === 'number' &&
      typeof obj.username === 'string' &&
      typeof obj.role === 'string'
    );
  }

  /** Ekstraksi token dari header atau query params */
  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token.trim()) return token;
    }

    const queryToken = client.handshake.query.token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
      return queryToken;
    }

    return null;
  }

  /** Tangani semua jenis error JWT dengan pesan ramah */
  private handleJwtError(err: unknown): never {
    const message = err instanceof Error ? err.message : 'Unknown error';
    this.logger.warn(`Autentikasi WS gagal: ${message}`, this.context);

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
      const friendly = this.getFriendlyJwtErrorMessage(err.message);
      throw new UnauthorizedException(
        this.buildError('Token tidak valid', { token: [friendly] }),
      );
    }

    throw new UnauthorizedException(
      this.buildError('Autentikasi gagal', {
        auth: ['Terjadi kesalahan saat memverifikasi identitas pengguna'],
      }),
    );
  }

  /** Format response error standar */
  private buildError(
    message: string,
    errors: Record<string, string[] | string>,
  ): ApiResponse<null> {
    return { status: 'error', message, data: null, errors, meta: null };
  }

  /** Mapping pesan error JWT menjadi lebih ramah */
  private getFriendlyJwtErrorMessage(raw: string): string {
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

    const msg = raw.toLowerCase();
    for (const [key, value] of Object.entries(map)) {
      if (msg.includes(key)) return value;
    }

    return 'Token tidak dapat diverifikasi, silakan login ulang';
  }
}
