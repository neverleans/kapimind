import { NextRequest, NextResponse } from 'next/server';

const PORTFOLIO_ID = 'seed-portfolio';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  try {
    const res = await fetch(`${API_BASE}/portfolio/${PORTFOLIO_ID}/holdings/${ticker}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json({ ticker, deleted: true });
  } catch (err) {
    return NextResponse.json({ error: 'fallback', message: err instanceof Error ? err.message : 'Erro' }, { status: 503 });
  }
}
