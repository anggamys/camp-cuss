import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { users } from '@prisma/client';

export class TokenHelper {
  static async generateAccessToken(
    jwt: JwtService,
    config: ConfigService,
    user: users,
  ): Promise<string> {
    const payload = { ...user, sub: user.id };

    return jwt.signAsync(payload, {
      secret: config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: config.get<string>('JWT_ACCESS_EXPIRES'),
    });
  }

  static async generateRefreshToken(
    jwt: JwtService,
    config: ConfigService,
    user: users,
  ): Promise<string> {
    const payload = { ...user, sub: user.id };

    return jwt.signAsync(payload, {
      secret: config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: config.get<string>('JWT_REFRESH_EXPIRES'),
    });
  }
}
