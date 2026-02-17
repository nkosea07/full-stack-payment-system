import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { SmilePayService, smilePayService } from '@/lib/services/smilepay';
import { ExpressCardRequest } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    const body: ExpressCardRequest = await request.json();

    // Validate required fields
    if (
      !body.amount ||
      !body.currency_code ||
      !body.customer ||
      !body.card_number ||
      !body.expiry_month ||
      !body.expiry_year ||
      !body.cvv ||
      !body.return_url ||
      !body.result_url
    ) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Basic card validation
    const cardNumber = body.card_number.replace(/\s/g, '');
    if (!/^[0-9]{13,19}$/.test(cardNumber)) {
      return NextResponse.json(
        { success: false, message: 'Invalid card number' },
        { status: 400 }
      );
    }

    if (!/^(0[1-9]|1[0-2])$/.test(body.expiry_month)) {
      return NextResponse.json(
        { success: false, message: 'Invalid expiry month' },
        { status: 400 }
      );
    }

    if (!/^[0-9]{2,4}$/.test(body.expiry_year)) {
      return NextResponse.json(
        { success: false, message: 'Invalid expiry year' },
        { status: 400 }
      );
    }

    if (!/^[0-9]{3,4}$/.test(body.cvv)) {
      return NextResponse.json(
        { success: false, message: 'Invalid CVV' },
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
      payment_method: 'VISA_MASTERCARD',
    });

    const smilePayRequest = {
      currencyCode: SmilePayService.formatCurrencyCode(body.currency_code),
      amount: body.amount,
      orderReference: orderReference,
      resultUrl: body.result_url,
      returnUrl: body.return_url,
      cardNumber: cardNumber,
      expiryMonth: body.expiry_month,
      expiryYear: body.expiry_year.length === 2 ? `20${body.expiry_year}` : body.expiry_year,
      cvv: body.cvv,
      customer: {
        firstName: body.customer.first_name,
        lastName: body.customer.last_name,
        emailAddress: body.customer.email,
        phoneNumber: body.customer.phone,
      },
    };

    try {
      const smilePayResponse = await smilePayService.expressCheckoutCard(smilePayRequest);

      if (smilePayResponse.statusCode === '200') {
        await db.transactions.update(transaction.id, {
          transaction_reference: smilePayResponse.transactionReference,
        });

        // Check if 3DS redirect is needed
        if (smilePayResponse.redirectHtml) {
          return NextResponse.json({
            success: true,
            transaction_id: transaction.id,
            order_reference: orderReference,
            transaction_reference: smilePayResponse.transactionReference,
            status: 'PENDING',
            redirect_html: smilePayResponse.redirectHtml,
            message: 'Card payment initiated. 3DS verification required.',
          });
        }

        return NextResponse.json({
          success: true,
          transaction_id: transaction.id,
          order_reference: orderReference,
          transaction_reference: smilePayResponse.transactionReference,
          status: 'PENDING',
          message: 'Card payment initiated successfully.',
        });
      } else {
        await db.transactions.update(transaction.id, { status: 'FAILED' });

        return NextResponse.json({
          success: false,
          transaction_id: transaction.id,
          order_reference: orderReference,
          status: 'FAILED',
          message: smilePayResponse.statusMessage || 'Failed to initiate card payment',
        });
      }
    } catch {
      // Sandbox simulation - simulate 3DS flow
      await db.transactions.update(transaction.id, {
        transaction_reference: `CARD-SIM-${Date.now()}`,
      });

      return NextResponse.json({
        success: true,
        transaction_id: transaction.id,
        order_reference: orderReference,
        transaction_reference: `CARD-SIM-${Date.now()}`,
        status: 'PENDING',
        message: 'Card payment initiated (sandbox mode).',
      });
    }
  } catch (error) {
    console.error('Card payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
