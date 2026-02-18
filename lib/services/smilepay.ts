// App-level wrapper that reads env vars and creates the SmilePay client singleton.
// The actual SDK lives in @/lib/smilepay and can be used in any project.

import { SmilePayClient } from '@/lib/smilepay';

// Re-export the client class as SmilePayService for backwards compatibility
export { SmilePayClient as SmilePayService } from '@/lib/smilepay';

export const smilePayService = new SmilePayClient({
  apiKey: process.env.SMILEPAY_API_KEY || '',
  apiSecret: process.env.SMILEPAY_API_SECRET || '',
  environment: (process.env.SMILEPAY_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  webhookSecret: process.env.WEBHOOK_SECRET,
});
