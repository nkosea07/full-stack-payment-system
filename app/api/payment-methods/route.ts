import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';

    const methods = activeOnly 
      ? await db.paymentMethods.findActive()
      : await db.paymentMethods.findAll();

    return NextResponse.json({
      success: true,
      payment_methods: methods.map((pm) => ({
        id: pm.id,
        name: pm.name,
        code: pm.code,
        is_active: pm.is_active,
      })),
    });
  } catch (error) {
    console.error('Payment methods fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const method = await db.paymentMethods.update(id, { is_active });

    if (!method) {
      return NextResponse.json(
        { success: false, message: 'Payment method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment_method: {
        id: method.id,
        name: method.name,
        code: method.code,
        is_active: method.is_active,
      },
    });
  } catch (error) {
    console.error('Payment method update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
