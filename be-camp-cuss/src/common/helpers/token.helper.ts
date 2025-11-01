import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { JwtEnvKeys } from '../enums/env-keys.enum';

interface JwtPayload {
  sub: number;
  id: number;
  username: string;
  role: string;
}

export class TokenHelper {
  // Bangun payload JWT
  private static buildPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  // Pastikan environment numeric (detik)
  private static getRequiredNumber(config: ConfigService, key: string): number {
    const raw = config.get<string>(key);
    if (!raw) throw new Error(`Missing environment variable: ${key}`);

    const value = Number(raw);
    if (Number.isNaN(value) || value <= 0) {
      throw new Error(
        `Invalid numeric value for ${key}: must be a positive number (in seconds)`,
      );
    }
    return value;
  }

  // Pastikan environment string (secret)
  private static getRequiredString(config: ConfigService, key: string): string {
    const value = config.get<string>(key);
    if (!value) throw new Error(`Missing environment variable: ${key}`);
    return value;
  }

  // Generate Access Token
  static async generateAccessToken(
    jwt: JwtService,
    config: ConfigService,
    user: User,
  ): Promise<string> {
    const payload = this.buildPayload(user);

    const options: JwtSignOptions = {
      secret: this.getRequiredString(config, JwtEnvKeys.JWT_ACCESS_SECRET),
      expiresIn: this.getRequiredNumber(config, JwtEnvKeys.JWT_ACCESS_EXPIRES),
    };

    return jwt.signAsync(payload, options);
  }

  // Generate Refresh Token
  static async generateRefreshToken(
    jwt: JwtService,
    config: ConfigService,
    user: User,
  ): Promise<string> {
    const payload = this.buildPayload(user);

    const options: JwtSignOptions = {
      secret: this.getRequiredString(config, JwtEnvKeys.JWT_REFRESH_SECRET),
      expiresIn: this.getRequiredNumber(config, JwtEnvKeys.JWT_REFRESH_EXPIRES),
    };

    return jwt.signAsync(payload, options);
  }
}
