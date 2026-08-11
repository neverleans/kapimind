import { NextResponse } from 'next/server';

const PORTFOLIO_ID = 'seed-portfolio';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/portfolio/${PORTFOLIO_ID}/summary`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    // Fallback calculado do mock
    const holdings = [
      { quantity: 73, avgPrice: 9.7, lastPrice: 9.44 },
      { quantity: 58, avgPrice: 7.07, lastPrice: 5.19 },
      { quantity: 41, avgPrice: 9.95, lastPrice: 8.4 },
    ];
    const totalInvested = holdings.reduce((acc, h) => acc + h.quantity * h.avgPrice, 0);
    const totalValue = holdings.reduce((acc, h) => acc + h.quantity * (h.lastPrice ?? h.avgPrice), 0);
    return NextResponse.json({
      portfolioId: PORTFOLIO_ID,
      totalInvested: totalInvested.toFixed(2),
      totalValue: totalValue.toFixed(2),
      totalDividends: '12.50',
      pnl: (totalValue - totalInvested).toFixed(2),
      pnlPct: (((totalValue - totalInvested) / totalInvested) * 100).toFixed(2),
      holdingsCount: holdings.length,
    });
  }
}
