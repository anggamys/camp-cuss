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
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { RegisterDto, RegisterUserResponseDto } from './dto/register.dto';
import { PasswordHelper } from '../common/helpers/password.helper';
import { TokenHelper } from '../common/helpers/token.helper';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterUserResponseDto> {
    await this.validateUniqueFields(registerDto.email, registerDto.username);

    const hashedPassword = await PasswordHelper.hash(registerDto.password);

    return this.prisma.users.create({
      data: { ...registerDto, password: hashedPassword },
      select: { id: true, email: true },
    });
  }

  async login(loginDto: loginDto): Promise<responseLoginDto> {
    const { username, password } = loginDto;

    const user = await this.prisma.users.findUnique({ where: { username } });
    if (!user)
      throw new HttpException('Pengguna tidak ditemukan', HttpStatus.NOT_FOUND);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new HttpException(
        'Kredensial tidak valid',
        HttpStatus.UNAUTHORIZED,
      );

    const accessToken = await TokenHelper.generateAccessToken(
      this.jwt,
      this.config,
      user,
    );
    const refreshToken = await TokenHelper.generateRefreshToken(
      this.jwt,
      this.config,
      user,
    );

    const hashedRefresh = await PasswordHelper.hash(refreshToken);

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
          'Refresh token tidak ditemukan',
          HttpStatus.UNAUTHORIZED,
        );

      const isValid = await PasswordHelper.compare(
        refresh_token,
        user.refresh_token,
      );
      if (!isValid)
        throw new HttpException(
          'Refresh token tidak valid',
          HttpStatus.UNAUTHORIZED,
        );

      const newRefreshToken = await TokenHelper.generateRefreshToken(
        this.jwt,
        this.config,
        user,
      );

      const hashedRefresh = await PasswordHelper.hash(newRefreshToken);

      await this.prisma.users.update({
        where: { id: user.id },
        data: { refresh_token: hashedRefresh },
      });

      const newAccessToken = await TokenHelper.generateAccessToken(
        this.jwt,
        this.config,
        user,
      );

      return { access_token: newAccessToken };
    } catch (err) {
      if (err instanceof TokenExpiredError)
        throw new HttpException(
          'Refresh token telah kedaluwarsa',
          HttpStatus.UNAUTHORIZED,
        );
      if (err instanceof JsonWebTokenError)
        throw new HttpException(
          'Refresh token tidak valid',
          HttpStatus.UNAUTHORIZED,
        );
      throw new HttpException('Kesalahan otentikasi', HttpStatus.UNAUTHORIZED);
    }
  }

  async logout(userId: number): Promise<void> {
    try {
      console.log('Logging out user with ID:', userId);

      await this.prisma.users.update({
        where: { id: userId },
        data: { refresh_token: null },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      throw new HttpException(
        { message: 'Gagal logout', errors: { logout: errorMessage } },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async validateUniqueFields(email: string, username: string) {
    const [emailExists, usernameExists] = await Promise.all([
      this.prisma.users.findUnique({ where: { email } }),
      this.prisma.users.findUnique({ where: { username } }),
    ]);

    if (emailExists || usernameExists) {
      throw new HttpException(
        {
          message: 'Validasi gagal',
          errors: {
            email: emailExists ? 'Email sudah digunakan' : undefined,
            username: usernameExists ? 'Username sudah digunakan' : undefined,
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
