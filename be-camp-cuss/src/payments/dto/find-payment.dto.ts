import {
  PaymentStatus,
  PaymentType,
} from '../../common/enums/transaction.enum';
import {
  IsInt,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindPaymentResponseDto {
  @IsInt()
  id: number;

  @IsInt()
  orderId: number;

  @IsString()
  midtransOrderId: string;

  @IsString()
  trasactionId: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsNumber()
  grossAmount: number;

  @IsOptional()
  @IsString()
  qrCodeUrl?: string;

  @IsOptional()
  @IsString()
  deepLink?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expireTime: Date | null;

  @IsString()
  fraudStatus: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  sattlementTime?: Date;

  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @Type(() => Date)
  @IsDate()
  updatedAt: Date;
}
