import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { AppLoggerService } from '../loggers/app-logger.service';

interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedSocket extends Socket {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

@Injectable()
export class WsAuthMiddleware {
  private readonly context = 'WsAuthMiddleware';

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  use(socket: AuthenticatedSocket, next: (err?: Error) => void): void {
    const socketId = socket.id;
    const rawAddr =
      socket.handshake.address ??
      socket.handshake.headers['x-forwarded-for'] ??
      'unknown';
    const addr = Array.isArray(rawAddr) ? rawAddr.join(',') : String(rawAddr);
    this.logger.debug(
      `Authenticating socket ${socketId} from ${addr}`,
      this.context,
    );

    try {
      // ambil token dari query atau header
      const token =
        (socket.handshake.query.token as string) ||
        (socket.handshake.headers.authorization as string)?.replace(
          'Bearer ',
          '',
        );

      if (!token) {
        this.logger.warn(`Missing token for socket ${socketId}`, this.context);
        throw new UnauthorizedException('Token wajib disertakan');
      }

      const secret = this.config.get<string>('JWT_ACCESS_SECRET');
      if (!secret) {
        this.logger.error('JWT secret not configured', this.context);
        throw new UnauthorizedException('JWT secret not configured');
      }

      const payload = this.jwt.verify<JwtPayload>(token, { secret });

      socket.user = {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
      };

      this.logger.debug(
        `Socket ${socketId} authenticated as user=${payload.username} id=${payload.sub}`,
        this.context,
      );

      next(); // lanjut koneksi
    } catch (err) {
      // Log the reason without leaking token or sensitive data
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Authentication failed for socket ${socketId}: ${message}`,
        this.context,
      );
      next(new UnauthorizedException('Token tidak valid atau kedaluwarsa'));
    }
  }
}
