import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../common/decorators/user.decorator';
import { Role } from '../common/enums/user.enum';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('chats')
@Roles(Role.Customer, Role.Driver)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('room/:roomId/send-message')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @User('role') senderRole: Role,
    @Param('roomId') roomId: number,
    @User('userId') senderId: number,
  ) {
    const message = await this.chatsService.sendMessage(
      roomId,
      senderId,
      senderRole,
      dto,
    );

    return { message: 'Pesan berhasil dikirim', data: message };
  }

  @Get('room/:roomId/messages')
  async getAllMessagesInRoom(@Param('roomId') roomId: number) {
    const chats = await this.chatsService.getAllMessagesInRoom(roomId);

    return { messages: 'Berhasil mengambil semua pesan', data: chats };
  }
}
