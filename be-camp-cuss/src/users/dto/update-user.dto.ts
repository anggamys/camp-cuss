import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../common/enums/user.enum';

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
  @IsEnum(Role, { message: 'Role tidak valid' })
  role?: Role;

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
