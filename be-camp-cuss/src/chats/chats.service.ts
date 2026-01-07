import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { PrismaHelper } from '../common/helpers/prisma.helper';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ListMessageDto } from './dto/list-message.dto';
import { ChatsGateway } from './chats.gateway';
import { ErrorHelper } from '../common/helpers/error.helper';
import { Role } from '../common/enums/role.enum';
import {
  FindChatRoomDto,
  FindChatRoomResponseDto,
} from './dto/find-chat-room.dto';
import {
  CreateChatRoomDto,
  CreateChatRoomResponseDto,
} from './dto/create-chat-room.dto';
import { SocketWithUser } from '../common/types/socket-user.interface';
import { ConnectedSocket } from '@nestjs/websockets';

@Injectable()
export class ChatsService {
  private readonly context = ChatsService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly prismaHelper: PrismaHelper,
    @Inject(forwardRef(() => ChatsGateway))
    private readonly chatsGateway: ChatsGateway,
  ) {}

  async createChatRoom(
    dto: CreateChatRoomDto,
  ): Promise<CreateChatRoomResponseDto> {
    try {
      await this.prismaHelper.assertUnique('chatRoom', 'order_id', dto.orderId);

      const chatRoom = await this.prisma.chatRoom.create({
        data: {
          order_id: Number(dto.orderId),
          user_ids: dto.userIds,
        },
      });

      this.logger.debug(
        `Ruang chat baru dibuat untuk order ID: ${dto.orderId}`,
        this.context,
      );

      return {
        id: chatRoom.id,
        order_id: chatRoom.order_id,
        isActive: chatRoom.is_active,
        userIds: [],
      };
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        'Terjadi kesalahan saat membuat ruang chat',
        this.context,
      );
    }
  }

  async getRoomById(dto: FindChatRoomDto): Promise<FindChatRoomResponseDto> {
    try {
      await this.prismaHelper.assertExists('chatRoom', 'id', dto.roomId);

      const chatRoom = await this.prismaHelper.findRecord(
        'chatRoom',
        'id',
        dto.roomId,
      );

      if (!chatRoom) {
        throw new Error(`Ruang chat dengan ID: ${dto.roomId} tidak ditemukan.`);
      }

      this.logger.debug(
        `Mengambil ruang chat dengan ID: ${dto.roomId}`,
        this.context,
      );

      return chatRoom as FindChatRoomResponseDto;
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        'Terjadi kesalahan saat mengambil ruang chat',
        this.context,
      );
    }
  }

  async joinRoom(@ConnectedSocket() client: SocketWithUser): Promise<void> {
    try {
      const userId = client.user?.userId;
      this.logger.debug(`User ID joining room: ${userId}`, this.context);

      const chatRooms = await this.prismaHelper.findAllRecords('chatRoom', {
        where: {
          is_active: true,
          user_ids: { has: userId },
        },
      });

      for (const room of chatRooms) {
        const typedRoom = room as { id: number };

        if (typeof typedRoom.id === 'number' && typeof userId === 'number') {
          this.chatsGateway.addUserToRoomChat(typedRoom.id, client);
        } else {
          this.logger.warn(
            `Invalid room id or user id when joining chat room. Room: ${JSON.stringify(room)}, UserId: ${userId}`,
            this.context,
          );
        }
      }

      this.logger.debug(
        `User ID: ${userId} bergabung ke semua ruang chat aktif yang terkait`,
        this.context,
      );
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        'Terjadi kesalahan saat bergabung ke ruang chat',
        this.context,
      );
    }
  }

  async closeChatRoom(orderId: number): Promise<void> {
    try {
      await this.prismaHelper.assertExists('chatRoom', 'order_id', orderId);

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error(
          `Order dengan ID #${orderId} tidak ditemukan, tidak dapat menutup ruang chat.`,
        );
      }

      if (order.status !== 'completed' && order.status !== 'canceled') {
        throw new Error(
          `Order #${orderId} belum selesai atau dibatalkan, tidak dapat menutup ruang chat.`,
        );
      }

      await this.prisma.chatRoom.updateMany({
        where: { order_id: orderId },
        data: { is_active: false },
      });

      this.logger.debug(
        `Ruang chat untuk order ID: ${orderId} telah ditutup`,
        this.context,
      );
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        'Terjadi kesalahan saat menutup ruang chat',
        this.context,
      );
    }
  }

  async sendMessage(
    roomId: number,
    senderId: number,
    senderRole: Role,
    dto: SendMessageDto,
  ): Promise<void> {
    try {
      await this.prismaHelper.assertExists('chatRoom', 'id', roomId);

      await this.prisma.chatMessage.create({
        data: {
          chat_room_id: roomId,
          sender_id: senderId,
          sender_role: senderRole || 'customer',
          message: dto.message,
        },
      });

      this.chatsGateway.sendMessageToRoom(roomId, dto.message);

      this.logger.debug(
        `Pesan baru berhasil dikirim di room ID: ${roomId} oleh user ID: ${senderId}`,
        this.context,
      );
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        'Terjadi kesalahan saat mengirim pesan',
        this.context,
      );
    }
  }

  async getAllMessagesInRoom(roomId: number): Promise<ListMessageDto[]> {
    try {
      await this.prismaHelper.assertExists('chatRoom', 'id', roomId);

      const messages = await this.prisma.chatMessage.findMany({
        where: { chat_room_id: roomId },
        orderBy: { created_at: 'asc' },
      });

      this.logger.debug(
        `Mengambil semua pesan di room ID: ${roomId}`,
        this.context,
      );

      return messages.map((msg) => ({
        roomId: msg.chat_room_id,
        senderId: msg.sender_id,
        senderRole: msg.sender_role as ListMessageDto['senderRole'],
        message: msg.message,
        readBy: Array.isArray(msg.read_by) ? (msg.read_by as string[]) : [],
        createdAt: msg.created_at,
      }));
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        'Terjadi kesalahan saat mengambil pesan',
        this.context,
      );
    }
  }
}
