import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Role } from '@prisma/client';

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

  @IsEnum(Role, { message: 'Role tidak valid' })
  @IsOptional()
  role: Role;
}

export class CreateUserResponseDto {
  @IsNotEmpty({ message: 'Id tidak boleh kosong' })
  id: number;

  @IsEmail({}, { message: 'Email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;
}
