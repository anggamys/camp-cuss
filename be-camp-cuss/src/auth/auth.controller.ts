import { Body, Controller, Post, Res, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto, refreshTokenDto } from './dto/login.dto';
import { Response, Request } from 'express';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body);
    return { message: 'User registered successfully', data: user };
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() body: loginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(body);

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      status: 'success',
      message: 'Login berhasil',
      data: { access_token: tokens.access_token },
    };
  }

  // REFRESH TOKEN
  @HttpCode(200)
  @Post('refresh-token')
  async refreshToken(
    @Body() body: refreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.refreshToken(body);

    // Rotasi cookie refresh token (buat baru)
    res.cookie('refresh_token', body.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      status: 'success',
      message: 'Token diperbarui',
      data: token,
    };
  }
}
