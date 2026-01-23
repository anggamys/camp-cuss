export enum OrderStatus {
  pending = 'pending',
  canceled = 'canceled',
  accepted = 'accepted',
  completed = 'completed',
}

export enum OrderService {
  ride = 'RIDE',
  delivery = 'DELIVERY',
  food = 'FOOD',
}

export const isPanding = (status: OrderStatus) =>
  status === OrderStatus.pending;
export const isCanceled = (status: OrderStatus) =>
  status === OrderStatus.canceled;
export const isAccepted = (status: OrderStatus) =>
  status === OrderStatus.accepted;
export const isCompleted = (status: OrderStatus) =>
  status === OrderStatus.completed;

export const isRideService = (service: OrderService) =>
  service === OrderService.ride;
export const isDeliveryService = (service: OrderService) =>
  service === OrderService.delivery;
export const isFoodService = (service: OrderService) =>
  service === OrderService.food;

export const OrderServices = [
  OrderService.ride,
  OrderService.delivery,
  OrderService.food,
];

export const OrderStatuses = [
  OrderStatus.pending,
  OrderStatus.canceled,
  OrderStatus.accepted,
  OrderStatus.completed,
];
