import { Server } from 'socket.io';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ChatsService } from './chats.service';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { forwardRef, Inject } from '@nestjs/common';
import { SocketWithUser } from '../common/types/socket-user.interface';
import { BaseGateway } from '../common/gateways/base.gateway';
import { WsAuthMiddleware } from '../common/middlewares/ws-auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: true, namespace: '/chats' })
export class ChatsGateway extends BaseGateway {
  protected readonly context = ChatsGateway.name;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => ChatsService))
    private readonly chatsService: ChatsService,
    protected readonly logger: AppLoggerService,
  ) {
    super(logger);
  }

  @WebSocketServer()
  server!: Server;

  afterInit(server: Server) {
    server.use((socket: SocketWithUser, next) => {
      const wsAuth = new WsAuthMiddleware(this.jwt, this.config, this.logger);

      wsAuth.use(socket, next);
    });
  }

  handleConnection(client: SocketWithUser) {
    this.logger.log(`Client ${client.id} connected`, this.context);

    void this.chatsService.joinRoom(client);
  }

  handleDisconnect(client: SocketWithUser) {
    this.logger.log(`Client ${client.id} disconnected`, this.context);
  }

  addUserToRoomChat(roomId: number, client: SocketWithUser) {
    const roomName = `room-${roomId}`;

    void client.join(roomName);

    this.logger.log(
      `Client ${client.id} joined room ${roomName}`,
      this.context,
    );
  }

  sendMessageToRoom(roomId: number, message: string) {
    this.logger.log(
      `Sending message to room ${roomId}: ${message}`,
      this.context,
    );

    this.server.to(`room-${roomId}`).emit('newMessage', { message });
  }
}
