import { ApprovalStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class DriverRequestUserDto {
  @IsInt({ message: 'ID harus berupa bilangan bulat' })
  id: number;

  @IsString({ message: 'Username harus berupa string' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username: string;

  @IsEmail({}, { message: 'Email harus berupa alamat email yang valid' })
  email: string;

  @IsString({ message: 'NPM harus berupa string' })
  @IsNotEmpty({ message: 'NPM tidak boleh kosong' })
  npm: string;

  @IsString({ message: 'Nomor telepon harus berupa string' })
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  no_phone: string;
}

export class DriverRequestItemDto {
  @IsInt({ message: 'ID harus berupa bilangan bulat' })
  id: number;

  @IsEnum(ApprovalStatus, {
    message: 'Status harus merupakan status persetujuan yang valid',
  })
  status: ApprovalStatus;

  @IsOptional()
  @IsString({ message: 'Catatan pengguna harus berupa string' })
  user_notes?: string | null;

  @IsOptional()
  @IsString({ message: 'Catatan admin harus berupa string' })
  admin_notes?: string | null;

  @Type(() => Date)
  @IsDate({ message: 'created_at harus berupa tanggal yang valid' })
  created_at: Date;

  @ValidateNested()
  @Type(() => DriverRequestUserDto)
  user: DriverRequestUserDto;
}
