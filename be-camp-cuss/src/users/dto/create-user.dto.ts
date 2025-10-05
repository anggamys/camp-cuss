/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  npm: string;

  @IsString()
  @IsNotEmpty()
  no_phone: string;

  @IsEnum(Role)
  @IsOptional()
  role: Role;

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

export class CreateUserResponseDto {
  @IsNotEmpty()
  id: number;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
