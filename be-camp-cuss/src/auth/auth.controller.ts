import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto, refreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from './jwt/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body);
    return { message: 'User registered successfully', data: user };
  }

  @Post('login')
  async login(@Body() body: loginDto) {
    const tokens = await this.authService.login(body);

    return {
      status: 'success',
      message: 'Login berhasil',
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      },
    };
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: refreshTokenDto) {
    const tokens = await this.authService.refreshToken(body);
    return {
      status: 'success',
      message: 'Token berhasil diperbarui',
      data: {
        access_token: tokens.access_token,
      },
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@User('id') userAccessId: number) {
    await this.authService.logout(userAccessId);
    return { message: 'Logout berhasil' };
  }
}
