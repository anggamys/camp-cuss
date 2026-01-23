import { OrderStatus } from '../../common/enums/order.enum';
import { PaymentStatus } from '../../common/enums/transaction.enum';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsDate,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { Order, User } from '@prisma/client';

export class OrderResponseDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @IsNumber()
  driverId?: number;

  @IsOptional()
  @IsNumber()
  destinationId?: number;

  @IsOptional()
  @IsString()
  pickUpLocation?: string;

  @IsOptional()
  @IsNumber()
  pickUpLatitude?: number;

  @IsOptional()
  @IsNumber()
  pickUpLongitude?: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @IsOptional()
  @IsDate()
  updatedAt?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserResponseDto)
  customer?: UserResponseDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserResponseDto)
  driver?: UserResponseDto;
}

export function toResponseDto(
  order: Order & { customer?: User; driver?: User },
): OrderResponseDto {
  return {
    id: order.id,
    customerId: order.customer_id,
    driverId: order.driver_id ?? undefined,
    destinationId: order.destination_id,
    pickUpLocation: order.pick_up_location,
    pickUpLatitude: order.pick_up_latitude,
    pickUpLongitude: order.pick_up_longitude,
    status: order.status as OrderStatus,
    paymentStatus: order.payment_status as PaymentStatus,
    paymentMethod: order.payment_method ?? undefined,
    totalPrice: order.total_price,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    customer: order.customer
      ? {
          id: order.customer.id,
          username: order.customer.username,
          npm: order.customer.npm,
          email: order.customer.email,
          noPhone: order.customer.no_phone,
          photoProfile: order.customer.photo_profile ?? undefined,
        }
      : undefined,
    driver: order.driver
      ? {
          id: order.driver.id,
          username: order.driver.username,
          npm: order.driver.npm,
          email: order.driver.email,
          noPhone: order.driver.no_phone,
          photoProfile: order.driver.photo_profile ?? undefined,
        }
      : undefined,
  };
}
