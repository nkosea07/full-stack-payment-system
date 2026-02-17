// Database types for the payment system

export type TransactionStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
export type PaymentMethodCode = 'ECO_CASH' | 'VISA_MASTERCARD' | 'INNBUCKS' | 'OMARI' | 'SMILE_CASH';
export type CurrencyCode = 'USD' | 'ZWG';

export interface Merchant {
  id: string;
  name: string;
  api_key: string;
  webhook_url: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface CustomerDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface Transaction {
  id: string;
  merchant_id: string;
  order_reference: string;
  transaction_reference: string | null;
  amount: number;
  currency_code: CurrencyCode;
  payment_method: PaymentMethodCode | null;
  status: TransactionStatus;
  customer_details: CustomerDetails;
  payment_url: string | null;
  return_url: string;
  result_url: string;
  cancel_url: string | null;
  failure_url: string | null;
  created_at: Date;
  updated_at: Date;
  paid_at: Date | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: PaymentMethodCode;
  is_active: boolean;
  config: Record<string, unknown>;
}

export interface WebhookLog {
  id: string;
  transaction_id: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown> | null;
  status_code: number | null;
  created_at: Date;
}

// API Request/Response types
export interface InitiatePaymentRequest {
  amount: number;
  currency_code: CurrencyCode;
  order_reference?: string;
  customer: CustomerDetails;
  return_url: string;
  result_url: string;
  cancel_url?: string;
  failure_url?: string;
  checkout_type: 'standard' | 'express';
  payment_method?: PaymentMethodCode;
}

export interface ExpressEcoCashRequest {
  amount: number;
  currency_code: CurrencyCode;
  order_reference?: string;
  customer: CustomerDetails;
  phone_number: string;
  return_url: string;
  result_url: string;
}

export interface ExpressCardRequest {
  amount: number;
  currency_code: CurrencyCode;
  order_reference?: string;
  customer: CustomerDetails;
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  return_url: string;
  result_url: string;
}

export interface PaymentResponse {
  success: boolean;
  transaction_id: string;
  order_reference: string;
  transaction_reference?: string;
  payment_url?: string;
  status: TransactionStatus;
  message: string;
  redirect_html?: string;
}

export interface TransactionStatusResponse {
  order_reference: string;
  transaction_reference: string | null;
  status: TransactionStatus;
  amount: number;
  currency_code: CurrencyCode;
  payment_method: PaymentMethodCode | null;
  paid_at: Date | null;
}

// SmilePay API types
export interface SmilePayInitiateRequest {
  currencyCode: string;
  amount: number;
  orderReference: string;
  resultUrl: string;
  returnUrl: string;
  cancelUrl?: string;
  failureUrl?: string;
  customer: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
  };
}

export interface SmilePayExpressEcoCashRequest {
  currencyCode: string;
  amount: number;
  orderReference: string;
  resultUrl: string;
  returnUrl: string;
  phoneNumber: string;
  customer: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
  };
}

export interface SmilePayExpressCardRequest {
  currencyCode: string;
  amount: number;
  orderReference: string;
  resultUrl: string;
  returnUrl: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  customer: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
  };
}

export interface SmilePayResponse {
  statusCode: string;
  statusMessage: string;
  transactionReference?: string;
  paymentUrl?: string;
  redirectHtml?: string;
}

export interface SmilePayStatusResponse {
  statusCode: string;
  statusMessage: string;
  transactionStatus: string;
  transactionReference?: string;
}
