'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useCheckout } from './checkout-context';
import { CreditCard, ChevronLeft, Loader2, Lock } from 'lucide-react';

export function CardForm() {
  const {
    amount,
    currency,
    customer,
    setStep,
    setOrderReference,
    setTransactionId,
    setTransactionStatus,
    setError,
    error,
  } = useCheckout();

  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const formatAmount = (amt: number, curr: string) => {
    const n = Number(amt);
    return curr === 'USD' ? `$${n.toFixed(2)}` : `ZWG ${n.toFixed(2)}`;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      setError('Please enter a valid card number');
      setLoading(false);
      return;
    }

    if (!expiryMonth || !expiryYear || parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
      setError('Please enter a valid expiry date');
      setLoading(false);
      return;
    }

    if (cvv.length < 3 || cvv.length > 4) {
      setError('Please enter a valid CVV');
      setLoading(false);
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      const response = await fetch('/api/payments/express/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency_code: currency,
          customer,
          card_number: cleanCardNumber,
          expiry_month: expiryMonth.padStart(2, '0'),
          expiry_year: expiryYear,
          cvv,
          return_url: `${baseUrl}/checkout/result`,
          result_url: `${baseUrl}/api/webhooks/smilepay`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderReference(data.order_reference);
        setTransactionId(data.transaction_id);

        // Handle 3DS redirect if needed
        if (data.redirect_html) {
          // In production, render the 3DS HTML
          document.body.innerHTML = data.redirect_html;
        } else {
          // For sandbox, go directly to result
          setTransactionStatus('PAID');
          setStep('result');
        }
      } else {
        setError(data.message || 'Failed to process card payment');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Card Payment</p>
              <p className="text-sm text-muted-foreground">
                {formatAmount(amount, currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardNumber" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Card Number
          </Label>
          <Input
            id="cardNumber"
            type="text"
            placeholder="4111 1111 1111 1111"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            maxLength={19}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryMonth" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Month
            </Label>
            <Input
              id="expiryMonth"
              type="text"
              placeholder="MM"
              value={expiryMonth}
              onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
              maxLength={2}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryYear" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Year
            </Label>
            <Input
              id="expiryYear"
              type="text"
              placeholder="YY"
              value={expiryYear}
              onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
              maxLength={2}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvv" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              CVV
            </Label>
            <Input
              id="cvv"
              type="text"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Your payment is secure and encrypted</span>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${formatAmount(amount, currency)}`
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => setStep('payment')}
        disabled={loading}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
    </form>
  );
}
