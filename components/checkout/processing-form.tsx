'use client';

import { useCheckout } from './checkout-context';
import { EcoCashForm } from './ecocash-form';
import { CardForm } from './card-form';

export function ProcessingForm() {
  const { paymentMethod } = useCheckout();

  if (paymentMethod === 'ECO_CASH') {
    return <EcoCashForm />;
  }

  if (paymentMethod === 'VISA_MASTERCARD') {
    return <CardForm />;
  }

  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">No payment method selected</p>
    </div>
  );
}
