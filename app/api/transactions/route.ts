import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabaseInitialized } from '@/lib/db';
import { TransactionStatus, PaymentMethodCode } from '@/lib/db/types';

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filters
    const status = searchParams.get('status') as TransactionStatus | null;
    const paymentMethod = searchParams.get('payment_method') as PaymentMethodCode | null;
    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');

    const filters: {
      status?: TransactionStatus;
      paymentMethod?: PaymentMethodCode;
      startDate?: Date;
      endDate?: Date;
    } = {};

    if (status) filters.status = status;
    if (paymentMethod) filters.paymentMethod = paymentMethod;
    if (startDateStr) filters.startDate = new Date(startDateStr);
    if (endDateStr) filters.endDate = new Date(endDateStr);

    const transactions = await db.transactions.findAll(filters);

    return NextResponse.json({
      success: true,
      transactions: transactions.map((tx) => ({
        id: tx.id,
        order_reference: tx.order_reference,
        transaction_reference: tx.transaction_reference,
        amount: tx.amount,
        currency_code: tx.currency_code,
        payment_method: tx.payment_method,
        status: tx.status,
        customer: tx.customer_details,
        created_at: tx.created_at,
        paid_at: tx.paid_at,
      })),
      count: transactions.length,
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
