'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCheckout, CheckoutType } from './checkout-context';
import { CurrencyCode } from '@/lib/db/types';

export function CustomerForm() {
  const {
    checkoutType,
    setCheckoutType,
    amount,
    setAmount,
    currency,
    setCurrency,
    customer,
    setCustomer,
    setStep,
    setError,
  } = useCheckout();

  const [localAmount, setLocalAmount] = useState(amount > 0 ? amount.toString() : '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!localAmount || parseFloat(localAmount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!customer.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!customer.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!customer.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!customer.phone.trim() || !/^(263|0)?7[0-9]{8}$/.test(customer.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Valid Zimbabwe phone number required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (validateForm()) {
      setAmount(parseFloat(localAmount));
      setStep('payment');
    }
  };

  const updateCustomer = (field: keyof typeof customer, value: string) => {
    setCustomer({ ...customer, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Checkout Type Toggle */}
      <div className="space-y-2">
        <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Checkout Type
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={checkoutType === 'standard' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setCheckoutType('standard' as CheckoutType)}
          >
            Standard
          </Button>
          <Button
            type="button"
            variant={checkoutType === 'express' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setCheckoutType('express' as CheckoutType)}
          >
            Express
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {checkoutType === 'standard'
            ? 'Redirects to Smile&Pay hosted payment page'
            : 'Direct payment with EcoCash or Card'}
        </p>
      </div>

      {/* Amount & Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Amount
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={localAmount}
            onChange={(e) => {
              setLocalAmount(e.target.value);
              if (errors.amount) setErrors({ ...errors, amount: '' });
            }}
            className={errors.amount ? 'border-destructive' : ''}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Currency
          </Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="ZWG">ZWG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customer Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Customer Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              First Name
            </Label>
            <Input
              id="first_name"
              placeholder="Jane"
              value={customer.first_name}
              onChange={(e) => updateCustomer('first_name', e.target.value)}
              className={errors.first_name ? 'border-destructive' : ''}
            />
            {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Last Name
            </Label>
            <Input
              id="last_name"
              placeholder="Doe"
              value={customer.last_name}
              onChange={(e) => updateCustomer('last_name', e.target.value)}
              className={errors.last_name ? 'border-destructive' : ''}
            />
            {errors.last_name && <p className="text-xs text-destructive">{errors.last_name}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="jane.doe@email.com"
            value={customer.email}
            onChange={(e) => updateCustomer('email', e.target.value)}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0771234567"
            value={customer.phone}
            onChange={(e) => updateCustomer('phone', e.target.value)}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continue to Payment
      </Button>
    </form>
  );
}
