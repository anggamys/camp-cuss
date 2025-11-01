import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateRequestDriverDto {
  @IsString({ message: 'Catatan pengguna harus berupa teks' })
  user_notes: string;
}

export class ResponseCreateRequestDriverDto {
  @IsInt({ message: 'ID harus berupa bilangan bulat' })
  id: number;

  @IsInt({ message: 'ID pengguna harus berupa bilangan bulat' })
  user_id: number;

  @IsString({ message: 'Status harus berupa teks' })
  status: string;

  @IsOptional()
  @IsString({ message: 'Catatan pengguna harus berupa teks' })
  user_notes?: string | null;

  @IsOptional()
  @IsString({ message: 'Catatan admin harus berupa teks' })
  admin_notes?: string | null;

  @IsOptional()
  @IsInt({ message: 'ID yang menyetujui harus berupa bilangan bulat' })
  approved_by?: number | null;
}
