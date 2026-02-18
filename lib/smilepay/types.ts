// SmilePay SDK Types
// These types represent the SmilePay/ZBNet payment gateway wire format.
// They have zero dependency on any app framework, database, or environment.

export type CurrencyCode = 'USD' | 'ZWG';
export type PaymentMethodCode = 'ECO_CASH' | 'VISA_MASTERCARD' | 'INNBUCKS' | 'OMARI' | 'SMILE_CASH';
export type SmilePayPaymentMethod = 'WALLETPLUS' | 'ECOCASH' | 'INNBUCKS' | 'CARD' | 'OMARI' | 'ONEMONEY';
export type TransactionStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface SmilePayConfig {
  apiKey: string;
  apiSecret: string;
  environment?: 'sandbox' | 'production';
  webhookSecret?: string;
}

// Standard Checkout
export interface SmilePayInitiateRequest {
  orderReference: string;
  amount: number;
  returnUrl: string;
  resultUrl: string;
  itemName: string;
  itemDescription: string;
  currencyCode: string;
  firstName?: string;
  lastName?: string;
  mobilePhoneNumber?: string;
  email?: string;
  paymentMethod?: SmilePayPaymentMethod;
  cancelUrl?: string;
  failureUrl?: string;
}

export interface SmilePayResponse {
  responseCode: string;
  responseMessage: string;
  paymentUrl?: string;
  transactionReference?: string;
}

// Express Checkout - EcoCash
export interface SmilePayExpressEcoCashRequest {
  orderReference: string;
  amount: number;
  currencyCode: string;
  returnUrl?: string;
  resultUrl: string;
  cancelUrl?: string;
  failureUrl?: string;
  itemName: string;
  itemDescription: string;
  firstName?: string;
  lastName?: string;
  mobilePhoneNumber?: string;
  email?: string;
  ecocashMobile: string;
}

export interface SmilePayEcoCashResponse {
  responseCode: string;
  responseMessage: string;
  status?: string;
  transactionReference?: string;
}

// Express Checkout - Card (MPGS)
export interface SmilePayExpressCardRequest {
  orderReference: string;
  amount: number;
  currencyCode: string;
  returnUrl: string;
  resultUrl: string;
  cancelUrl?: string;
  failureUrl?: string;
  itemName?: string;
  itemDescription?: string;
  pan: string;
  expMonth: string;
  expYear: string;
  securityCode: string;
  firstName: string;
  lastName: string;
  mobilePhoneNumber: string;
  email: string;
  paymentMethod?: SmilePayPaymentMethod;
}

export interface SmilePayMpgsResponse {
  responseCode: string;
  responseMessage: string;
  status?: string;
  transactionReference?: string;
  gatewayRecommendation?: string;
  authenticationStatus?: string;
  redirectHtml?: string;
  customizedHtml?: {
    '3ds2': {
      acsUrl: string;
      cReq: string;
    };
  };
}

// Express Checkout - ZB Wallet (SmileCash)
export interface SmilePayExpressZbRequest {
  orderReference: string;
  amount: number;
  currencyCode: string;
  returnUrl: string;
  resultUrl: string;
  cancelUrl?: string;
  failureUrl?: string;
  itemName: string;
  itemDescription: string;
  firstName?: string;
  lastName?: string;
  mobilePhoneNumber?: string;
  email?: string;
  zbWalletMobile: string;
}

export interface SmilePayZbConfirmRequest {
  otp: string;
  transactionReference: string;
}

export interface SmilePayZbResponse {
  responseCode: string;
  responseMessage: string;
  status?: string;
  transactionReference?: string;
}

// Cancel
export interface SmilePayCancelResponse {
  success: boolean;
  description?: string;
  returnUrl?: string;
}

// Status Check / Webhook callback
export interface SmilePayStatusResponse {
  merchantId?: string;
  reference?: string;
  orderReference?: string;
  itemName?: string;
  amount?: number;
  currency?: string;
  paymentOption?: string;
  status?: string;
  createdDate?: string;
  returnUrl?: string;
  resultUrl?: string;
  clientFee?: number;
  merchantFee?: number;
}
