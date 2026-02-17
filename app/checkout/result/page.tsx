'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Shield } from 'lucide-react';

interface TransactionDetails {
  order_reference: string;
  transaction_reference: string | null;
  amount: number;
  currency_code: string;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderRef = searchParams.get('ref');
  const urlStatus = searchParams.get('status');
  const cancelled = searchParams.get('cancelled');
  const failed = searchParams.get('failed');
  
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);

  useEffect(() => {
    if (!orderRef) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status/${orderRef}`);
        const data = await response.json();
        if (data.success) {
          setTransaction(data);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [orderRef]);

  const getStatus = () => {
    if (cancelled) return 'CANCELLED';
    if (failed) return 'FAILED';
    if (urlStatus === 'paid') return 'PAID';
    if (urlStatus === 'failed') return 'FAILED';
    return transaction?.status || 'PENDING';
  };

  const status = getStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'PAID':
        return {
          icon: CheckCircle,
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully.',
          iconColor: 'text-success',
          bgColor: 'bg-success/10',
        };
      case 'FAILED':
        return {
          icon: XCircle,
          title: 'Payment Failed',
          description: 'Unfortunately, your payment could not be processed.',
          iconColor: 'text-destructive',
          bgColor: 'bg-destructive/10',
        };
      case 'CANCELLED':
        return {
          icon: AlertCircle,
          title: 'Payment Cancelled',
          description: 'Your payment was cancelled.',
          iconColor: 'text-warning',
          bgColor: 'bg-warning/10',
        };
      default:
        return {
          icon: Clock,
          title: 'Payment Pending',
          description: 'Your payment is being processed.',
          iconColor: 'text-muted-foreground',
          bgColor: 'bg-muted',
        };
    }
  };

  const formatAmount = (amt: number, curr: string) => {
    return curr === 'USD' ? `$${amt.toFixed(2)}` : `ZWG ${amt.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const config = getStatusConfig();
  const Icon = config.icon;

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
            <span>Secure Payment</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full ${config.bgColor} flex items-center justify-center mx-auto`}>
                  <Icon className={`h-10 w-10 ${config.iconColor}`} />
                </div>
                <h2 className="text-2xl font-bold mt-4">{config.title}</h2>
                <p className="text-muted-foreground mt-2">{config.description}</p>
              </div>

              {transaction && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">
                      {formatAmount(transaction.amount, transaction.currency_code)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono text-sm">{transaction.order_reference}</span>
                  </div>
                  {transaction.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method</span>
                      <span>{transaction.payment_method.replace('_', ' ')}</span>
                    </div>
                  )}
                  {transaction.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid At</span>
                      <span className="text-sm">
                        {new Date(transaction.paid_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <Button className="w-full" onClick={() => router.push('/checkout')}>
                  Make Another Payment
                </Button>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
