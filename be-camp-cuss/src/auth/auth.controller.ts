import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto, refreshTokenDto } from './dto/login.dto';
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
  async login(@Body() body: loginDto) {
    const tokens = await this.authService.login(body);

    return {
      status: 'success',
      message: 'Login successful',
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      },
    };
  }

  @HttpCode(200)
  @Post('refresh-token')
  async refreshToken(@Body() body: refreshTokenDto) {
    const tokens = await this.authService.refreshToken(body);
    return {
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        access_token: tokens.access_token,
      },
    };
  }
}
