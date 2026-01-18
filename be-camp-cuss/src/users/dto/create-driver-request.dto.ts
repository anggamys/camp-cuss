import { IsString } from 'class-validator';

export class CreateDriverRequest {
  @IsString({ message: 'Catatan pengguna harus berupa teks' })
  user_notes: string;
}
