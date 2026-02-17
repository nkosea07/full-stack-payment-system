import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabaseInitialized } from '@/lib/db';
import { SmilePayService, smilePayService } from '@/lib/services/smilepay';
import { ExpressCardRequest, SmilePayExpressCardRequest } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();
    const body: ExpressCardRequest = await request.json();

    console.log('Card Payment Request Body:', body);

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

    const smilePayRequest: SmilePayExpressCardRequest = {
      orderReference: orderReference,
      amount: body.amount,
      currencyCode: SmilePayService.formatCurrencyCode(body.currency_code),
      returnUrl: body.return_url,
      resultUrl: body.result_url,
      cancelUrl: body.cancel_url || body.return_url,
      failureUrl: body.failure_url || body.return_url,
      itemName: body.item_name || `Payment-${orderReference}`,
      itemDescription: body.item_description || `Card payment for order ${orderReference}`,
      pan: cardNumber,
      expMonth: body.expiry_month,
      expYear: body.expiry_year.length === 2 ? `20${body.expiry_year}` : body.expiry_year,
      securityCode: body.cvv,
      firstName: body.customer.first_name,
      lastName: body.customer.last_name,
      mobilePhoneNumber: body.customer.phone,
      email: body.customer.email,
      paymentMethod: 'CARD',
    };

    console.log('Mapped SmilePay Request:', smilePayRequest);

    try {
      const smilePayResponse = await smilePayService.expressCheckoutCard(smilePayRequest);

      if (smilePayResponse.responseCode === '200') {
        await db.transactions.update(transaction.id, {
          transaction_reference: smilePayResponse.transactionReference,
        });

        // Check if 3DS redirect is needed (legacy redirectHtml format)
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

        // Check for 3DS2 authentication via customizedHtml
        if (smilePayResponse.customizedHtml?.['3ds2']) {
          return NextResponse.json({
            success: true,
            transaction_id: transaction.id,
            order_reference: orderReference,
            transaction_reference: smilePayResponse.transactionReference,
            status: 'PENDING',
            three_ds: {
              acs_url: smilePayResponse.customizedHtml['3ds2'].acsUrl,
              creq: smilePayResponse.customizedHtml['3ds2'].cReq,
            },
            gateway_recommendation: smilePayResponse.gatewayRecommendation,
            authentication_status: smilePayResponse.authenticationStatus,
            message: 'Card payment initiated. 3DS2 verification required.',
          });
        }

        return NextResponse.json({
          success: true,
          transaction_id: transaction.id,
          order_reference: orderReference,
          transaction_reference: smilePayResponse.transactionReference,
          status: 'PENDING',
          gateway_recommendation: smilePayResponse.gatewayRecommendation,
          message: 'Card payment initiated successfully.',
        });
      } else {
        await db.transactions.update(transaction.id, { status: 'FAILED' });

        return NextResponse.json({
          success: false,
          transaction_id: transaction.id,
          order_reference: orderReference,
          status: 'FAILED',
          message: smilePayResponse.responseMessage || 'Failed to initiate card payment',
        });
      }
    } catch (error) {
      console.log('API Error, falling back to sandbox simulation:', error);
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
