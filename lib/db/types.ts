// Database types for the payment system

// Re-export shared types from the SmilePay SDK so existing imports continue to work
export type {
  CurrencyCode,
  PaymentMethodCode,
  TransactionStatus,
  SmilePayInitiateRequest,
  SmilePayResponse,
  SmilePayExpressEcoCashRequest,
  SmilePayEcoCashResponse,
  SmilePayExpressCardRequest,
  SmilePayMpgsResponse,
  SmilePayExpressZbRequest,
  SmilePayZbConfirmRequest,
  SmilePayZbResponse,
  SmilePayCancelResponse,
  SmilePayStatusResponse,
} from '@/lib/smilepay';

import type { CurrencyCode, PaymentMethodCode, TransactionStatus } from '@/lib/smilepay';

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
  item_name?: string;
  item_description?: string;
}

export interface ExpressEcoCashRequest {
  amount: number;
  currency_code: CurrencyCode;
  order_reference?: string;
  customer: CustomerDetails;
  phone_number: string;
  return_url: string;
  result_url: string;
  cancel_url?: string;
  failure_url?: string;
  item_name?: string;
  item_description?: string;
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
  cancel_url?: string;
  failure_url?: string;
  item_name?: string;
  item_description?: string;
  payment_method?: string;
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

// App-level SmileCash (ZB Wallet) request types
export interface ExpressZbPaymentRequest {
  amount: number;
  currency_code: CurrencyCode;
  order_reference?: string;
  customer: CustomerDetails;
  zb_wallet_mobile: string;
  return_url: string;
  result_url: string;
  cancel_url?: string;
  failure_url?: string;
  item_name?: string;
  item_description?: string;
}

export interface ExpressZbPaymentConfirmRequest {
  otp: string;
  transaction_reference: string;
}
