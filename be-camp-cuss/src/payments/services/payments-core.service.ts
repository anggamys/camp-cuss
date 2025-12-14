import { Injectable } from '@nestjs/common';
import { PaymentsMidtransService } from './payments-midtrans.service';
import { PaymentsCallbackService } from './payments-callback.service';
import { PaymentsQueryService } from './payments-query.service';
import { CreatePaymentResponseDto } from '../dto/create-payment.dto';
import { MidtransCallbackDto } from '../dto/midtrans-callback.dto';

@Injectable()
export class PaymentsCoreService {
  constructor(
    private readonly midtrans: PaymentsMidtransService,
    private readonly callback: PaymentsCallbackService,
    private readonly query: PaymentsQueryService,
  ) {}

  async create(orderId: number): Promise<CreatePaymentResponseDto> {
    return this.midtrans.createTransaction(orderId);
  }

  async handleCallback(data: MidtransCallbackDto) {
    return this.callback.process(data);
  }

  async getAll() {
    return this.query.getAll();
  }
}
