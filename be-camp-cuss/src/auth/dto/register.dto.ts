import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsString({ message: 'Username harus berupa string' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username: string;

  @IsEmail({}, { message: 'Email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;

  @IsString({ message: 'NPM harus berupa string' })
  @IsNotEmpty({ message: 'NPM tidak boleh kosong' })
  npm: string;

  @IsString({ message: 'Nomor telepon harus berupa string' })
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  no_phone: string;

  @IsEnum(Role, { message: 'Role tidak valid' })
  @IsOptional()
  role: Role;

  @IsString({ message: 'KTM harus berupa string' })
  @IsOptional()
  ktm?: string;

  @IsString({ message: 'KTP harus berupa string' })
  @IsOptional()
  ktp?: string;

  @IsString({ message: 'SIM harus berupa string' })
  @IsOptional()
  sim?: string;

  @IsString({ message: 'Photo profile harus berupa string' })
  @IsOptional()
  photo_profile?: string;

  @IsString({ message: 'Refresh token harus berupa string' })
  @IsOptional()
  refresh_token?: string;
}

export class RegisterUserResponseDto {
  @IsNotEmpty({ message: 'Id tidak boleh kosong' })
  id: number;

  @IsEmail({}, { message: 'Email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;
}
