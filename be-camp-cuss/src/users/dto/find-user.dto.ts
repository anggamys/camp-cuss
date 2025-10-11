import { IsOptional, IsInt, IsString, IsEmail, Matches } from 'class-validator';

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
  @Matches(/^\d+$/, { message: 'NPM harus berupa angka' })
  npm?: string;

  @IsOptional()
  @Matches(/^\+?[0-9\s-]+$/, { message: 'Nomor telepon tidak valid' })
  no_phone?: string;

  @IsOptional()
  @IsString({ message: 'Role harus berupa teks' })
  role?: string;
}
