import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CustomerDetailsDto {
  @IsString()
  phone: string;

  @IsString()
  full_name: string;

  @IsString()
  email: string;
}

export class MidtransCallbackDto {
  @IsString()
  transaction_time: string;

  @IsString()
  transaction_status: string;

  @IsString()
  transaction_id: string;

  @IsString()
  status_message: string;

  @IsString()
  status_code: string;

  @IsString()
  signature_key: string;

  @IsOptional()
  @IsString()
  settlement_time?: string;

  @IsOptional()
  @IsString()
  pop_id?: string;

  @IsString()
  payment_type: string;

  @IsString()
  order_id: string;

  @IsString()
  merchant_id: string;

  @IsString()
  gross_amount: string;

  @IsOptional()
  @IsString()
  fraud_status?: string;

  @IsOptional()
  @IsString()
  expiry_time?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  customer_details?: CustomerDetailsDto;

  @IsOptional()
  @IsString()
  currency?: string;
}
