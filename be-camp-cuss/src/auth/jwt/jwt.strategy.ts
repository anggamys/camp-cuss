import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.services';

interface JwtPayload {
  sub: number;
  username: string;
}

interface UserFromJwt {
  id: number;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET', {
        infer: true,
      }) as string,
    });
  }

  async validate(payload: JwtPayload): Promise<UserFromJwt> {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true },
    });

    if (!user) {
      throw new HttpException(
        'Pengguna tidak ditemukan',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
