import { Server } from 'socket.io';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { WsAuthMiddleware } from '../common/middlewares/ws-auth.middleware';
import { DriverLocationsService } from './driver-locations.service';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { TopicDriverLocationSocketIo } from '../common/enums/topic-socket-io.enum';
import { SocketWithUser } from '../orders-notifications/types/socket-user.interface';
import { BaseGateway } from '../common/gateways/base.gateway';
import { DriverLocationData } from '../common/types/driver.interface';

@WebSocketGateway({ cors: true, namespace: '/driver-locations' })
export class DriverLocationsGateway extends BaseGateway {
  protected readonly context = 'DriverLocationsGateway';

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => DriverLocationsService))
    private readonly driverLocationsService: DriverLocationsService,
    logger: AppLoggerService,
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
    this.logger.log('DriverLocationsGateway initialized', this.context);
  }

  handleConnection(client: SocketWithUser) {
    this.logger.log(`Client ${client.id} terhubung`, this.context);
  }

  handleDisconnect(client: SocketWithUser) {
    this.logger.log(`Client ${client.id} terputus`, this.context);
  }

  @SubscribeMessage('updateDriverLocation')
  async handleUpdateDriverLocation(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: UpdateDriverLocationDto,
  ) {
    await this.safeHandle(client, 'updateDriverLocation', async () => {
      const driverId = client.user?.id;
      if (!driverId) throw new WsException('User ID tidak ditemukan');

      this.logger.debug(
        `Menerima lokasi terbaru dari driver ID: ${driverId}`,
        this.context,
      );

      await this.driverLocationsService.updateDriverLocation(driverId, data);
      return { driver_id: driverId, ...data };
    });
  }

  broadcastToOrderRoom(room: string, data: DriverLocationData) {
    this.server
      .to(room)
      .emit(TopicDriverLocationSocketIo.DRIVER_ACTIVE_LOCATION_UPDATE, data);
  }

  broadcastToAvailableDrivers(data: DriverLocationData) {
    this.server.emit(
      TopicDriverLocationSocketIo.DRIVER_AVAILABLE_LOCATION_UPDATE,
      data,
    );
  }
}
