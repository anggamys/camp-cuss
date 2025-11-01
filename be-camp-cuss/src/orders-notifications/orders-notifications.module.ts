import { Module } from '@nestjs/common';
import { OrdersNotificationsService } from './orders-notifications.service';
import { OrdersNotificationsGateway } from './orders-notifications.gateway';
import { AuthModule } from '../auth/auth.module';
import { OrdersConnectionHandler } from './orders-connection.handler';

@Module({
  imports: [AuthModule],
  exports: [OrdersNotificationsGateway, OrdersNotificationsService],
  providers: [
    OrdersNotificationsGateway,
    OrdersNotificationsService,
    OrdersConnectionHandler,
  ],
})
export class OrdersNotificationsModule {}
