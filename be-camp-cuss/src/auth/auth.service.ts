import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.services';
import { loginDto, refreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordHelper } from '../common/helpers/password.helper';
import { TokenHelper } from '../common/helpers/token.helper';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { TokenStoreHelper } from '../common/helpers/token-store.helper';
import {
  AuthResponseDto,
  RegisterUserResponseDto,
} from './dto/auth-response.dto';
import { ErrorHelper } from '../common/helpers/error.helper';

@Injectable()
export class AuthService {
  private readonly context = AuthService.name;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly tokenStore: TokenStoreHelper,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterUserResponseDto> {
    try {
      this.logger.log(`Mendaftarkan pengguna dengan email: ${dto.email}`);

      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingEmail) {
        throw new HttpException(
          'Email sudah terdaftar, silakan gunakan email lain.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Cek username unik
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (existingUsername) {
        throw new HttpException(
          'Username sudah digunakan, silakan pilih username lain.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const hashed = await PasswordHelper.hash(dto.password);

      const user = await this.prisma.user.create({
        data: { ...dto, password: hashed },
        select: { id: true, email: true, username: true },
      });

      this.logger.log(
        `Pengguna berhasil didaftarkan dengan id=${user.id}`,
        this.context,
      );

      return user;
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Terjadi kesalahan saat mendaftar pengguna',
      );
    }
  }

  async login(dto: loginDto): Promise<AuthResponseDto> {
    try {
      const { username, password } = dto;

      this.logger.log(`Percobaan login oleh: ${username}`, this.context);

      const user = await this.prisma.user.findUnique({ where: { username } });

      if (!user)
        throw new HttpException(
          'Pengguna tidak ditemukan. Silakan cek username Anda.',
          HttpStatus.NOT_FOUND,
        );

      const valid = await bcrypt.compare(password, user.password);

      if (!valid)
        throw new HttpException(
          'Password yang Anda masukkan salah.',
          HttpStatus.UNAUTHORIZED,
        );

      const access = await TokenHelper.generateAccessToken(
        this.jwt,
        this.config,
        user,
      );

      const refresh = await TokenHelper.generateRefreshToken(
        this.jwt,
        this.config,
        user,
      );

      const hashedRefresh = await PasswordHelper.hash(refresh);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refresh_token: hashedRefresh },
      });

      this.logger.log(`Login berhasil untuk userId=${user.id}`, this.context);

      const data = { accessToken: access, refreshToken: refresh };

      return data;
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Terjadi kesalahan saat login',
      );
    }
  }

  async refreshToken(dto: refreshTokenDto): Promise<AuthResponseDto> {
    try {
      const { refresh_token } = dto;

      const decoded = TokenHelper.verifyToken<{ sub: number }>(
        this.jwt,
        this.config,
        refresh_token,
        'refresh',
      );

      const userId = Number(decoded.sub);

      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.refresh_token)
        throw new HttpException(
          'Refresh token tidak ditemukan. Silakan login kembali.',
          HttpStatus.UNAUTHORIZED,
        );

      const match = await PasswordHelper.compare(
        refresh_token,
        user.refresh_token,
      );

      if (!match)
        throw new HttpException(
          'Token tidak valid. Silakan login ulang.',
          HttpStatus.UNAUTHORIZED,
        );

      const newAccess = await TokenHelper.generateAccessToken(
        this.jwt,
        this.config,
        user,
      );

      this.logger.log(
        `Token berhasil diperbarui untuk userId=${user.id}`,
        this.context,
      );

      return { accessToken: newAccess };
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Terjadi kesalahan saat memperbarui token',
      );
    }
  }

  async logout(userId: number, accessToken?: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refresh_token: null },
      });

      if (accessToken) this.tokenStore.add(accessToken);

      this.logger.log(`Pengguna berhasil logout: id=${userId}`, this.context);
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Terjadi kesalahan saat logout',
      );
    }
  }

  isTokenBlacklisted(token: string): boolean {
    try {
      return this.tokenStore.has(token);
    } catch (error) {
      ErrorHelper.handle(
        error,
        this.logger,
        this.context,
        'Terjadi kesalahan saat memeriksa token blacklist',
      );
    }
  }
}
