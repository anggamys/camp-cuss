import { randomBytes } from 'crypto';
import { OrderService } from '../enums/order.enum';

export function generateOrderCode(
  orderService: OrderService,
  orderId: number,
): string {
  const date = new Date();

  const datePart = date.toISOString().slice(2, 10).replace(/-/g, ''); // yyMMdd

  const randomPart = randomBytes(2).toString('hex').toUpperCase();

  const serviceCode = orderService.toUpperCase();

  return `CAMP-${serviceCode}-${orderId}-${datePart}-${randomPart}`;
}
