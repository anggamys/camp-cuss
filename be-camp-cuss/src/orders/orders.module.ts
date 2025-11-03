import { Module } from '@nestjs/common';
import { OrdersCoreService } from './services/orders-core.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersNotificationsModule } from '../orders-notifications/orders-notifications.module';
import { OrdersBroadcastService } from './services/orders-broadcast.service';
import { OrdersDriverService } from './services/orders-driver.service';
import { OrdersCustomerService } from './services/orders-customer.service';

@Module({
  imports: [PrismaModule, OrdersNotificationsModule],
  controllers: [OrdersController],
  providers: [
    OrdersCoreService,
    OrdersDriverService,
    OrdersCustomerService,
    OrdersBroadcastService,
  ],
  exports: [
    OrdersCoreService,
    OrdersDriverService,
    OrdersCustomerService,
    OrdersBroadcastService,
  ],
})
export class OrdersModule {}
