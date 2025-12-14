import {
  IsNumber,
  IsNotEmpty,
  IsPositive,
  IsInt,
  IsString,
  IsEnum,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { PaymentType } from '../../common/enums/transaction.enum';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @IsPositive()
  orderId: number;
}

export class CreatePaymentResponseDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsString()
  transactionId: string;

  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsNotEmpty()
  @IsString()
  grossAmount: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  qrCodeUrl: string;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  deepLink: string;

  @IsNotEmpty()
  @IsString()
  @IsDateString()
  expiryTime: string;
}
