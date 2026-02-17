import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabaseInitialized } from '@/lib/db';
import { TransactionStatus } from '@/lib/db/types';

// Sandbox-only endpoint to simulate payment status changes
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const body = await request.json();
    const { order_reference, status } = body as {
      order_reference: string;
      status: TransactionStatus;
    };

    if (!order_reference || !status) {
      return NextResponse.json(
        { success: false, message: 'Order reference and status are required' },
        { status: 400 }
      );
    }

    if (!['PENDING', 'PAID', 'FAILED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      );
    }

    const transaction = await db.transactions.findByOrderReference(order_reference);

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: 'Transaction not found' },
        { status: 404 }
      );
    }

    await db.transactions.update(transaction.id, { status });

    // Log simulated webhook
    await db.webhookLogs.create({
      transaction_id: transaction.id,
      payload: {
        orderReference: order_reference,
        transactionStatus: status,
        simulated: true,
      },
      response: { success: true },
      status_code: 200,
    });

    return NextResponse.json({
      success: true,
      order_reference,
      status,
      message: `Transaction status updated to ${status} (simulated)`,
    });
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
