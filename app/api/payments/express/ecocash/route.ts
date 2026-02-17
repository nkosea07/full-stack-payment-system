import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { SmilePayService, smilePayService } from '@/lib/services/smilepay';
import { ExpressEcoCashRequest } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    const body: ExpressEcoCashRequest = await request.json();

    // Validate required fields
    if (!body.amount || !body.currency_code || !body.customer || !body.phone_number || !body.return_url || !body.result_url) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate phone number format (Zimbabwe)
    const phoneRegex = /^(263|0)7[0-9]{8}$/;
    if (!phoneRegex.test(body.phone_number.replace(/\s/g, ''))) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const orderReference = body.order_reference || SmilePayService.generateOrderReference();

    // Get default merchant
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
      payment_method: 'ECO_CASH',
    });

    const smilePayRequest = {
      currencyCode: SmilePayService.formatCurrencyCode(body.currency_code),
      amount: body.amount,
      orderReference: orderReference,
      resultUrl: body.result_url,
      returnUrl: body.return_url,
      phoneNumber: body.phone_number,
      customer: {
        firstName: body.customer.first_name,
        lastName: body.customer.last_name,
        emailAddress: body.customer.email,
        phoneNumber: body.customer.phone,
      },
    };

    try {
      const smilePayResponse = await smilePayService.expressCheckoutEcoCash(smilePayRequest);

      if (smilePayResponse.statusCode === '200') {
        await db.transactions.update(transaction.id, {
          transaction_reference: smilePayResponse.transactionReference,
        });

        return NextResponse.json({
          success: true,
          transaction_id: transaction.id,
          order_reference: orderReference,
          transaction_reference: smilePayResponse.transactionReference,
          status: 'PENDING',
          message: 'EcoCash payment initiated. Please check your phone for USSD prompt.',
        });
      } else {
        await db.transactions.update(transaction.id, { status: 'FAILED' });

        return NextResponse.json({
          success: false,
          transaction_id: transaction.id,
          order_reference: orderReference,
          status: 'FAILED',
          message: smilePayResponse.statusMessage || 'Failed to initiate EcoCash payment',
        });
      }
    } catch {
      // Sandbox simulation
      await db.transactions.update(transaction.id, {
        transaction_reference: `ECO-SIM-${Date.now()}`,
      });

      return NextResponse.json({
        success: true,
        transaction_id: transaction.id,
        order_reference: orderReference,
        transaction_reference: `ECO-SIM-${Date.now()}`,
        status: 'PENDING',
        message: 'EcoCash payment initiated (sandbox mode). Simulating USSD prompt.',
      });
    }
  } catch (error) {
    console.error('EcoCash payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
