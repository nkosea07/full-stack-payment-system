# SmilePay SDK

A lightweight TypeScript SDK for the Smile&Pay (ZBNet) payment gateway. Framework-agnostic -- works with Next.js, Express, Remix, or any Node.js/edge runtime that supports `fetch`.

## Setup

Copy the `lib/smilepay/` folder into your project:

```
your-project/
  lib/
    smilepay/
      client.ts
      types.ts
      index.ts
```

Update the import path in `client.ts` if your directory structure differs (the only internal import is `'./types'`).

## Initialization

```typescript
import { SmilePayClient } from './lib/smilepay';

const client = new SmilePayClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  environment: 'sandbox',       // 'sandbox' | 'production'
  webhookSecret: 'your-secret', // optional, for webhook validation
});
```

**Environment URLs:**
- Sandbox: `https://zbnet.zb.co.zw/wallet_sandbox_api`
- Production: `https://zbnet.zb.co.zw/wallet_api`

## Standard Checkout

Redirects the customer to a SmilePay hosted payment page.

```typescript
const orderRef = SmilePayClient.generateOrderReference();

const response = await client.initiateStandardCheckout({
  orderReference: orderRef,
  amount: 10.00,
  currencyCode: SmilePayClient.formatCurrencyCode('USD'), // '840'
  returnUrl: 'https://yoursite.com/payment/return',
  resultUrl: 'https://yoursite.com/api/webhooks/smilepay',
  cancelUrl: 'https://yoursite.com/payment/cancelled',
  failureUrl: 'https://yoursite.com/payment/failed',
  itemName: 'Order #123',
  itemDescription: 'Widget purchase',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  mobilePhoneNumber: '263771234567',
  paymentMethod: 'ECOCASH', // optional: pre-select method
});

if (response.paymentUrl) {
  // Redirect customer to the hosted payment page
  // response.transactionReference - save this for status checks
  redirect(response.paymentUrl);
} else {
  // Payment initiation failed
  console.error(response.responseMessage);
}
```

**Response:**
```typescript
{
  responseCode: string;
  responseMessage: string;
  paymentUrl?: string;           // redirect customer here
  transactionReference?: string; // use for status checks
}
```

## Express Checkout - EcoCash

Triggers a USSD prompt on the customer's phone.

```typescript
const response = await client.expressCheckoutEcoCash({
  orderReference: orderRef,
  amount: 5.00,
  currencyCode: '840',
  resultUrl: 'https://yoursite.com/api/webhooks/smilepay',
  itemName: 'Order #123',
  itemDescription: 'Widget purchase',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  mobilePhoneNumber: '263771234567',
  ecocashMobile: '263771234567',
});

// response.transactionReference - save for polling
// Customer completes payment via USSD on their phone
```

## Express Checkout - Card (MPGS)

Processes card payments directly. May require 3DS authentication.

```typescript
const response = await client.expressCheckoutCard({
  orderReference: orderRef,
  amount: 25.00,
  currencyCode: '840',
  returnUrl: 'https://yoursite.com/payment/return',
  resultUrl: 'https://yoursite.com/api/webhooks/smilepay',
  pan: '5123456789012346',
  expMonth: '05',
  expYear: '25',
  securityCode: '100',
  firstName: 'John',
  lastName: 'Doe',
  mobilePhoneNumber: '263771234567',
  email: 'john@example.com',
});

// Check for 3DS challenge
if (response.customizedHtml?.['3ds2']) {
  const { acsUrl, cReq } = response.customizedHtml['3ds2'];
  // Redirect customer to acsUrl with cReq for 3DS2 authentication
}
```

## Check Payment Status

Poll for status updates (recommended alongside webhooks).

```typescript
const status = await client.checkPaymentStatus('ORD-ABC123');

// status.status: 'PAID' | 'FAILED' | 'CANCELLED' | 'PENDING' etc.
// status.amount, status.currency, status.paymentOption
```

**Response:**
```typescript
{
  merchantId?: string;
  reference?: string;
  orderReference?: string;
  itemName?: string;
  amount?: number;
  currency?: string;
  paymentOption?: string;
  status?: string;          // 'PAID', 'FAILED', 'CANCELED'
  createdDate?: string;
  returnUrl?: string;
  resultUrl?: string;
  clientFee?: number;
  merchantFee?: number;
}
```

## Cancel Payment

Cancel a pending transaction.

```typescript
const result = await client.cancelPayment('ORD-ABC123');
// result.success: boolean
```

## Webhook Handling

SmilePay sends a POST to your `resultUrl` when payment status changes.

**Webhook payload:**
```typescript
{
  merchantId: string;
  reference: string;
  orderReference: string;
  itemName: string;
  amount: number;
  currency: string;
  paymentOption: string;
  status: string;           // 'PAID', 'FAILED', 'CANCELED'
  createdDate: string;
  returnUrl: string;
  resultUrl: string;
  clientFee: number;
  merchantFee: number;
}
```

**Validate the webhook signature:**
```typescript
const isValid = client.validateWebhookSignature(
  JSON.stringify(webhookBody),
  request.headers['x-webhook-signature']
);
```

**Map SmilePay status to a standard enum:**
```typescript
const status = SmilePayClient.mapStatusFromSmilePay(webhookBody.status);
// Returns: 'PAID' | 'FAILED' | 'CANCELLED' | 'PENDING'
```

## Helper Methods

All helpers are static -- no client instance needed.

```typescript
// Generate a unique order reference
const ref = SmilePayClient.generateOrderReference();
// e.g. 'ORD-M5K2X1-A3B7C9'

// Convert currency code
SmilePayClient.formatCurrencyCode('USD'); // '840'
SmilePayClient.formatCurrencyCode('ZWG'); // '924'

// Map internal payment method codes to SmilePay codes
SmilePayClient.mapPaymentMethodToZbPay('VISA_MASTERCARD'); // 'CARD'
SmilePayClient.mapPaymentMethodToZbPay('ECO_CASH');        // 'ECOCASH'
SmilePayClient.mapPaymentMethodToZbPay('INNBUCKS');        // 'INNBUCKS'
SmilePayClient.mapPaymentMethodToZbPay('OMARI');           // 'OMARI'
SmilePayClient.mapPaymentMethodToZbPay('SMILE_CASH');      // 'WALLETPLUS'

// Map SmilePay status strings to standard enum
SmilePayClient.mapStatusFromSmilePay('SUCCESS');   // 'PAID'
SmilePayClient.mapStatusFromSmilePay('COMPLETED'); // 'PAID'
SmilePayClient.mapStatusFromSmilePay('FAILED');    // 'FAILED'
SmilePayClient.mapStatusFromSmilePay('CANCELED');  // 'CANCELLED'
```

## Payment Methods

| SmilePay Code | Description |
|---|---|
| `WALLETPLUS` | ZB Wallet / SmileCash |
| `ECOCASH` | EcoCash mobile wallet |
| `INNBUCKS` | Innbucks wallet |
| `CARD` | Visa / Mastercard (MPGS) |
| `OMARI` | Omari payment |
| `ONEMONEY` | OneMoney wallet |

## Currency Codes

| Currency | ISO Code |
|---|---|
| USD | `840` |
| ZWG | `924` |

## Typical Integration Flow

1. Your server calls `client.initiateStandardCheckout()` or an express method
2. For standard checkout: redirect customer to `paymentUrl`
3. Customer completes payment on SmilePay's hosted page
4. SmilePay sends webhook POST to your `resultUrl`
5. Your server validates the webhook and updates the order
6. Optionally poll `client.checkPaymentStatus()` for confirmation
7. Customer is redirected back to your `returnUrl`
