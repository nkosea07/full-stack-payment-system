// Mock in-memory database for demonstration
// In production, replace with actual PostgreSQL queries using pg or an ORM

import {
  Merchant,
  Transaction,
  PaymentMethod,
  WebhookLog,
  TransactionStatus,
  PaymentMethodCode,
  CurrencyCode,
  CustomerDetails,
} from './types';

// In-memory stores
const merchants: Map<string, Merchant> = new Map();
const transactions: Map<string, Transaction> = new Map();
const paymentMethods: Map<string, PaymentMethod> = new Map();
const webhookLogs: Map<string, WebhookLog> = new Map();

// Initialize default merchant and payment methods
function initializeDefaults() {
  // Default merchant
  const defaultMerchant: Merchant = {
    id: 'merchant_001',
    name: 'Demo Merchant',
    api_key: 'demo_api_key_12345',
    webhook_url: null,
    is_active: true,
    created_at: new Date(),
  };
  merchants.set(defaultMerchant.id, defaultMerchant);

  // Default payment methods
  const ecoCash: PaymentMethod = {
    id: 'pm_001',
    name: 'EcoCash',
    code: 'ECO_CASH',
    is_active: true,
    config: { minAmount: 1, maxAmount: 10000 },
  };
  paymentMethods.set(ecoCash.id, ecoCash);

  const visaMastercard: PaymentMethod = {
    id: 'pm_002',
    name: 'Visa/Mastercard',
    code: 'VISA_MASTERCARD',
    is_active: true,
    config: { minAmount: 1, maxAmount: 50000 },
  };
  paymentMethods.set(visaMastercard.id, visaMastercard);

  const innbucks: PaymentMethod = {
    id: 'pm_003',
    name: 'Innbucks',
    code: 'INNBUCKS',
    is_active: false,
    config: {},
  };
  paymentMethods.set(innbucks.id, innbucks);
}

// Initialize on module load
initializeDefaults();

