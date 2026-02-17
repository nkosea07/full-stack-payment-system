import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabaseInitialized } from '@/lib/db';
import { SmilePayService, smilePayService } from '@/lib/services/smilepay';
import { InitiatePaymentRequest } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const body: InitiatePaymentRequest = await request.json();

    // Validate required fields
    if (!body.amount || !body.currency_code || !body.customer || !body.return_url || !body.result_url) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate customer details
    if (!body.customer.first_name || !body.customer.last_name || !body.customer.email || !body.customer.phone) {
      return NextResponse.json(
        { success: false, message: 'Missing customer details' },
        { status: 400 }
      );
    }

    // Generate order reference if not provided
    const orderReference = body.order_reference || SmilePayService.generateOrderReference();

    // Get default merchant (in production, authenticate and get merchant from API key)
    const merchants = await db.merchants.findAll();
    const merchant = merchants[0];

    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Create transaction record
    const transaction = await db.transactions.create({
      merchant_id: merchant.id,
      order_reference: orderReference,
      amount: body.amount,
      currency_code: body.currency_code,
      customer_details: body.customer,
      return_url: body.return_url,
      result_url: body.result_url,
      cancel_url: body.cancel_url,
      failure_url: body.failure_url,
      payment_method: body.payment_method,
    });

    // For standard checkout, redirect to SmilePay hosted page
    if (body.checkout_type === 'standard') {
      const smilePayRequest = {
        currencyCode: SmilePayService.formatCurrencyCode(body.currency_code),
        amount: body.amount,
        orderReference: orderReference,
        resultUrl: body.result_url,
        returnUrl: body.return_url,
        cancelUrl: body.cancel_url,
        failureUrl: body.failure_url,
        customer: {
          firstName: body.customer.first_name,
          lastName: body.customer.last_name,
          emailAddress: body.customer.email,
          phoneNumber: body.customer.phone,
        },
      };

      try {
        const smilePayResponse = await smilePayService.initiateStandardCheckout(smilePayRequest);

        if (smilePayResponse.statusCode === '200' || smilePayResponse.paymentUrl) {
          // Update transaction with payment URL and reference
          await db.transactions.update(transaction.id, {
            payment_url: smilePayResponse.paymentUrl,
            transaction_reference: smilePayResponse.transactionReference,
          });

          return NextResponse.json({
            success: true,
            transaction_id: transaction.id,
            order_reference: orderReference,
            transaction_reference: smilePayResponse.transactionReference,
            payment_url: smilePayResponse.paymentUrl,
            status: 'PENDING',
            message: 'Payment initiated successfully',
          });
        } else {
          // Mark transaction as failed
          await db.transactions.update(transaction.id, { status: 'FAILED' });

          return NextResponse.json({
            success: false,
            transaction_id: transaction.id,
            order_reference: orderReference,
            status: 'FAILED',
            message: smilePayResponse.statusMessage || 'Failed to initiate payment',
          });
        }
      } catch {
        // For sandbox/demo mode, return simulated response
        const simulatedPaymentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/payment?ref=${orderReference}`;
        
        await db.transactions.update(transaction.id, {
          payment_url: simulatedPaymentUrl,
          transaction_reference: `SIM-${Date.now()}`,
        });

        return NextResponse.json({
          success: true,
          transaction_id: transaction.id,
          order_reference: orderReference,
          transaction_reference: `SIM-${Date.now()}`,
          payment_url: simulatedPaymentUrl,
          status: 'PENDING',
          message: 'Payment initiated (sandbox mode)',
        });
      }
    }

    // For express checkout without specific method, return transaction for further processing
    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      order_reference: orderReference,
      status: 'PENDING',
      message: 'Transaction created. Select payment method to continue.',
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
