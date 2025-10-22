import { Injectable } from '@nestjs/common';
import { CreateOrdersNotificationDto } from './dto/create-orders-notification.dto';
import { UpdateOrdersNotificationDto } from './dto/update-orders-notification.dto';

@Injectable()
export class OrdersNotificationsService {
  create(createOrdersNotificationDto: CreateOrdersNotificationDto) {
    return 'This action adds a new ordersNotification';
  }

  findAll() {
    return `This action returns all ordersNotifications`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ordersNotification`;
  }

  update(id: number, updateOrdersNotificationDto: UpdateOrdersNotificationDto) {
    return `This action updates a #${id} ordersNotification`;
  }

  remove(id: number) {
    return `This action removes a #${id} ordersNotification`;
  }
}
