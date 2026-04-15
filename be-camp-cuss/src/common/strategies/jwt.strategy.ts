import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.services';
import {
  JwtPayload,
  UserPayload,
} from '../../common/types/user-context.interface';
import { ApiResponse } from '../../common/types/api-response.interface';
import { Env } from '../../common/constants/env.constant';
import { AppLoggerService } from '../loggers/app-logger.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {
    const jwtSecret = Env.JWT_ACCESS_SECRET;

    if (!jwtSecret) {
      logger.error('JWT_ACCESS_SECRET belum diatur di file .env');
      throw new Error('JWT_ACCESS_SECRET belum diatur di file .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserPayload> {
    this.logger.debug(`Memvalidasi payload JWT: ${JSON.stringify(payload)}`);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true },
    });

    if (!user) {
      this.logger.warn(
        `Pengguna tidak ditemukan untuk payload.sub: ${payload.sub}. Token mungkin valid tetapi pengguna tidak ada.`,
      );

      const errorResponse: ApiResponse<null> = {
        status: 'error',
        message: 'Pengguna tidak ditemukan atau token tidak valid',
        data: null,
        errors: {
          auth: [
            'Token valid tetapi data pengguna tidak ditemukan di database',
          ],
        },
        meta: null,
      };
      throw new UnauthorizedException(errorResponse);
    }

    this.logger.log(
      `Pengguna berhasil divalidasi: id=${user.id}, username=${user.username}`,
    );

    return {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
