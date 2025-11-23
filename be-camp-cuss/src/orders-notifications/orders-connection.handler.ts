import { Injectable } from '@nestjs/common';
import { SocketWithUser } from './types/socket-user.interface';
import { JwtService } from '@nestjs/jwt';
import { UserPayload } from '../common/types/user-context.interface';
import {
  TokenExpiredError,
  JsonWebTokenError,
  NotBeforeError,
} from 'jsonwebtoken';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { Env } from '../common/constants/env.constant';

@Injectable()
export class OrdersConnectionHandler {
  private readonly context = OrdersConnectionHandler.name;

  constructor(
    private readonly jwtService: JwtService,
    private readonly logger: AppLoggerService,
  ) {}

  handleConnection(client: SocketWithUser): void {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn('Koneksi tanpa token, ditolak', this.context);

      client.emit('error', { message: 'Token tidak disertakan' });

      client.disconnect();
      return;
    }

    try {
      const accessSecret = Env.JWT_ACCESS_SECRET;

      const payload = this.jwtService.verify<UserPayload>(token, {
        secret: accessSecret,
      });

      client.user = payload;

      this.logger.log(
        `Client ${payload.username} (${payload.role}) berhasil terhubung`,
      );
    } catch (err) {
      const msg =
        err instanceof TokenExpiredError
          ? 'Token telah kedaluwarsa'
          : err instanceof NotBeforeError
            ? 'Token belum aktif'
            : err instanceof JsonWebTokenError
              ? 'Token tidak valid'
              : 'Autentikasi gagal';

      this.logger.warn(`Koneksi gagal: ${msg}`, this.context);

      client.emit('error', { message: msg });
      client.disconnect();
    }
  }

  handleDisconnect(client: SocketWithUser): void {
    this.logger.log(
      `Client ${client.user?.username || 'unknown'} terputus dari server`,
      this.context,
    );
  }

  private extractToken(client: SocketWithUser): string | null {
    const header = client.handshake.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.split(' ')[1];

    const queryToken = client.handshake.query.token;
    if (typeof queryToken === 'string' && queryToken.trim()) return queryToken;

    return null;
  }
}
