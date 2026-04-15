import { IsString, IsOptional } from 'class-validator';

export class AuthResponseDto {
  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ResponseRefreshTokenDto {
  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class RegisterUserResponseDto {
  @IsOptional()
  id?: number;

  @IsOptional()
  email?: string;

  @IsOptional()
  username?: string;
}
