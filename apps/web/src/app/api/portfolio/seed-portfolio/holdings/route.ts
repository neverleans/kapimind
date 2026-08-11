import { NextRequest, NextResponse } from 'next/server';

const PORTFOLIO_ID = 'seed-portfolio';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/portfolio/${PORTFOLIO_ID}/holdings`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    // Fallback mock
    return NextResponse.json([
      { id: '1', ticker: 'MXRF11', type: 'FII', quantity: 73, avgPrice: 9.7, lastPrice: 9.44, marketValue: 689.12, dividendYield: 12.66, pvp: 1.02 },
      { id: '2', ticker: 'VGHF11', type: 'FII', quantity: 58, avgPrice: 7.07, lastPrice: 5.19, marketValue: 301.02, dividendYield: 16.44, pvp: 0.63 },
      { id: '3', ticker: 'VGIA11', type: 'FIAGRO', quantity: 41, avgPrice: 9.95, lastPrice: 8.4, marketValue: 344.4, dividendYield: 19.67, pvp: 0.87 },
    ]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/portfolio/${PORTFOLIO_ID}/holdings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json(), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'fallback', message: err instanceof Error ? err.message : 'Erro' }, { status: 503 });
  }
}
