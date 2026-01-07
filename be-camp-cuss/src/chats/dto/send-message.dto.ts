import { IsEnum, IsInt, IsNumber } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class SendMessageDto {
  @IsNumber()
  roomId: number;

  @IsNumber()
  senderId: number;

  @IsEnum(Role)
  senderRole?: Role;

  @IsInt()
  message: string;
}
