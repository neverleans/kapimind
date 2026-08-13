import { NextResponse } from 'next/server';
import { Strategy } from '@/lib/use-strategies';

const MOCK: Strategy[] = [
  {
    id: 'mock-pp-1',
    name: 'Permanent Portfolio 25/25/25/25',
    type: 'PERMANENT_PORTFOLIO',
    enabled: true,
    config: {
      allocation: { equity: 25, bonds: 25, gold: 25, cash: 25, reits: 0 },
      tickers: { equity: 'IVVB11', bonds: 'B5P211', gold: 'GOLD11', cash: 'TESOURO' },
      rebalanceThreshold: 0.05,
      rebalanceFrequency: 'quarterly',
    },
    createdAt: '2025-08-01T00:00:00Z',
  },
];

export async function GET() {
  // Fallback: API Nest não tem /strategy ainda. Devolve mock.
  return NextResponse.json({ strategies: MOCK });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Em produção: persistir via Prisma (Nest)
    const newStrategy: Strategy = {
      ...body,
      id: `mock-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    MOCK.push(newStrategy);
    return NextResponse.json(newStrategy, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_payload', message: err instanceof Error ? err.message : 'Erro' },
      { status: 400 },
    );
  }
}
