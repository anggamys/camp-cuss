import { PaymentType } from '../enums/transaction.enum';

export type PaymentRequest = {
  paymentType: PaymentType;

  transactionDetails: {
    orderId: string | null;
    grossAmount: number;
  };

  customerDetails: {
    firstName: string;
    email: string;
    phone?: string | null;
  };

  itemDetails?: Array<object>;
};

export type gopayTransactionRequest = PaymentRequest & {
  paymentType: PaymentType.gopay;

  gopay: {
    enableCallback: boolean;
    callbackUrl: string;
  };
};

export type TransactionResponseType = {
  status_code?: string | number;
  status_message?: string;
  transaction_id?: string;
  order_id?: string;
  merchant_id?: string;
  gross_amount?: string;
  currency?: string;
  payment_type?: string;
  transaction_time?: string;
  transaction_status?: string;
  fraud_status?: string;
  expiry_time?: string;
};

export type gopayTransactionResponseType = TransactionResponseType & {
  actions?: Array<{
    name: string;
    method: string;
    url: string;
  }>;
};
