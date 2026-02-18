'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCheckout } from './checkout-context';
import { PaymentMethodCode } from '@/lib/db/types';
import { Smartphone, CreditCard, ChevronLeft } from 'lucide-react';

const PAYMENT_METHODS = [
  {
    code: 'ECO_CASH' as PaymentMethodCode,
    name: 'EcoCash',
    description: 'Pay with your EcoCash mobile wallet',
    icon: Smartphone,
  },
  {
    code: 'VISA_MASTERCARD' as PaymentMethodCode,
    name: 'Visa / Mastercard',
    description: 'Pay with your debit or credit card',
    icon: CreditCard,
  },
];

export function PaymentMethodSelector() {
  const {
    checkoutType,
    paymentMethod,
    setPaymentMethod,
    setStep,
    amount,
    currency,
    customer,
    setOrderReference,
    setTransactionId,
    setPaymentUrl,
    setError,
  } = useCheckout();

  const [loading, setLoading] = useState(false);

  const handleStandardCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency_code: currency,
          customer,
          return_url: `${baseUrl}/checkout/result`,
          result_url: `${baseUrl}/api/webhooks/smilepay`,
          cancel_url: `${baseUrl}/checkout/result?cancelled=true`,
          failure_url: `${baseUrl}/checkout/result?failed=true`,
          checkout_type: 'standard',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderReference(data.order_reference);
        setTransactionId(data.transaction_id);
        setPaymentUrl(data.payment_url);
        
        if (data.payment_url) {
          // Redirect to SmilePay hosted payment page
          window.location.href = data.payment_url;
        } else {
          setStep('processing');
        }
      } else {
        setError(data.message || 'Failed to initiate payment');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMethod = (method: PaymentMethodCode) => {
    setPaymentMethod(method);
    setStep('processing');
  };

  const formatAmount = (amt: number, curr: string) => {
    return curr === 'USD' ? `$${amt.toFixed(2)}` : `ZWG ${amt.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount to pay</span>
            <span className="text-2xl font-bold">{formatAmount(amount, currency)}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {customer.first_name} {customer.last_name} - {customer.email}
          </p>
        </CardContent>
      </Card>

      {checkoutType === 'standard' ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You will be redirected to Smile&Pay secure payment page to complete your payment.
          </p>
          <Button
            className="w-full"
            size="lg"
            onClick={handleStandardCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay with Smile&Pay'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Select Payment Method</h3>
          
          <div className="grid gap-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.code;
              
              return (
                <Card
                  key={method.code}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleSelectMethod(method.code)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        className="w-full"
        onClick={() => setStep('details')}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Details
      </Button>
    </div>
  );
}
