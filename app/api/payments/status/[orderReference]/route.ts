import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabaseInitialized } from '@/lib/db';
import { SmilePayService, smilePayService } from '@/lib/services/smilepay';

export async function GET(
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

    // If transaction is already completed, return stored status
    if (transaction.status !== 'PENDING') {
      return NextResponse.json({
        success: true,
        order_reference: transaction.order_reference,
        transaction_reference: transaction.transaction_reference,
        status: transaction.status,
        amount: transaction.amount,
        currency_code: transaction.currency_code,
        payment_method: transaction.payment_method,
        paid_at: transaction.paid_at,
      });
    }

    // Check status from SmilePay
    try {
      const smilePayStatus = await smilePayService.checkPaymentStatus(orderReference);
      const mappedStatus = SmilePayService.mapStatusFromSmilePay(smilePayStatus.status || '');

      // Update local status if changed
      if (mappedStatus !== transaction.status) {
        await db.transactions.update(transaction.id, {
          status: mappedStatus,
          transaction_reference: smilePayStatus.reference || transaction.transaction_reference,
        });
      }

      return NextResponse.json({
        success: true,
        order_reference: smilePayStatus.orderReference || transaction.order_reference,
        transaction_reference: smilePayStatus.reference || transaction.transaction_reference,
        status: mappedStatus,
        amount: smilePayStatus.amount ?? transaction.amount,
        currency_code: smilePayStatus.currency || transaction.currency_code,
        payment_method: smilePayStatus.paymentOption || transaction.payment_method,
        item_name: smilePayStatus.itemName,
        client_fee: smilePayStatus.clientFee,
        merchant_fee: smilePayStatus.merchantFee,
        paid_at: mappedStatus === 'PAID' ? new Date() : null,
      });
    } catch {
      // Sandbox mode - return current status
      return NextResponse.json({
        success: true,
        order_reference: transaction.order_reference,
        transaction_reference: transaction.transaction_reference,
        status: transaction.status,
        amount: transaction.amount,
        currency_code: transaction.currency_code,
        payment_method: transaction.payment_method,
        paid_at: transaction.paid_at,
      });
    }
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
