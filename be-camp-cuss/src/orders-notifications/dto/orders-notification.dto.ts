import { OrderStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class OrderAvailableNotificationDto {
  @IsNotEmpty({ message: 'ID tidak boleh kosong' })
  @IsNumber({}, { message: 'ID harus berupa angka' })
  id: number;

  @IsNotEmpty({ message: 'Customer ID tidak boleh kosong' })
  @IsNumber({}, { message: 'Customer ID harus berupa angka' })
  customer_id: number;

  @IsOptional()
  @IsNumber({}, { message: 'Driver ID harus berupa angka' })
  driver_id?: number | null;

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

  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Status order tidak valid' })
  status?: OrderStatus;
}
