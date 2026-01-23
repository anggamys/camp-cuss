import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty({ message: 'Destination ID tidak boleh kosong' })
  @IsNumber({}, { message: 'Destination ID harus berupa angka' })
  destination_id: number;

  @IsNotEmpty({ message: 'Lokasi penjemputan tidak boleh kosong' })
  @IsString({ message: 'Lokasi penjemputan harus berupa teks' })
  pick_up_location: string;

  @IsNotEmpty({ message: 'Latitude penjemputan tidak boleh kosong' })
  @IsNumber({}, { message: 'Latitude harus berupa angka' })
  pick_up_latitude: number;

  @IsNotEmpty({ message: 'Longitude penjemputan tidak boleh kosong' })
  @IsNumber({}, { message: 'Longitude harus berupa angka' })
  pick_up_longitude: number;
}
