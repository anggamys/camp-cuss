import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString({ message: 'Username harus berupa string' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username: string;

  @IsEmail({}, { message: 'Email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;

  @IsString({ message: 'Nomor Pokok Mahasiswa harus berupa string angka' })
  @IsNotEmpty({ message: 'Nomor Pokok Mahasiswa tidak boleh kosong' })
  npm: string;

  @IsString({ message: 'Nomor telepon harus berupa string angka' })
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  no_phone: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role tidak valid' })
  role: UserRole;

  @IsOptional()
  @IsString({ message: 'Photo profile harus berupa string' })
  photo_profile?: string;

  @IsOptional()
  @IsString({ message: 'Photo driving license harus berupa string' })
  photo_driving_license?: string;

  @IsOptional()
  @IsString({ message: 'Photo student card harus berupa string' })
  photo_student_card?: string;

  @IsOptional()
  @IsString({ message: 'Photo ID card harus berupa string' })
  photo_id_card?: string;
}

export class CreateUserResponseDto {
  @IsNotEmpty({ message: 'Id tidak boleh kosong' })
  id: number;

  @IsEmail({}, { message: 'Email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString({ message: 'Username harus berupa string' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username: string;
}
