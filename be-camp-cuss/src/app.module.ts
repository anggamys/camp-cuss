import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DestinationsModule } from './destinations/destinations.module';
import { ConfigModule } from '@nestjs/config';
import { StoragesModule } from './storages/storages.module';
import { OrdersModule } from './orders/orders.module';
import { OrdersNotificationsModule } from './orders-notifications/orders-notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    DestinationsModule,
    StoragesModule,
    OrdersModule,
    OrdersNotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