// Database operations
export const db = {
  // Merchant operations
  merchants: {
    findById: async (id: string): Promise<Merchant | null> => {
      return merchants.get(id) || null;
    },
    findByApiKey: async (apiKey: string): Promise<Merchant | null> => {
      for (const merchant of merchants.values()) {
        if (merchant.api_key === apiKey) return merchant;
      }
      return null;
    },
    findAll: async (): Promise<Merchant[]> => {
      return Array.from(merchants.values());
    },
    create: async (data: Omit<Merchant, 'id' | 'created_at'>): Promise<Merchant> => {
      const merchant: Merchant = {
        ...data,
        id: `merchant_${Date.now()}`,
        created_at: new Date(),
      };
      merchants.set(merchant.id, merchant);
      return merchant;
    },
    update: async (id: string, data: Partial<Merchant>): Promise<Merchant | null> => {
      const merchant = merchants.get(id);
      if (!merchant) return null;
      const updated = { ...merchant, ...data };
      merchants.set(id, updated);
      return updated;
    },
  },

  // Transaction operations
  transactions: {
    findById: async (id: string): Promise<Transaction | null> => {
      return transactions.get(id) || null;
    },
    findByOrderReference: async (orderReference: string): Promise<Transaction | null> => {
      for (const tx of transactions.values()) {
        if (tx.order_reference === orderReference) return tx;
      }
      return null;
    },
    findByMerchant: async (
      merchantId: string,
      filters?: {
        status?: TransactionStatus;
        paymentMethod?: PaymentMethodCode;
        startDate?: Date;
        endDate?: Date;
      }
    ): Promise<Transaction[]> => {
      let results = Array.from(transactions.values()).filter(
        (tx) => tx.merchant_id === merchantId
      );

      if (filters?.status) {
        results = results.filter((tx) => tx.status === filters.status);
      }
      if (filters?.paymentMethod) {
        results = results.filter((tx) => tx.payment_method === filters.paymentMethod);
      }
      if (filters?.startDate) {
        results = results.filter((tx) => tx.created_at >= filters.startDate!);
      }
      if (filters?.endDate) {
        results = results.filter((tx) => tx.created_at <= filters.endDate!);
      }

      return results.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    },
    findAll: async (
      filters?: {
        status?: TransactionStatus;
        paymentMethod?: PaymentMethodCode;
        startDate?: Date;
        endDate?: Date;
      }
    ): Promise<Transaction[]> => {
      let results = Array.from(transactions.values());

      if (filters?.status) {
        results = results.filter((tx) => tx.status === filters.status);
      }
      if (filters?.paymentMethod) {
        results = results.filter((tx) => tx.payment_method === filters.paymentMethod);
      }
      if (filters?.startDate) {
        results = results.filter((tx) => tx.created_at >= filters.startDate!);
      }
      if (filters?.endDate) {
        results = results.filter((tx) => tx.created_at <= filters.endDate!);
      }

      return results.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    },
    create: async (data: {
      merchant_id: string;
      order_reference: string;
      amount: number;
      currency_code: CurrencyCode;
      customer_details: CustomerDetails;
      return_url: string;
      result_url: string;
      cancel_url?: string;
      failure_url?: string;
      payment_method?: PaymentMethodCode;
    }): Promise<Transaction> => {
      const transaction: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        merchant_id: data.merchant_id,
        order_reference: data.order_reference,
        transaction_reference: null,
        amount: data.amount,
        currency_code: data.currency_code,
        payment_method: data.payment_method || null,
        status: 'PENDING',
        customer_details: data.customer_details,
        payment_url: null,
        return_url: data.return_url,
        result_url: data.result_url,
        cancel_url: data.cancel_url || null,
        failure_url: data.failure_url || null,
        created_at: new Date(),
        updated_at: new Date(),
        paid_at: null,
      };
      transactions.set(transaction.id, transaction);
      return transaction;
    },
    update: async (id: string, data: Partial<Transaction>): Promise<Transaction | null> => {
      const transaction = transactions.get(id);
      if (!transaction) return null;
      const updated = { ...transaction, ...data, updated_at: new Date() };
      if (data.status === 'PAID' && !transaction.paid_at) {
        updated.paid_at = new Date();
      }
      transactions.set(id, updated);
      return updated;
    },
    updateByOrderReference: async (
      orderReference: string,
      data: Partial<Transaction>
    ): Promise<Transaction | null> => {
      const transaction = await db.transactions.findByOrderReference(orderReference);
      if (!transaction) return null;
      return db.transactions.update(transaction.id, data);
    },
  },

  // Payment method operations
  paymentMethods: {
    findById: async (id: string): Promise<PaymentMethod | null> => {
      return paymentMethods.get(id) || null;
    },
    findByCode: async (code: PaymentMethodCode): Promise<PaymentMethod | null> => {
      for (const pm of paymentMethods.values()) {
        if (pm.code === code) return pm;
      }
      return null;
    },
    findAll: async (): Promise<PaymentMethod[]> => {
      return Array.from(paymentMethods.values());
    },
    findActive: async (): Promise<PaymentMethod[]> => {
      return Array.from(paymentMethods.values()).filter((pm) => pm.is_active);
    },
    update: async (id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod | null> => {
      const pm = paymentMethods.get(id);
      if (!pm) return null;
      const updated = { ...pm, ...data };
      paymentMethods.set(id, updated);
      return updated;
    },
  },

  // Webhook log operations
  webhookLogs: {
    create: async (data: {
      transaction_id: string;
      payload: Record<string, unknown>;
      response?: Record<string, unknown>;
      status_code?: number;
    }): Promise<WebhookLog> => {
      const log: WebhookLog = {
        id: `wh_${Date.now()}`,
        transaction_id: data.transaction_id,
        payload: data.payload,
        response: data.response || null,
        status_code: data.status_code || null,
        created_at: new Date(),
      };
      webhookLogs.set(log.id, log);
      return log;
    },
    findByTransactionId: async (transactionId: string): Promise<WebhookLog[]> => {
      return Array.from(webhookLogs.values())
        .filter((log) => log.transaction_id === transactionId)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    },
  },

  // Statistics
  stats: {
    getOverview: async (merchantId?: string): Promise<{
      totalTransactions: number;
      totalAmount: number;
      paidTransactions: number;
      pendingTransactions: number;
      failedTransactions: number;
    }> => {
      let txs = Array.from(transactions.values());
      if (merchantId) {
        txs = txs.filter((tx) => tx.merchant_id === merchantId);
      }

      const paidTxs = txs.filter((tx) => tx.status === 'PAID');
      
      return {
        totalTransactions: txs.length,
        totalAmount: paidTxs.reduce((sum, tx) => sum + tx.amount, 0),
        paidTransactions: paidTxs.length,
        pendingTransactions: txs.filter((tx) => tx.status === 'PENDING').length,
        failedTransactions: txs.filter((tx) => tx.status === 'FAILED').length,
      };
    },
  },
};
