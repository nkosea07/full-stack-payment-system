'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Shield } from 'lucide-react';

function PaymentSimulationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderRef = searchParams.get('ref');
  
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<{
    amount: number;
    currency_code: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (!orderRef) return;

    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/payments/status/${orderRef}`);
        const data = await response.json();
        if (data.success) {
          setTransaction({
            amount: data.amount,
            currency_code: data.currency_code,
            status: data.status,
          });
        }
      } catch (error) {
        console.error('Failed to fetch transaction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [orderRef]);

  const handleSimulatePayment = async (status: 'PAID' | 'FAILED') => {
    setLoading(true);
    try {
      await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_reference: orderRef,
          status,
        }),
      });

      // Redirect to result page
      router.push(`/checkout/result?ref=${orderRef}&status=${status.toLowerCase()}`);
    } catch (error) {
      console.error('Simulation failed:', error);
      setLoading(false);
    }
  };

  const formatAmount = (amt: number, curr: string) => {
    const n = Number(amt);
    return curr === 'USD' ? `$${n.toFixed(2)}` : `ZWG ${n.toFixed(2)}`;
  };

  if (loading && !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orderRef || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p>Invalid payment reference</p>
            <Button className="mt-4" onClick={() => router.push('/checkout')}>
              Go to Checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S&P</span>
            </div>
            <span className="font-semibold">Smile&Pay</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Sandbox Mode</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Complete Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4 border-b">
                <p className="text-4xl font-bold">
                  {formatAmount(transaction.amount, transaction.currency_code)}
                </p>
                <p className="text-muted-foreground mt-2">Order: {orderRef}</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-center text-muted-foreground">
                  This is a sandbox simulation. In production, this would be the Smile&Pay hosted payment page.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSimulatePayment('PAID')}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Simulate Successful Payment
                </Button>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => handleSimulatePayment('FAILED')}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Simulate Failed Payment
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push('/checkout')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function PaymentSimulationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentSimulationContent />
    </Suspense>
  );
}
