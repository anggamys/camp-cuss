import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.services';
import {
  loginDto,
  refreshTokenDto,
  responseLoginDto,
  responseRefreshTokenDto,
} from './dto/login.dto';
import { users } from '@prisma/client';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { RegisterDto, RegisterUserResponseDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterUserResponseDto> {
    await this.validateUniqueFields(registerDto.email, registerDto.username);

    const hashedPassword = await this.hashPassword(registerDto.password);

    return this.prisma.users.create({
      data: { ...registerDto, password: hashedPassword },
      select: { id: true, email: true },
    });
  }

  async login(loginDto: loginDto): Promise<responseLoginDto> {
    const { username, password } = loginDto;

    const user = await this.prisma.users.findUnique({ where: { username } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.prisma.users.update({
      where: { id: user.id },
      data: { refresh_token: hashedRefresh },
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async refreshToken(
    refreshTokenDto: refreshTokenDto,
  ): Promise<responseRefreshTokenDto> {
    const { refresh_token } = refreshTokenDto;

    try {
      const decoded = this.jwt.verify<{
        sub: number | string;
        username: string;
      }>(refresh_token, { secret: this.config.get('JWT_REFRESH_SECRET') });

      const userId =
        typeof decoded.sub === 'string' ? Number(decoded.sub) : decoded.sub;

      const user = await this.prisma.users.findUnique({
        where: { id: userId },
      });
      if (!user || !user.refresh_token)
        throw new HttpException(
          'Refresh token not found',
          HttpStatus.UNAUTHORIZED,
        );

      const isValid = await bcrypt.compare(refresh_token, user.refresh_token);
      if (!isValid)
        throw new HttpException(
          'Invalid refresh token',
          HttpStatus.UNAUTHORIZED,
        );

      const newRefreshToken = await this.generateRefreshToken(user);
      const hashedRefresh = await bcrypt.hash(newRefreshToken, 10);
      await this.prisma.users.update({
        where: { id: user.id },
        data: { refresh_token: hashedRefresh },
      });

      const newAccessToken = await this.generateAccessToken(user);
      return { access_token: newAccessToken };
    } catch (err) {
      if (err instanceof TokenExpiredError)
        throw new HttpException(
          'Refresh token expired',
          HttpStatus.UNAUTHORIZED,
        );
      if (err instanceof JsonWebTokenError)
        throw new HttpException(
          'Invalid refresh token',
          HttpStatus.UNAUTHORIZED,
        );
      throw new HttpException('Auth error', HttpStatus.UNAUTHORIZED);
    }
  }

  async logout(userId: number) {
    await this.prisma.users.update({
      where: { id: userId },
      data: { refresh_token: null },
    });
    return { status: 'success', message: 'Logout berhasil' };
  }

  private async generateAccessToken(user: users): Promise<string> {
    const payload = { sub: user.id, username: user.username };
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES'),
    });
  }

  private async generateRefreshToken(user: users): Promise<string> {
    const payload = { sub: user.id, username: user.username };
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES'),
    });
  }

  private async validateUniqueFields(email: string, username: string) {
    const [emailExists, usernameExists] = await Promise.all([
      this.prisma.users.findUnique({ where: { email } }),
      this.prisma.users.findUnique({ where: { username } }),
    ]);

    if (emailExists || usernameExists) {
      throw new HttpException(
        {
          message: 'Validation failed',
          errors: {
            email: emailExists ? 'Email already used' : undefined,
            username: usernameExists ? 'Username already used' : undefined,
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }
}
