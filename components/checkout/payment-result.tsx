'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCheckout } from './checkout-context';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export function PaymentResult() {
  const {
    transactionStatus,
    orderReference,
    amount,
    currency,
    customer,
    reset,
  } = useCheckout();

  const formatAmount = (amt: number, curr: string) => {
    return curr === 'USD' ? `$${amt.toFixed(2)}` : `ZWG ${amt.toFixed(2)}`;
  };

  const getStatusConfig = () => {
    switch (transactionStatus) {
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
          description: 'Unfortunately, your payment could not be processed. Please try again.',
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
          description: 'Your payment is being processed. Please wait.',
          iconColor: 'text-muted-foreground',
          bgColor: 'bg-muted',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="space-y-6 text-center">
      <div className={`w-20 h-20 rounded-full ${config.bgColor} flex items-center justify-center mx-auto`}>
        <Icon className={`h-10 w-10 ${config.iconColor}`} />
      </div>

      <div>
        <h2 className="text-2xl font-bold">{config.title}</h2>
        <p className="text-muted-foreground mt-2">{config.description}</p>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatAmount(amount, currency)}</span>
          </div>
          {orderReference && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-sm">{orderReference}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer</span>
            <span>{customer.first_name} {customer.last_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="text-sm">{customer.email}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button className="w-full" onClick={reset}>
          Make Another Payment
        </Button>
        <Button variant="outline" className="w-full bg-transparent" asChild>
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
      </div>
    </div>
  );
}
