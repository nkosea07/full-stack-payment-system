import { query, getClient } from './connection';
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

// PostgreSQL database operations
export const db = {
  // Merchant operations
  merchants: {
    findById: async (id: string): Promise<Merchant | null> => {
      const result = await query<Merchant>(
        'SELECT * FROM merchants WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },

    findByApiKey: async (apiKey: string): Promise<Merchant | null> => {
      const result = await query<Merchant>(
        'SELECT * FROM merchants WHERE api_key = $1',
        [apiKey]
      );
      return result.rows[0] || null;
    },

    findAll: async (): Promise<Merchant[]> => {
      const result = await query<Merchant>('SELECT * FROM merchants ORDER BY created_at DESC');
      return result.rows;
    },

    create: async (data: Omit<Merchant, 'id' | 'created_at'>): Promise<Merchant> => {
      const merchant: Merchant = {
        ...data,
        id: `merchant_${Date.now()}`,
        created_at: new Date(),
      };
      
      await query(
        `INSERT INTO merchants (id, name, api_key, webhook_url, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          merchant.id,
          merchant.name,
          merchant.api_key,
          merchant.webhook_url,
          merchant.is_active,
          merchant.created_at
        ]
      );
      
      return merchant;
    },

    update: async (id: string, data: Partial<Merchant>): Promise<Merchant | null> => {
      const fields = Object.keys(data).filter(key => key !== 'id');
      const values = fields.map(field => (data as any)[field]);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const result = await query<Merchant>(
        `UPDATE merchants SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      
      return result.rows[0] || null;
    },
  },

  // Transaction operations
  transactions: {
    findById: async (id: string): Promise<Transaction | null> => {
      const result = await query<Transaction>(
        'SELECT * FROM transactions WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },

    findByOrderReference: async (orderReference: string): Promise<Transaction | null> => {
      const result = await query<Transaction>(
        'SELECT * FROM transactions WHERE order_reference = $1',
        [orderReference]
      );
      return result.rows[0] || null;
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
      let queryText = 'SELECT * FROM transactions WHERE merchant_id = $1';
      const params: any[] = [merchantId];
      let paramIndex = 2;

      if (filters?.status) {
        queryText += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }
      if (filters?.paymentMethod) {
        queryText += ` AND payment_method = $${paramIndex++}`;
        params.push(filters.paymentMethod);
      }
      if (filters?.startDate) {
        queryText += ` AND created_at >= $${paramIndex++}`;
        params.push(filters.startDate);
      }
      if (filters?.endDate) {
        queryText += ` AND created_at <= $${paramIndex++}`;
        params.push(filters.endDate);
      }

      queryText += ' ORDER BY created_at DESC';

      const result = await query<Transaction>(queryText, params);
      return result.rows;
    },

    findAll: async (
      filters?: {
        status?: TransactionStatus;
        paymentMethod?: PaymentMethodCode;
        startDate?: Date;
        endDate?: Date;
      }
    ): Promise<Transaction[]> => {
      let queryText = 'SELECT * FROM transactions WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.status) {
        queryText += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }
      if (filters?.paymentMethod) {
        queryText += ` AND payment_method = $${paramIndex++}`;
        params.push(filters.paymentMethod);
      }
      if (filters?.startDate) {
        queryText += ` AND created_at >= $${paramIndex++}`;
        params.push(filters.startDate);
      }
      if (filters?.endDate) {
        queryText += ` AND created_at <= $${paramIndex++}`;
        params.push(filters.endDate);
      }

      queryText += ' ORDER BY created_at DESC';

      const result = await query<Transaction>(queryText, params);
      return result.rows;
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

      await query(
        `INSERT INTO transactions (
          id, merchant_id, order_reference, transaction_reference, amount, currency_code,
          payment_method, status, customer_details, payment_url, return_url, result_url,
          cancel_url, failure_url, created_at, updated_at, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          transaction.id,
          transaction.merchant_id,
          transaction.order_reference,
          transaction.transaction_reference,
          transaction.amount,
          transaction.currency_code,
          transaction.payment_method,
          transaction.status,
          JSON.stringify(transaction.customer_details),
          transaction.payment_url,
          transaction.return_url,
          transaction.result_url,
          transaction.cancel_url,
          transaction.failure_url,
          transaction.created_at,
          transaction.updated_at,
          transaction.paid_at
        ]
      );

      return transaction;
    },

    update: async (id: string, data: Partial<Transaction>): Promise<Transaction | null> => {
      const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at');
      const values = fields.map(field => {
        const value = (data as any)[field];
        return field === 'customer_details' ? JSON.stringify(value) : value;
      });
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      // Handle paid_at specifically
      let finalQuery = `UPDATE transactions SET ${setClause}`;
      let finalParams = [id, ...values];
      let paramIndex = finalParams.length + 1;

      if (data.status === 'PAID') {
        finalQuery += `, paid_at = $${paramIndex}`;
        finalParams.push(new Date());
      }

      finalQuery += ' WHERE id = $1 RETURNING *';

      const result = await query<Transaction>(finalQuery, finalParams);
      return result.rows[0] || null;
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
      const result = await query<PaymentMethod>(
        'SELECT * FROM payment_methods WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },

    findByCode: async (code: PaymentMethodCode): Promise<PaymentMethod | null> => {
      const result = await query<PaymentMethod>(
        'SELECT * FROM payment_methods WHERE code = $1',
        [code]
      );
      return result.rows[0] || null;
    },

    findAll: async (): Promise<PaymentMethod[]> => {
      const result = await query<PaymentMethod>('SELECT * FROM payment_methods ORDER BY name');
      return result.rows;
    },

    findActive: async (): Promise<PaymentMethod[]> => {
      const result = await query<PaymentMethod>(
        'SELECT * FROM payment_methods WHERE is_active = true ORDER BY name'
      );
      return result.rows;
    },

    update: async (id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod | null> => {
      const fields = Object.keys(data).filter(key => key !== 'id');
      const values = fields.map(field => {
        const value = (data as any)[field];
        return field === 'config' ? JSON.stringify(value) : value;
      });
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const result = await query<PaymentMethod>(
        `UPDATE payment_methods SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      
      return result.rows[0] || null;
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

      await query(
        `INSERT INTO webhook_logs (id, transaction_id, payload, response, status_code, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          log.id,
          log.transaction_id,
          JSON.stringify(log.payload),
          JSON.stringify(log.response),
          log.status_code,
          log.created_at
        ]
      );

      return log;
    },

    findByTransactionId: async (transactionId: string): Promise<WebhookLog[]> => {
      const result = await query<WebhookLog>(
        'SELECT * FROM webhook_logs WHERE transaction_id = $1 ORDER BY created_at DESC',
        [transactionId]
      );
      return result.rows;
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
      let queryText = `
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as total_amount,
          COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_transactions,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_transactions,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_transactions
        FROM transactions
      `;
      const params: any[] = [];

      if (merchantId) {
        queryText += ' WHERE merchant_id = $1';
        params.push(merchantId);
      }

      const result = await query(queryText, params);
      const row = result.rows[0];

      return {
        totalTransactions: parseInt(row.total_transactions),
        totalAmount: parseFloat(row.total_amount),
        paidTransactions: parseInt(row.paid_transactions),
        pendingTransactions: parseInt(row.pending_transactions),
        failedTransactions: parseInt(row.failed_transactions),
      };
    },
  },
};
