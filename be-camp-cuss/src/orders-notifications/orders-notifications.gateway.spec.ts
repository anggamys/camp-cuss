import { Test, TestingModule } from '@nestjs/testing';
import { OrdersNotificationsGateway } from './orders-notifications.gateway';
import { OrdersNotificationsService } from './orders-notifications.service';

describe('OrdersNotificationsGateway', () => {
  let gateway: OrdersNotificationsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersNotificationsGateway, OrdersNotificationsService],
    }).compile();

    gateway = module.get<OrdersNotificationsGateway>(OrdersNotificationsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
