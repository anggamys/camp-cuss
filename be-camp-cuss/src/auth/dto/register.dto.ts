import { UserRole } from '@prisma/client';
import { IsEmail, IsString, IsNotEmpty, IsEnum } from 'class-validator';

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

  @IsEnum(UserRole, { message: 'Role tidak valid' })
  role?: UserRole;

  @IsString({ message: 'Nomor telepon harus berupa string' })
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  no_phone: string;
}

export class RegisterUserResponseDto {
  @IsNotEmpty({ message: 'Id tidak boleh kosong' })
  id: number;

  @IsEmail({}, { message: 'Email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString({ message: 'Username harus berupa string' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username: string;
}
