import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  npm?: string;

  @IsString()
  @IsOptional()
  no_phone?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  ktm?: string;

  @IsString()
  @IsOptional()
  ktp?: string;

  @IsString()
  @IsOptional()
  sim?: string;

  @IsString()
  @IsOptional()
  photo_profile?: string;

  @IsString()
  @IsOptional()
  refresh_token?: string;
}

export class UpdateUserResponseDto {
  id: number;
  username: string;
  email: string;
  npm: string;
  no_phone: string;
  role: Role;
}
