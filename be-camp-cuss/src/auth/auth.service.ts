// src/auth/auth.service.ts
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
import { RegisterDto, RegisterUserResponseDto } from './dto/register.dto';
import { PasswordHelper } from '../common/helpers/password.helper';
import { TokenHelper } from '../common/helpers/token.helper';
import { ValidationHelper } from '../common/helpers/validation.helper';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { TokenStoreHelper } from '../common/helpers/token-store.helper';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly validation: ValidationHelper,
    private readonly tokenStore: TokenStoreHelper,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterUserResponseDto> {
    this.logger.log(`Register user: ${dto.email}`);
    await this.validation.assertUnique('user', 'email', dto.email);
    await this.validation.assertUnique('user', 'username', dto.username);

    const hashed = await PasswordHelper.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { ...dto, password: hashed },
      select: { id: true, email: true, username: true },
    });
    this.logger.log(`User registered id=${user.id}`);
    return user;
  }

  async login(dto: loginDto): Promise<responseLoginDto> {
    const { username, password } = dto;
    this.logger.log(`Login attempt: ${username}`);

    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user)
      throw new HttpException('Pengguna tidak ditemukan', HttpStatus.NOT_FOUND);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      throw new HttpException('Password salah', HttpStatus.UNAUTHORIZED);

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

    this.logger.log(`Login success: userId=${user.id}`);
    return { access_token: access, refresh_token: refresh };
  }

  async refreshToken(dto: refreshTokenDto): Promise<responseRefreshTokenDto> {
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
      throw new HttpException('Token tidak valid', HttpStatus.UNAUTHORIZED);

    const match = await PasswordHelper.compare(
      refresh_token,
      user.refresh_token,
    );
    if (!match)
      throw new HttpException('Token tidak valid', HttpStatus.UNAUTHORIZED);

    const newAccess = await TokenHelper.generateAccessToken(
      this.jwt,
      this.config,
      user,
    );

    this.logger.log(`Token refreshed for userId=${user.id}`);
    return { access_token: newAccess };
  }

  async logout(userId: number, accessToken?: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token: null },
    });

    if (accessToken) this.tokenStore.add(accessToken);
    this.logger.log(`User logout success: id=${userId}`);
  }

  /** Mengecek token di blacklist */
  isTokenBlacklisted(token: string): boolean {
    return this.tokenStore.has(token);
  }
}
