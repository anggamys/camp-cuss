import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class ListMessageDto {
  @IsNumber()
  roomId: number;

  @IsNumber()
  senderId: number;

  @IsEnum(Role)
  senderRole?: Role;

  @IsString()
  message: string;

  @IsString()
  readBy: string[];

  @IsString()
  createdAt: Date;
}
