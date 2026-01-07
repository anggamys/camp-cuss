import { IsBoolean, IsNumber } from 'class-validator';

export class CreateChatRoomDto {
  @IsNumber({}, { message: 'ID order harus berupa angka' })
  orderId: number | string;

  @IsNumber({}, { each: true, message: 'Daftar user IDs harus berupa angka' })
  userIds?: number[];
}

export class CreateChatRoomResponseDto {
  @IsNumber({}, { message: 'ID ruang chat harus berupa angka' })
  id: number;

  @IsNumber({}, { message: 'ID order harus berupa angka' })
  order_id: number;

  @IsBoolean({ message: 'Status aktif harus berupa boolean' })
  isActive: boolean;

  @IsNumber({}, { each: true, message: 'Daftar user IDs harus berupa angka' })
  userIds: number[];
}
