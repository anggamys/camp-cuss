import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.services';
import {
  JwtPayload,
  UserPayload,
} from '../../common/types/user-context.interface';
import { JwtEnvKeys } from '../../common/enums/env-keys.enum';
import { ApiResponse } from '../../common/types/api-response.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const jwtSecret = config.get<string>(JwtEnvKeys.JWT_ACCESS_SECRET, {
      infer: true,
    });

    if (!jwtSecret) {
      throw new Error('JWT_ACCESS_SECRET belum diatur di file .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true },
    });

    if (!user) {
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

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
