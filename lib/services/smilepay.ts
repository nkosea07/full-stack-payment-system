import {
  SmilePayInitiateRequest,
  SmilePayExpressEcoCashRequest,
  SmilePayExpressCardRequest,
  SmilePayResponse,
  SmilePayMpgsResponse,
  SmilePayEcoCashResponse,
  SmilePayStatusResponse,
  CurrencyCode,
  PaymentMethodCode,
} from '@/lib/db/types';

// Currency code mapping
const CURRENCY_CODES: Record<CurrencyCode, string> = {
  USD: '840',
  ZWG: '924',
};

export class SmilePayService {
  private baseURL: string;
  private apiKey: string;
  private merchantId: string;

  constructor() {
    const env = process.env.SMILEPAY_ENVIRONMENT || 'sandbox';
    this.baseURL =
      env === 'production'
        ? 'https://zbnet.zb.co.zw/wallet_api'
        : 'https://zbnet.zb.co.zw/wallet_sandbox_api';
    this.apiKey = process.env.SMILEPAY_API_KEY || '';
    this.merchantId = process.env.SMILEPAY_MERCHANT_ID || '';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-Merchant-ID': this.merchantId,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('SmilePay API Error:', error);
      throw new Error('Failed to communicate with SmilePay API');
    }
  }

  async initiateStandardCheckout(data: SmilePayInitiateRequest): Promise<SmilePayResponse> {
    return this.makeRequest<SmilePayResponse>(
      '/payments-gateway/payments/initiate-transaction',
      'POST',
      {
        currencyCode: data.currencyCode,
        amount: data.amount,
        orderReference: data.orderReference,
        resultUrl: data.resultUrl,
        returnUrl: data.returnUrl,
        cancelUrl: data.cancelUrl,
        failureUrl: data.failureUrl,
        customer: data.customer,
      }
    );
  }

  async expressCheckoutEcoCash(data: SmilePayExpressEcoCashRequest): Promise<SmilePayEcoCashResponse> {
    return this.makeRequest<SmilePayEcoCashResponse>(
      '/payments-gateway/payments/express-checkout/ecocash',
      'POST',
      {
        orderReference: data.orderReference,
        amount: data.amount,
        currencyCode: data.currencyCode,
        returnUrl: data.returnUrl,
        resultUrl: data.resultUrl,
        cancelUrl: data.cancelUrl,
        failureUrl: data.failureUrl,
        itemName: data.itemName,
        itemDescription: data.itemDescription,
        firstName: data.firstName,
        lastName: data.lastName,
        mobilePhoneNumber: data.mobilePhoneNumber,
        email: data.email,
        ecocashMobile: data.ecocashMobile,
      }
    );
  }

  async expressCheckoutCard(data: SmilePayExpressCardRequest): Promise<SmilePayMpgsResponse> {
    return this.makeRequest<SmilePayMpgsResponse>(
      '/payments-gateway/payments/express-checkout/mpgs',
      'POST',
      {
        orderReference: data.orderReference,
        amount: data.amount,
        currencyCode: data.currencyCode,
        returnUrl: data.returnUrl,
        resultUrl: data.resultUrl,
        cancelUrl: data.cancelUrl,
        failureUrl: data.failureUrl,
        itemName: data.itemName,
        itemDescription: data.itemDescription,
        pan: data.pan,
        expMonth: data.expMonth,
        expYear: data.expYear,
        securityCode: data.securityCode,
        firstName: data.firstName,
        lastName: data.lastName,
        mobilePhoneNumber: data.mobilePhoneNumber,
        email: data.email,
        paymentMethod: data.paymentMethod,
      }
    );
  }

  async checkPaymentStatus(orderReference: string): Promise<SmilePayStatusResponse> {
    return this.makeRequest<SmilePayStatusResponse>(
      `/payments-gateway/payments/transaction/${orderReference}/status/check`,
      'GET'
    );
  }

  async cancelPayment(orderReference: string): Promise<SmilePayResponse> {
    return this.makeRequest<SmilePayResponse>(
      `/payments-gateway/payments/cancel/${orderReference}`,
      'POST'
    );
  }

  // Helper methods
  static formatCurrencyCode(currency: CurrencyCode): string {
    return CURRENCY_CODES[currency] || '840';
  }

  static generateOrderReference(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `ORD-${timestamp}-${randomPart}`.toUpperCase();
  }

  static mapStatusFromSmilePay(status: string): 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
      case 'PAID':
      case 'COMPLETED':
        return 'PAID';
      case 'FAILED':
      case 'ERROR':
        return 'FAILED';
      case 'CANCELLED':
      case 'CANCELED':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }

  static mapPaymentMethodToZbPay(
    code: PaymentMethodCode
  ): 'WALLETPLUS' | 'ECOCASH' | 'INNBUCKS' | 'CARD' | 'OMARI' | 'ONEMONEY' {
    const mapping: Record<PaymentMethodCode, 'WALLETPLUS' | 'ECOCASH' | 'INNBUCKS' | 'CARD' | 'OMARI' | 'ONEMONEY'> = {
      VISA_MASTERCARD: 'CARD',
      ECO_CASH: 'ECOCASH',
      INNBUCKS: 'INNBUCKS',
      OMARI: 'OMARI',
      SMILE_CASH: 'WALLETPLUS',
    };
    return mapping[code];
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    // In production, implement proper HMAC validation
    const webhookSecret = process.env.WEBHOOK_SECRET || '';
    if (!webhookSecret) return true; // Skip validation in sandbox
    
    // Simple validation for now - in production use crypto.createHmac
    return signature === webhookSecret;
  }
}

export const smilePayService = new SmilePayService();
