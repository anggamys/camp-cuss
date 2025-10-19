import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { OrdersNotificationsService } from './orders-notifications.service';
import { CreateOrdersNotificationDto } from './dto/create-orders-notification.dto';
import { UpdateOrdersNotificationDto } from './dto/update-orders-notification.dto';

@WebSocketGateway()
export class OrdersNotificationsGateway {
  constructor(private readonly ordersNotificationsService: OrdersNotificationsService) {}

  @SubscribeMessage('createOrdersNotification')
  create(@MessageBody() createOrdersNotificationDto: CreateOrdersNotificationDto) {
    return this.ordersNotificationsService.create(createOrdersNotificationDto);
  }

  @SubscribeMessage('findAllOrdersNotifications')
  findAll() {
    return this.ordersNotificationsService.findAll();
  }

  @SubscribeMessage('findOneOrdersNotification')
  findOne(@MessageBody() id: number) {
    return this.ordersNotificationsService.findOne(id);
  }

  @SubscribeMessage('updateOrdersNotification')
  update(@MessageBody() updateOrdersNotificationDto: UpdateOrdersNotificationDto) {
    return this.ordersNotificationsService.update(updateOrdersNotificationDto.id, updateOrdersNotificationDto);
  }

  @SubscribeMessage('removeOrdersNotification')
  remove(@MessageBody() id: number) {
    return this.ordersNotificationsService.remove(id);
  }
}
