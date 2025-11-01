import {
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseFilters, UseGuards } from '@nestjs/common';
import { OrdersNotificationsService } from './orders-notifications.service';
import { OrderAvailableNotificationDto } from './dto/orders-notification.dto';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { WsRolesGuard } from '../auth/guards/ws-roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { SocketWithUser } from './types/socket-user.interface';
import { WebsocketExceptionFilter } from '../common/filters/websocket-exception.filter';
import { OrdersConnectionHandler } from './orders-connection.handler';

@WebSocketGateway({ cors: true })
@UseGuards(WsJwtGuard, WsRolesGuard)
@UseFilters(WebsocketExceptionFilter)
export class OrdersNotificationsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly notifications: OrdersNotificationsService,
    private readonly connectionHandler: OrdersConnectionHandler,
  ) {}

  handleConnection(client: SocketWithUser) {
    this.connectionHandler.handleConnection(client);
  }

  handleDisconnect(client: SocketWithUser) {
    this.connectionHandler.handleDisconnect(client);
  }

  @Roles(Role.driver)
  @SubscribeMessage('subscribeNewOrders')
  handleDriverSubscribe(@ConnectedSocket() client: SocketWithUser) {
    return this.connectionHandler.handleDriverSubscribe(client);
  }

  broadcastNewOrderAvailable(notification: OrderAvailableNotificationDto) {
    this.server.to('drivers').emit('newOrderNotification', notification);
  }
}
