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
import { EventPattern, Payload } from '@nestjs/microservices';

interface DriverLocationEventData {
  driver_id: number;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

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
  handleUpdateDriverLocation(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: UpdateDriverLocationDto,
  ) {
    this.safeHandle(client, 'updateDriverLocation', () => {
      const driverId = client.user?.id;
      if (!driverId) throw new WsException('User ID tidak ditemukan');

      this.driverLocationsService.updateDriverLocation(driverId, data);
      return Promise.resolve({ driver_id: driverId, ...data });
    });
  }

  /** Broadcast lokasi driver ke semua client */
  @EventPattern('driver:location')
  handleRedisLocationEvent(@Payload() data: DriverLocationEventData) {
    this.logger.debug(
      `Broadcast lokasi driver ${data.driver_id} ke semua client`,
      this.context,
    );
    this.server.emit(TopicDriverLocationSocketIo.DRIVER_LOCATION_UPDATE, data);
  }
}
