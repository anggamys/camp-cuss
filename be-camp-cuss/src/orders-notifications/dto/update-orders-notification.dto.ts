import { PartialType } from '@nestjs/mapped-types';
import { CreateOrdersNotificationDto } from './create-orders-notification.dto';

export class UpdateOrdersNotificationDto extends PartialType(CreateOrdersNotificationDto) {
  id: number;
}
