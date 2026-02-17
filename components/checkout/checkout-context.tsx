'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { CurrencyCode, CustomerDetails, PaymentMethodCode, TransactionStatus } from '@/lib/db/types';

export type CheckoutType = 'standard' | 'express';

interface CheckoutState {
  step: 'details' | 'payment' | 'processing' | 'result';
  checkoutType: CheckoutType;
  amount: number;
  currency: CurrencyCode;
  customer: CustomerDetails;
  paymentMethod: PaymentMethodCode | null;
  orderReference: string | null;
  transactionId: string | null;
  transactionStatus: TransactionStatus | null;
  paymentUrl: string | null;
  error: string | null;
}

interface CheckoutContextValue extends CheckoutState {
  setStep: (step: CheckoutState['step']) => void;
  setCheckoutType: (type: CheckoutType) => void;
  setAmount: (amount: number) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setCustomer: (customer: CustomerDetails) => void;
  setPaymentMethod: (method: PaymentMethodCode | null) => void;
  setOrderReference: (ref: string | null) => void;
  setTransactionId: (id: string | null) => void;
  setTransactionStatus: (status: TransactionStatus | null) => void;
  setPaymentUrl: (url: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: CheckoutState = {
  step: 'details',
  checkoutType: 'standard',
  amount: 0,
  currency: 'USD',
  customer: {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  },
  paymentMethod: null,
  orderReference: null,
  transactionId: null,
  transactionStatus: null,
  paymentUrl: null,
  error: null,
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CheckoutState>(initialState);

  const setStep = (step: CheckoutState['step']) => 
    setState((prev) => ({ ...prev, step }));
  
  const setCheckoutType = (checkoutType: CheckoutType) =>
    setState((prev) => ({ ...prev, checkoutType }));
  
  const setAmount = (amount: number) =>
    setState((prev) => ({ ...prev, amount }));
  
  const setCurrency = (currency: CurrencyCode) =>
    setState((prev) => ({ ...prev, currency }));
  
  const setCustomer = (customer: CustomerDetails) =>
    setState((prev) => ({ ...prev, customer }));
  
  const setPaymentMethod = (paymentMethod: PaymentMethodCode | null) =>
    setState((prev) => ({ ...prev, paymentMethod }));
  
  const setOrderReference = (orderReference: string | null) =>
    setState((prev) => ({ ...prev, orderReference }));
  
  const setTransactionId = (transactionId: string | null) =>
    setState((prev) => ({ ...prev, transactionId }));
  
  const setTransactionStatus = (transactionStatus: TransactionStatus | null) =>
    setState((prev) => ({ ...prev, transactionStatus }));
  
  const setPaymentUrl = (paymentUrl: string | null) =>
    setState((prev) => ({ ...prev, paymentUrl }));
  
  const setError = (error: string | null) =>
    setState((prev) => ({ ...prev, error }));
  
  const reset = () => setState(initialState);

  return (
    <CheckoutContext.Provider
      value={{
        ...state,
        setStep,
        setCheckoutType,
        setAmount,
        setCurrency,
        setCustomer,
        setPaymentMethod,
        setOrderReference,
        setTransactionId,
        setTransactionStatus,
        setPaymentUrl,
        setError,
        reset,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
