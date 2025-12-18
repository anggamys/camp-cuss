import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CoreApi } from 'midtrans-client';

import { AppLoggerService } from '../common/loggers/app-logger.service';
import { Env } from '../common/constants/env.constant';
import {
  PaymentRequest,
  gopayTransactionRequest,
  TransactionResponseType,
  gopayTransactionResponseType,
} from '../common/types/transaction.interface';
import { PaymentType } from '../common/enums/transaction.enum';

@Injectable()
export class MidtransService {
  private readonly context = MidtransService.name;
  private readonly coreApi: CoreApi;

  constructor(private readonly logger: AppLoggerService) {
    try {
      this.coreApi = new CoreApi({
        isProduction: Env.MIDTRANS_ENV === 'production' ? true : false,
        serverKey: Env.MIDTRANS_SERVER_KEY,
        clientKey: Env.MIDTRANS_CLIENT_KEY,
      });

      this.logger.log(
        'Klien Midtrans Core API berhasil diinisialisasi',
        this.context,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);

      this.logger.error(
        `Gagal menginisialisasi klien Midtrans: ${message}`,
        this.context,
      );

      throw new InternalServerErrorException(message);
    }
  }

  async createTransaction(
    params: PaymentRequest | gopayTransactionRequest,
  ): Promise<TransactionResponseType | gopayTransactionResponseType> {
    try {
      this.logger.log(
        `Memulai pembuatan transaksi Midtrans - Order: ${params.transactionDetails.orderId}, Amount: ${params.transactionDetails.grossAmount}, Payment Type: ${params.paymentType}`,
        this.context,
      );

      const payload = {
        payment_type:
          params.paymentType === PaymentType.gopay
            ? 'gopay'
            : params.paymentType === PaymentType.bankTransfer
              ? 'bank_transfer'
              : '',

        transaction_details: {
          order_id: params.transactionDetails.orderId,
          gross_amount: params.transactionDetails.grossAmount,
        },

        customer_details: {
          first_name: params.customerDetails.firstName,
          email: params.customerDetails.email,
          phone: params.customerDetails.phone ?? '',
        },

        item_details: params.itemDetails ?? [],
        ...(params.paymentType === PaymentType.gopay
          ? {
              gopay: {
                enable_callback: (params as gopayTransactionRequest).gopay
                  .enableCallback,
                callback_url: (params as gopayTransactionRequest).gopay
                  .callbackUrl,
              },
            }
          : {}),
      };

      this.logger.log(
        `Mengirim charge request ke Midtrans Core API - Order: ${payload.transaction_details.order_id}, Customer: ${payload.customer_details.first_name}`,
        this.context,
      );

      const transaction = (await this.coreApi.charge(payload)) as
        | TransactionResponseType
        | gopayTransactionResponseType;

      this.logger.log(
        `Transaksi CoreAPI berhasil dibuat - Order: ${params.transactionDetails.orderId}, Transaction ID: ${transaction.transaction_id}, Status: ${transaction.transaction_status}`,
        this.context,
      );

      return transaction;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);

      this.logger.error(
        `Kesalahan saat membuat transaksi CoreAPI - Order: ${params.transactionDetails.orderId}, Error: ${message}`,
        this.context,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(message);
    }
  }
}
