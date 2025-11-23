import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DestinationsModule } from './destinations/destinations.module';
import { ConfigModule } from '@nestjs/config';
import { StoragesModule } from './storages/storages.module';
import { OrdersModule } from './orders/orders.module';
import { OrdersNotificationsModule } from './orders-notifications/orders-notifications.module';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { LoggerModule } from './common/loggers/logger.module';
import { RequestContextMiddleware } from './common/contexts/request-context.middleware';
import { AuthService } from './auth/auth.service';
import { AppLoggerService } from './common/loggers/app-logger.service';
import { CommonModule } from './common/common.module';
import { DriverLocationsModule } from './driver-locations/driver-locations.module';
import { RedisModule } from './common/redis';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    OrdersModule,
    CommonModule,
    LoggerModule,
    StoragesModule,
    DestinationsModule,
    OrdersNotificationsModule,
    DriverLocationsModule,
    RedisModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [
    HttpExceptionFilter,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useFactory: (
        reflector: Reflector,
        authService: AuthService,
        logger: AppLoggerService,
      ) => new JwtAuthGuard(reflector, authService, logger),
      inject: [Reflector, AuthService, AppLoggerService],
    },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new RolesGuard(reflector),
      inject: [Reflector],
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('/');
  }
}
