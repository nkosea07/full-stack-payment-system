import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabaseInitialized } from '@/lib/db';
import { smilePayService } from '@/lib/services/smilepay';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderReference: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    const { orderReference } = await params;

    if (!orderReference) {
      return NextResponse.json(
        { success: false, message: 'Order reference is required' },
        { status: 400 }
      );
    }

    // Find transaction
    const transaction = await db.transactions.findByOrderReference(orderReference);

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Can only cancel pending transactions
    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: `Cannot cancel transaction with status: ${transaction.status}` },
        { status: 400 }
      );
    }

    try {
      // Attempt to cancel with SmilePay
      const smilePayResponse = await smilePayService.cancelPayment(orderReference);

      if (smilePayResponse.success) {
        await db.transactions.update(transaction.id, { status: 'CANCELLED' });

        return NextResponse.json({
          success: true,
          order_reference: orderReference,
          status: 'CANCELLED',
          message: 'Transaction cancelled successfully',
          return_url: smilePayResponse.returnUrl,
        });
      } else {
        return NextResponse.json({
          success: false,
          order_reference: orderReference,
          message: smilePayResponse.description || 'Failed to cancel transaction',
        });
      }
    } catch {
      // Sandbox mode - just update local status
      await db.transactions.update(transaction.id, { status: 'CANCELLED' });

      return NextResponse.json({
        success: true,
        order_reference: orderReference,
        status: 'CANCELLED',
        message: 'Transaction cancelled (sandbox mode)',
      });
    }
  } catch (error) {
    console.error('Cancel payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
