import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { JwtEnvKeys } from '../enums/env-keys.enum';

interface JwtPayload {
  sub: number;
  username: string;
  role: string;
}

export class TokenHelper {
  /** Build JWT payload */
  private static buildPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
  }

  /** Read numeric env var (in seconds) */
  private static getNumber(config: ConfigService, key: string): number {
    const raw = config.get<string>(key);
    if (!raw) throw new Error(`Missing env: ${key}`);
    const value = Number(raw);
    if (isNaN(value) || value <= 0)
      throw new Error(`Invalid number in ${key}: ${raw}`);
    return value;
  }

  /** Read string env var */
  private static getString(config: ConfigService, key: string): string {
    const value = config.get<string>(key);
    if (!value) throw new Error(`Missing env: ${key}`);
    return value;
  }

  /** Generate Access Token */
  static async generateAccessToken(
    jwt: JwtService,
    config: ConfigService,
    user: User,
  ): Promise<string> {
    const payload = this.buildPayload(user);
    const options: JwtSignOptions = {
      secret: this.getString(config, JwtEnvKeys.JWT_ACCESS_SECRET),
      expiresIn: this.getNumber(config, JwtEnvKeys.JWT_ACCESS_EXPIRES),
    };
    return jwt.signAsync(payload, options);
  }

  /** Generate Refresh Token */
  static async generateRefreshToken(
    jwt: JwtService,
    config: ConfigService,
    user: User,
  ): Promise<string> {
    const payload = this.buildPayload(user);
    const options: JwtSignOptions = {
      secret: this.getString(config, JwtEnvKeys.JWT_REFRESH_SECRET),
      expiresIn: this.getNumber(config, JwtEnvKeys.JWT_REFRESH_EXPIRES),
    };
    return jwt.signAsync(payload, options);
  }

  /** Verify token type */
  static verifyToken<T extends object>(
    jwt: JwtService,
    config: ConfigService,
    token: string,
    type: 'access' | 'refresh',
  ): T {
    const secret =
      type === 'access'
        ? this.getString(config, JwtEnvKeys.JWT_ACCESS_SECRET)
        : this.getString(config, JwtEnvKeys.JWT_REFRESH_SECRET);
    try {
      return jwt.verify<T>(token, { secret });
    } catch (err) {
      if (err instanceof TokenExpiredError)
        throw new HttpException(
          `${type} token telah kedaluwarsa`,
          HttpStatus.UNAUTHORIZED,
        );
      if (err instanceof JsonWebTokenError)
        throw new HttpException(
          `${type} token tidak valid`,
          HttpStatus.UNAUTHORIZED,
        );
      throw new HttpException(
        `Kesalahan verifikasi ${type} token`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /** Decode tanpa throw */
  static decode(
    jwt: JwtService,
    token: string,
  ): Record<string, unknown> | null {
    try {
      const decoded: unknown = jwt.decode(token);
      return decoded && typeof decoded === 'object' && !Array.isArray(decoded)
        ? (decoded as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  /** Ambil waktu kedaluwarsa (UNIX seconds) */
  static getExpiry(jwt: JwtService, token: string): number | null {
    const decoded = this.decode(jwt, token);
    return decoded && typeof decoded.exp === 'number' ? decoded.exp : null;
  }
}
