import { IsString } from 'class-validator';

export class SendMessageDto {
  @IsString({ message: 'Pesan harus berupa teks' })
  message: string;
}
