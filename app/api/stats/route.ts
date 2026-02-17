import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const stats = await db.stats.getOverview();

    return NextResponse.json({
      success: true,
      stats: {
        total_transactions: stats.totalTransactions,
        total_amount: stats.totalAmount,
        paid_transactions: stats.paidTransactions,
        pending_transactions: stats.pendingTransactions,
        failed_transactions: stats.failedTransactions,
        success_rate: stats.totalTransactions > 0 
          ? ((stats.paidTransactions / stats.totalTransactions) * 100).toFixed(2)
          : '0.00',
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
