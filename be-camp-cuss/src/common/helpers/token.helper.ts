import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { users } from '@prisma/client';

interface JwtPayload {
  sub: number;
  id: number;
  username: string;
  role: string;
}

export class TokenHelper {
  private static buildPayload(user: users): JwtPayload {
    return {
      sub: user.id,
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  private static getRequiredNumber(config: ConfigService, key: string): number {
    const value = config.get<number>(key);
    if (value === undefined || value === null || isNaN(value))
      throw new Error(
        `Missing or invalid numeric environment variable: ${key}`,
      );
    return Number(value);
  }

  private static getRequiredString(config: ConfigService, key: string): string {
    const value = config.get<string>(key);
    if (!value) throw new Error(`Missing environment variable: ${key}`);
    return value;
  }

  static async generateAccessToken(
    jwt: JwtService,
    config: ConfigService,
    user: users,
  ): Promise<string> {
    const payload = this.buildPayload(user);

    const options: JwtSignOptions = {
      secret: this.getRequiredString(config, 'JWT_ACCESS_SECRET'),
      expiresIn: this.getRequiredNumber(config, 'JWT_ACCESS_EXPIRES'),
    };

    return jwt.signAsync(payload, options);
  }

  static async generateRefreshToken(
    jwt: JwtService,
    config: ConfigService,
    user: users,
  ): Promise<string> {
    const payload = this.buildPayload(user);

    const options: JwtSignOptions = {
      secret: this.getRequiredString(config, 'JWT_REFRESH_SECRET'),
      expiresIn: this.getRequiredNumber(config, 'JWT_REFRESH_EXPIRES'),
    };

    return jwt.signAsync(payload, options);
  }
}
