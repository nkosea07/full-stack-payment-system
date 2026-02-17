import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabaseInitialized } from '@/lib/db';
import { SmilePayService } from '@/lib/services/smilepay';

interface WebhookPayload {
  orderReference: string;
  transactionReference?: string;
  transactionStatus: string;
  amount?: number;
  currencyCode?: string;
  signature?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();
    
    const body: WebhookPayload = await request.json();
    const signature = request.headers.get('X-Webhook-Signature') || '';

    console.log('Webhook received:', body);

    // Validate webhook signature (in production)
    const smilePayService = new SmilePayService();
    if (!smilePayService.validateWebhookSignature(JSON.stringify(body), signature)) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Find transaction
    const transaction = await db.transactions.findByOrderReference(body.orderReference);
    console.log('Found transaction:', transaction);

    if (!transaction) {
      // Log unknown webhook
      await db.webhookLogs.create({
        transaction_id: 'unknown',
        payload: body as unknown as Record<string, unknown>,
        response: { error: 'Transaction not found' },
        status_code: 404,
      });

      return NextResponse.json(
        { success: false, message: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Map status
    const mappedStatus = SmilePayService.mapStatusFromSmilePay(body.transactionStatus);

    // Update transaction
    await db.transactions.update(transaction.id, {
      status: mappedStatus,
      transaction_reference: body.transactionReference || transaction.transaction_reference,
    });

    // Log webhook
    await db.webhookLogs.create({
      transaction_id: transaction.id,
      payload: body as unknown as Record<string, unknown>,
      response: { success: true },
      status_code: 200,
    });

    // TODO: In production, trigger merchant webhook notification here
    // if (merchant.webhook_url) {
    //   await notifyMerchant(merchant.webhook_url, transaction);
    // }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      order_reference: body.orderReference,
      status: mappedStatus,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
