import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';
import { IsInt } from 'class-validator';

export class UpdateUserDto {
  @IsString({ message: 'Username harus berupa string' })
  @IsOptional()
  username?: string;

  @IsEmail({}, { message: 'Email tidak valid' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Password harus berupa string' })
  @IsOptional()
  password?: string;

  @IsString({ message: 'NPM harus berupa string' })
  @IsOptional()
  npm?: string;

  @IsString({ message: 'Nomor telepon harus berupa string' })
  @IsOptional()
  no_phone?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role tidak valid' })
  role?: UserRole;

  @IsString({ message: 'KTM harus berupa string' })
  @IsOptional()
  ktm?: string;

  @IsString({ message: 'KTP harus berupa string' })
  @IsOptional()
  ktp?: string;

  @IsString({ message: 'SIM harus berupa string' })
  @IsOptional()
  sim?: string;

  @IsString({ message: 'Foto profil harus berupa string' })
  @IsOptional()
  photo_profile?: string;

  @IsString({ message: 'Refresh token harus berupa string' })
  @IsOptional()
  refresh_token?: string;
}

export class UpdateUserResponseDto {
  @IsInt({ message: 'Id harus berupa angka' })
  id: number;

  @IsString({ message: 'Username harus berupa string' })
  username: string;

  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;

  @IsString({ message: 'NPM harus berupa string' })
  npm: string;

  @IsString({ message: 'Nomor telepon harus berupa string' })
  no_phone: string;

  @IsEnum(UserRole, { message: 'Role tidak valid' })
  role: UserRole;
}
