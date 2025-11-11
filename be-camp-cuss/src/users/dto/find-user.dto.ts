import { DriverStatus, UserRole } from '@prisma/client';
import {
  IsOptional,
  IsInt,
  IsString,
  IsEmail,
  Matches,
  IsEnum,
} from 'class-validator';

export class FindUserResponseDto {
  @IsOptional()
  @IsInt({ message: 'ID harus berupa angka' })
  id?: number;

  @IsOptional()
  @IsString({ message: 'Username harus berupa teks' })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email tidak valid' })
  email?: string;

  @IsOptional()
  @Matches(/^\d+$/, { message: 'Nomor Pokok Mahasiswa harus berupa angka' })
  npm?: string;

  @IsOptional()
  @Matches(/^\+?[0-9\s-]+$/, { message: 'Nomor telepon tidak valid' })
  no_phone?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role user tidak valid' })
  role?: UserRole;

  @IsOptional()
  @IsEnum(DriverStatus, { message: 'Status driver tidak valid' })
  driverStatus?: DriverStatus;

  @IsOptional()
  @IsString({ message: 'Foto profil harus berupa teks' })
  photo_profile?: string | null;

  @IsOptional()
  @IsString({ message: 'Foto Kartu Tanda Penduduk harus berupa teks' })
  photo_id_card?: string | null;

  @IsOptional()
  @IsString({ message: 'Foto Surat Izin Mengemudi harus berupa teks' })
  photo_driving_license?: string | null;

  @IsOptional()
  @IsString({ message: 'Foto Kartu Tanda Mahasiswa harus berupa teks' })
  photo_student_card?: string | null;
}
