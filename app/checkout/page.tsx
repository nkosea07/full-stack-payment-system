'use client';

import { CheckoutProvider, useCheckout } from '@/components/checkout/checkout-context';
import { CustomerForm } from '@/components/checkout/customer-form';
import { PaymentMethodSelector } from '@/components/checkout/payment-method-selector';
import { ProcessingForm } from '@/components/checkout/processing-form';
import { PaymentResult } from '@/components/checkout/payment-result';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

function CheckoutContent() {
  const { step, error } = useCheckout();

  const getTitle = () => {
    switch (step) {
      case 'details':
        return 'Checkout Details';
      case 'payment':
        return 'Select Payment';
      case 'processing':
        return 'Complete Payment';
      case 'result':
        return 'Payment Status';
      default:
        return 'Checkout';
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'details':
        return <CustomerForm />;
      case 'payment':
        return <PaymentMethodSelector />;
      case 'processing':
        return <ProcessingForm />;
      case 'result':
        return <PaymentResult />;
      default:
        return <CustomerForm />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['details', 'payment', 'processing', 'result'].map((s, i) => {
              const steps = ['details', 'payment', 'processing', 'result'];
              const currentIndex = steps.indexOf(step);
              const isActive = i <= currentIndex;
              
              return (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isActive ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                  {i < 3 && (
                    <div
                      className={`w-8 h-0.5 transition-colors ${
                        i < currentIndex ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">{getTitle()}</CardTitle>
            </CardHeader>
            <CardContent>
              {error && step !== 'result' && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}
              {renderStep()}
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Powered by Smile&Pay Payment Gateway
          </p>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <CheckoutProvider>
      <CheckoutContent />
    </CheckoutProvider>
  );
}
