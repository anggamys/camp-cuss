import { Module } from '@nestjs/common';
import { OrdersCoreService } from './services/orders-core.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersBroadcastService } from './services/orders-broadcast.service';
import { OrdersDriverService } from './services/orders-driver.service';
import { OrdersCustomerService } from './services/orders-customer.service';
import { ChatsModule } from '../chats/chats.module';
import { OrdersNotificationsGateway } from './orders-notifications.gateway';

@Module({
  imports: [PrismaModule, ChatsModule],
  controllers: [OrdersController],
  providers: [
    OrdersCoreService,
    OrdersDriverService,
    OrdersCustomerService,
    OrdersBroadcastService,
    OrdersNotificationsGateway,
  ],
  exports: [
    OrdersCoreService,
    OrdersDriverService,
    OrdersCustomerService,
    OrdersBroadcastService,
    OrdersNotificationsGateway,
  ],
})
export class OrdersModule {}
