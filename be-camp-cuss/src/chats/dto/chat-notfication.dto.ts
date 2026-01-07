import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChatNotificationDto {
  @IsNotEmpty({ message: 'ID chat tidak boleh kosong' })
  @IsNumber({}, { message: 'ID chat harus berupa angka' })
  id: number;

  @IsNotEmpty({ message: 'ID pengirim tidak boleh kosong' })
  @IsNumber({}, { message: 'ID pengirim harus berupa angka' })
  sender_id: number;

  @IsNotEmpty({ message: 'ID penerima tidak boleh kosong' })
  @IsNumber({}, { message: 'ID penerima harus berupa angka' })
  receiver_id: number;

  @IsNotEmpty({ message: 'Pesan tidak boleh kosong' })
  @IsString({ message: 'Pesan harus berupa teks' })
  message: string;
}
