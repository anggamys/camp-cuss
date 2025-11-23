// src/common/helpers/token-store.helper.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppLoggerService } from '../loggers/app-logger.service';

@Injectable()
export class TokenStoreHelper {
  private readonly loggerContext = TokenStoreHelper.name;
  private blacklist = new Set<string>();

  constructor(
    private readonly jwt: JwtService,
    private readonly logger: AppLoggerService,
  ) {}

  add(token: string): void {
    const decoded: unknown = this.jwt.decode(token);
    const exp = this.isDecodedWithExp(decoded) ? decoded.exp : 0;
    const ttl = exp ? exp - Math.floor(Date.now() / 1000) : 0;

    if (ttl > 0) {
      this.blacklist.add(token);
      this.logger.debug(`Token blacklisted; TTL=${ttl}s`, this.loggerContext);

      setTimeout(() => {
        this.blacklist.delete(token);
      }, ttl * 1000);
    } else {
      this.logger.debug(
        'Token sudah expired; tidak dimasukkan blacklist',
        this.loggerContext,
      );
    }
  }

  private isDecodedWithExp(decoded: unknown): decoded is { exp: number } {
    return (
      decoded !== null &&
      typeof decoded === 'object' &&
      'exp' in decoded &&
      typeof (decoded as { exp: unknown }).exp === 'number'
    );
  }

  has(token: string): boolean {
    return this.blacklist.has(token);
  }

  cleanup(): void {
    this.logger.debug(
      'Token cleanup scheduled (noop in-memory)',
      this.loggerContext,
    );
  }
}
