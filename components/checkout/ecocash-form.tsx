'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useCheckout } from './checkout-context';
import { Smartphone, ChevronLeft, Loader2 } from 'lucide-react';

export function EcoCashForm() {
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

  const [phoneNumber, setPhoneNumber] = useState(customer.phone || '');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [currentOrderRef, setCurrentOrderRef] = useState<string | null>(null);

  const formatAmount = (amt: number, curr: string) => {
    return curr === 'USD' ? `$${amt.toFixed(2)}` : `ZWG ${amt.toFixed(2)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate phone number
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (!/^(263|0)?7[0-9]{8}$/.test(cleanPhone)) {
      setError('Please enter a valid Zimbabwe phone number');
      setLoading(false);
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      const response = await fetch('/api/payments/express/ecocash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency_code: currency,
          customer,
          phone_number: cleanPhone,
          return_url: `${baseUrl}/checkout/result`,
          result_url: `${baseUrl}/api/webhooks/smilepay`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderReference(data.order_reference);
        setTransactionId(data.transaction_id);
        setCurrentOrderRef(data.order_reference);
        setPolling(true);
      } else {
        setError(data.message || 'Failed to initiate EcoCash payment');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Poll for payment status
  useEffect(() => {
    if (!polling || !currentOrderRef) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/status/${currentOrderRef}`);
        const data = await response.json();

        if (data.success && data.status !== 'PENDING') {
          setTransactionStatus(data.status);
          setPolling(false);
          setStep('result');
        }
      } catch {
        // Continue polling
      }
    }, 5000);

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      setPolling(false);
      setTransactionStatus('FAILED');
      setStep('result');
    }, 120000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [polling, currentOrderRef, setTransactionStatus, setStep]);

  if (polling) {
    return (
      <div className="space-y-6 text-center">
        <div className="py-8">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h3 className="text-lg font-semibold mt-4">Waiting for Payment</h3>
          <p className="text-muted-foreground mt-2">
            Please check your phone for the EcoCash USSD prompt and enter your PIN to complete the payment.
          </p>
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">{phoneNumber}</p>
                <p className="text-sm text-muted-foreground">Amount: {formatAmount(amount, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          onClick={() => {
            setPolling(false);
            setCurrentOrderRef(null);
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">EcoCash Payment</p>
              <p className="text-sm text-muted-foreground">
                {formatAmount(amount, currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          EcoCash Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="0771234567"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Enter the phone number linked to your EcoCash account
        </p>
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
          'Pay with EcoCash'
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
