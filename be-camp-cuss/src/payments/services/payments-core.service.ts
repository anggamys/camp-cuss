import { Injectable } from '@nestjs/common';
import { PaymentsMidtransService } from './payments-midtrans.service';
import { PaymentsCallbackService } from './payments-callback.service';
import { PaymentsQueryService } from './payments-query.service';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { CreatePaymentResponseDto } from '../dto/create-payment.dto';
import { MidtransCallbackDto } from '../dto/midtrans-callback.dto';
import { FindPaymentResponseDto } from '../dto/find-payment.dto';

@Injectable()
export class PaymentsCoreService {
  private readonly context = PaymentsCoreService.name;

  constructor(
    private readonly midtrans: PaymentsMidtransService,
    private readonly callback: PaymentsCallbackService,
    private readonly query: PaymentsQueryService,
    private readonly logger: AppLoggerService,
  ) {}

  async create(orderId: number): Promise<CreatePaymentResponseDto> {
    this.logger.log(
      `[Core] Request pembuatan payment untuk Order ID: ${orderId}`,
      this.context,
    );
    return this.midtrans.createTransaction(orderId);
  }

  async handleCallback(data: MidtransCallbackDto) {
    this.logger.log(
      `[Core] Request callback untuk Order: ${data.order_id}`,
      this.context,
    );
    return this.callback.process(data);
  }

  async getAll(): Promise<FindPaymentResponseDto[]> {
    this.logger.log('[Core] Request mengambil semua payment', this.context);
    return this.query.getAll();
  }

  async getByMidtransId(
    midtransOrderId: string,
  ): Promise<FindPaymentResponseDto> {
    this.logger.log(
      `[Core] Request pencarian payment: ${midtransOrderId}`,
      this.context,
    );
    return this.query.getByMidtransId(midtransOrderId);
  }
}
