import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { MidtransService } from './midtrans.service';
import { PaymentsCoreService } from './services/payments-core.service';
import { PaymentsMidtransService } from './services/payments-midtrans.service';
import { PaymentsCallbackService } from './services/payments-callback.service';
import { PaymentsQueryService } from './services/payments-query.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsCoreService,
    MidtransService,
    PaymentsMidtransService,
    PaymentsCallbackService,
    PaymentsQueryService,
  ],
  exports: [PaymentsCoreService, PaymentsMidtransService],
})
export class PaymentsModule {}
