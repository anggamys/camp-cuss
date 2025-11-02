import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from './guards/jwt.guard';
import { Public } from '../common/decorators/public.decorator';
import { loginDto, refreshTokenDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body);

    return {
      message: 'Registrasi berhasil',
      data: user,
    };
  }

  @Public()
  @Post('login')
  async login(@Body() body: loginDto) {
    const tokens = await this.authService.login(body);

    return {
      message: 'Login berhasil',
      data: tokens,
    };
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() body: refreshTokenDto) {
    const tokens = await this.authService.refreshToken(body);

    return {
      message: 'Token berhasil diperbarui',
      data: tokens,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@User('id') userId: number) {
    await this.authService.logout(userId);

    return {
      message: 'Logout berhasil',
      data: null,
    };
  }
}
