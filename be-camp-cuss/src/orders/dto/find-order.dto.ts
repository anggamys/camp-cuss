import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class FindOrderResponseDto {
  @IsNumber({}, { message: 'ID harus berupa angka' })
  id: number;

  @IsNumber({}, { message: 'User ID harus berupa angka' })
  userId: number;

  @IsNumber({}, { message: 'Driver ID harus berupa angka' })
  driverId: number;

  @IsNumber({}, { message: 'Destination ID harus berupa angka' })
  destinationId: number;

  @IsString({ message: 'Lokasi penjemputan harus berupa teks' })
  pickupLocation: string;

  @IsNumber({}, { message: 'Latitude penjemputan harus berupa angka' })
  pickupLatitude: number;

  @IsNumber({}, { message: 'Longitude penjemputan harus berupa angka' })
  pickupLongitude: number;

  @IsEnum(OrderStatus, { message: 'Status order tidak valid' })
  status: OrderStatus;

  @IsNumber({}, { message: 'Tanggal dibuat harus berupa angka' })
  createdAt: number;
}
