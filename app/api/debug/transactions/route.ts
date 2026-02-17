import { NextResponse } from 'next/server';
import { db, ensureDatabaseInitialized } from '@/lib/db';

export async function GET() {
  try {
    await ensureDatabaseInitialized();
    
    const transactions = await db.transactions.findAll();
    return NextResponse.json({
      success: true,
      count: transactions.length,
      transactions: transactions.map(tx => ({
        id: tx.id,
        order_reference: tx.order_reference,
        status: tx.status,
        amount: tx.amount,
        currency_code: tx.currency_code,
        created_at: tx.created_at
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, message: 'Debug error' },
      { status: 500 }
    );
  }
}
