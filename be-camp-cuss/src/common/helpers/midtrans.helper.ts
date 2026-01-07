import { PaymentStatus } from '../enums/transaction.enum';

export class MidtransHelpers {
  static qrisFee(grossAmount: number): number {
    const feePercentage = 0.007;
    return Math.ceil(grossAmount * feePercentage);
  }

  static mapTransactionStatus(midtransStatus?: string): PaymentStatus {
    switch (midtransStatus) {
      case 'capture':
      case 'settlement':
        return PaymentStatus.paid;
      case 'deny':
      case 'cancel':
      case 'expire':
        return PaymentStatus.failed;
      case 'refund':
        return PaymentStatus.refunded;
      case 'pending':
      default:
        return PaymentStatus.pending;
    }
  }
}
