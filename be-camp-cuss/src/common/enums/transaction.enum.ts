export enum PaymentType {
  creditCard = 'credit_card',
  bankTransfer = 'bank_transfer',
  eChannel = 'echannel',
  bcaKlikpay = 'bca_klikpay',
  bcaKlikbca = 'bca_klikbca',
  briEpay = 'bri_epay',
  gopay = 'gopay',
  mandiriClickpay = 'mandiri_clickpay',
  cimbClicks = 'cimb_clicks',
  danamonOnline = 'danamon_online',
  mandiriEcash = 'mandiri_ecash',
  cstore = 'cstore',
  akulaku = 'akulaku',
}

export enum PaymentStatus {
  pending = 'pending',
  paid = 'paid',
  failed = 'failed',
  refunded = 'refunded',
}
