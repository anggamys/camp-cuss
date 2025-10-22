import { Module } from '@nestjs/common';
import { OrdersNotificationsService } from './orders-notifications.service';
import { OrdersNotificationsGateway } from './orders-notifications.gateway';

@Module({
  providers: [OrdersNotificationsGateway, OrdersNotificationsService],
})
export class OrdersNotificationsModule {}
