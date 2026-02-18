import {
  SmilePayConfig,
  SmilePayInitiateRequest,
  SmilePayExpressEcoCashRequest,
  SmilePayExpressCardRequest,
  SmilePayResponse,
  SmilePayMpgsResponse,
  SmilePayEcoCashResponse,
  SmilePayCancelResponse,
  SmilePayStatusResponse,
  CurrencyCode,
  PaymentMethodCode,
  SmilePayPaymentMethod,
  TransactionStatus,
} from './types';

const BASE_URLS = {
  sandbox: 'https://zbnet.zb.co.zw/wallet_sandbox_api',
  production: 'https://zbnet.zb.co.zw/wallet_api',
} as const;

const CURRENCY_CODES: Record<CurrencyCode, string> = {
  USD: '840',
  ZWG: '924',
};

const PAYMENT_METHOD_MAP: Record<PaymentMethodCode, SmilePayPaymentMethod> = {
  VISA_MASTERCARD: 'CARD',
  ECO_CASH: 'ECOCASH',
  INNBUCKS: 'INNBUCKS',
  OMARI: 'OMARI',
  SMILE_CASH: 'WALLETPLUS',
};

export class SmilePayClient {
  private baseURL: string;
  private apiKey: string;
  private apiSecret: string;
  private webhookSecret: string;

  constructor(config: SmilePayConfig) {
    const env = config.environment || 'sandbox';
    this.baseURL = BASE_URLS[env];
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.webhookSecret = config.webhookSecret || '';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: Record<string, unknown>
  ): Promise<T> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('SmilePay API credentials not configured');
    }

    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'x-api-secret': this.apiSecret,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    return data as T;
  }

  // --- Payment methods ---

  async initiateStandardCheckout(data: SmilePayInitiateRequest): Promise<SmilePayResponse> {
    return this.makeRequest<SmilePayResponse>(
      '/payments-gateway/payments/initiate-transaction',
      'POST',
      {
        orderReference: data.orderReference,
        amount: data.amount,
        returnUrl: data.returnUrl,
        resultUrl: data.resultUrl,
        itemName: data.itemName,
        itemDescription: data.itemDescription,
        currencyCode: data.currencyCode,
        firstName: data.firstName,
        lastName: data.lastName,
        mobilePhoneNumber: data.mobilePhoneNumber,
        email: data.email,
        paymentMethod: data.paymentMethod,
        cancelUrl: data.cancelUrl,
        failureUrl: data.failureUrl,
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

  async cancelPayment(orderReference: string): Promise<SmilePayCancelResponse> {
    return this.makeRequest<SmilePayCancelResponse>(
      `/payments-gateway/payments/cancel/${orderReference}`,
      'POST'
    );
  }

  // --- Helpers ---

  static formatCurrencyCode(currency: CurrencyCode): string {
    return CURRENCY_CODES[currency] || '840';
  }

  static generateOrderReference(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `ORD-${timestamp}-${randomPart}`.toUpperCase();
  }

  static mapStatusFromSmilePay(status: string): TransactionStatus {
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

  static mapPaymentMethodToZbPay(code: PaymentMethodCode): SmilePayPaymentMethod {
    return PAYMENT_METHOD_MAP[code];
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) return true;
    // In production, implement proper HMAC validation with crypto.createHmac
    return signature === this.webhookSecret;
  }
}
