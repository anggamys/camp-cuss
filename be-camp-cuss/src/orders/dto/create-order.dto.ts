import { OrderStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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

export class CreateOrderResponseDto {
  @IsNumber({}, { message: 'ID harus berupa angka' })
  id: number;

  @IsNumber({}, { message: 'User ID harus berupa angka' })
  user_id: number;

  @IsOptional()
  @IsNumber({}, { message: 'Driver ID harus berupa angka' })
  driver_id: number | null;

  @IsNumber({}, { message: 'Destination ID harus berupa angka' })
  destination_id: number;

  @IsString({ message: 'Lokasi penjemputan harus berupa teks' })
  pick_up_location: string;

  @IsNumber({}, { message: 'Latitude penjemputan harus berupa angka' })
  pick_up_latitude: number;

  @IsNumber({}, { message: 'Longitude penjemputan harus berupa angka' })
  pick_up_longitude: number;

  @IsEnum(OrderStatus, { message: 'Status order tidak valid' })
  status: OrderStatus;

  @IsNumber({}, { message: 'Tanggal dibuat harus berupa angka' })
  created_at: Date;

  @IsNumber({}, { message: 'Tanggal diperbarui harus berupa angka' })
  updated_at: Date;
}
