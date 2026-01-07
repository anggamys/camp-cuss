import { IsBoolean, IsNumber } from 'class-validator';

export class FindChatRoomDto {
  @IsNumber({}, { message: 'ID ruang chat harus berupa angka' })
  roomId: number;
}

export class FindChatRoomResponseDto {
  @IsNumber({}, { message: 'ID ruang chat harus berupa angka' })
  id: number;

  @IsNumber({}, { message: 'ID order harus berupa angka' })
  order_id: number;

  @IsBoolean({ message: 'Status aktif harus berupa boolean' })
  isActive: boolean;

  @IsNumber({}, { each: true, message: 'Daftar user IDs harus berupa angka' })
  userIds: number[];
}
