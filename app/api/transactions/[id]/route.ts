import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabaseInitialized } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transaction = await db.transactions.findById(id);

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Get webhook logs for this transaction
    const webhookLogs = await db.webhookLogs.findByTransactionId(id);

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        order_reference: transaction.order_reference,
        transaction_reference: transaction.transaction_reference,
        amount: transaction.amount,
        currency_code: transaction.currency_code,
        payment_method: transaction.payment_method,
        status: transaction.status,
        customer: transaction.customer_details,
        payment_url: transaction.payment_url,
        return_url: transaction.return_url,
        result_url: transaction.result_url,
        cancel_url: transaction.cancel_url,
        failure_url: transaction.failure_url,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
        paid_at: transaction.paid_at,
      },
      webhook_logs: webhookLogs,
    });
  } catch (error) {
    console.error('Transaction fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
