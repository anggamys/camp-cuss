import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { SocketWithUser } from './types/socket-user.interface';
import { OrderAvailableNotificationDto } from './dto/orders-notification.dto';
import { ToggleOrderSubscriptionDto } from './dto/toggle-order-subs.dto';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { WsTransformInterceptor } from '../common/interceptors/ws-transform.interceptor';
import { AppLoggerService } from '../common/loggers/app-logger.service';

@UseGuards(WsJwtGuard)
@UseInterceptors(WsTransformInterceptor)
@WebSocketGateway({ cors: true, namespace: '/orders' })
export class OrdersNotificationsGateway implements OnGatewayInit {
  private serverReady = false;

  private readonly context = OrdersNotificationsGateway.name;
  private readonly activeDrivers = new Set<string>();

  constructor(private readonly logger: AppLoggerService) {}

  @WebSocketServer()
  server!: Server;

  afterInit(server: Server) {
    this.server = server;
    this.serverReady = true;
    this.logger.log('Gateway siap menerima koneksi & broadcast', this.context);
  }

  handleConnection(client: SocketWithUser) {
    this.logger.log(`Client ${client.id} terhubung`, this.context);
  }

  handleDisconnect(client: SocketWithUser) {
    if (this.activeDrivers.delete(client.id)) {
      this.logger.log(`Driver ${client.id} otomatis nonaktif`, this.context);
    }
  }

  @SubscribeMessage('toggleOrderSubscription')
  async handleToggleSubscription(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: ToggleOrderSubscriptionDto,
  ) {
    const username = client.user?.username ?? 'Unknown';
    const active = data?.active === true;

    if (!this.serverReady)
      throw new WsException('Server belum siap menerima koneksi');

    try {
      if (active) {
        this.activeDrivers.add(client.id);
        await client.join('drivers');
        this.logger.log(`Driver ${username} aktif`, this.context);
      } else {
        this.activeDrivers.delete(client.id);
        await client.leave('drivers');
        this.logger.log(`Driver ${username} nonaktif`, this.context);
      }

      await new Promise((r) => setTimeout(r, 200));

      return {
        message: active
          ? 'Penerimaan order diaktifkan'
          : 'Penerimaan order dimatikan',
        data: {
          username,
          active,
          totalActiveDrivers: this.activeDrivers.size,
        },
      };
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  async broadcastNewOrderAvailable(
    notification: OrderAvailableNotificationDto,
  ): Promise<void> {
    if (!this.serverReady) return;

    const sockets = await this.server.in('drivers').fetchSockets();
    if (sockets.length === 0) return;

    this.server.to('drivers').emit('newOrderNotification', {
      event: 'newOrderNotification',
      status: 'success',
      message: 'Pesanan baru tersedia',
      data: notification,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });

    this.logger.log(
      `Broadcast order ke ${sockets.length} driver`,
      this.context,
    );
  }
}
