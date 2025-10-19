import { Test, TestingModule } from '@nestjs/testing';
import { OrdersNotificationsService } from './orders-notifications.service';

describe('OrdersNotificationsService', () => {
  let service: OrdersNotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersNotificationsService],
    }).compile();

    service = module.get<OrdersNotificationsService>(OrdersNotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
