import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function GET(req: NextRequest, { params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const portfolioId = req.nextUrl.searchParams.get('portfolioId') ?? 'seed-portfolio';
  try {
    const res = await fetch(`${API_BASE}/ir/${year}?portfolioId=${portfolioId}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    // Fallback mock
    return NextResponse.json({
      year: Number(year),
      portfolioId,
      totalTransactions: 0,
      totalBuys: 0,
      totalSells: 0,
      totalDividends: 0,
      totalBuyAmount: 0,
      totalSellAmount: 0,
      totalDividendAmount: 0,
      totalIrDue: 0,
      monthlyExemption: 20000,
      taxRate: 0.15,
      monthsOverExemption: [],
      transactions: [],
    });
  }
}
