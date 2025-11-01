import { Injectable } from '@nestjs/common';
import { SocketWithUser } from './types/socket-user.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtEnvKeys } from '../common/enums/env-keys.enum';
import { UserPayload } from '../common/types/user-context.interface';
import { UserRole } from '@prisma/client';

@Injectable()
export class OrdersConnectionHandler {
  private readonly connectedDrivers = new Map<string, UserPayload>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: SocketWithUser) {
    const token = this.extractToken(client);
    if (!token) {
      console.log('Token tidak disertakan, koneksi ditolak');
      client.disconnect();
      return;
    }

    try {
      const secret = this.config.get<string>(JwtEnvKeys.JWT_ACCESS_SECRET);
      const payload = this.jwtService.verify<UserPayload>(token, { secret });
      client.user = payload;

      if (payload.role === UserRole.driver) {
        this.connectedDrivers.set(client.id, payload);
        void client.join('drivers');
        console.log(`Driver ${payload.username} terhubung`);
      } else {
        console.log(`User ${payload.username} (${payload.role}) terhubung`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.log('Token invalid:', errorMessage);
      client.disconnect();
    }
  }

  handleDisconnect(client: SocketWithUser) {
    if (this.connectedDrivers.has(client.id)) {
      const user = this.connectedDrivers.get(client.id);
      console.log(`Driver ${user?.username} terputus`);
      this.connectedDrivers.delete(client.id);
    }
  }

  handleDriverSubscribe(client: SocketWithUser): void {
    if (client.user?.role === UserRole.driver) {
      void client.join('drivers');
      console.log(`Driver ${client.user.username} subscribe ke notifikasi`);
    }
  }

  private extractToken(client: SocketWithUser): string | null {
    const header = client.handshake.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.split(' ')[1];
    }

    const queryToken = client.handshake.query.token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
      return queryToken;
    }

    return null;
  }
}
