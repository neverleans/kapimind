/**
 * API route para Piotroski F-Score.
 * No MVP, retorna dados mock (waiting para integração com brapi.dev real).
 * Em produção: integrar com brapi.dev/quote/{ticker} (incomeStatement, balanceSheet, cashFlow).
 */

import { NextResponse } from 'next/server';
import { computeFScore } from '@/lib/piotroski';

export async function GET(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;

  // Mock data — TODO: integrar com brapi.dev
  const mockData = {
    netIncome: 100_000_000,
    netIncomePrevYear: 80_000_000,
    totalAssets: 1_000_000_000,
    roa: 0.10,
    roaPrevYear: 0.08,
    cashFlowFromOperations: 150_000_000,
    totalLiabilities: 400_000_000,
    totalLiabilitiesPrevYear: 500_000_000,
    sharesOutstanding: 100_000_000,
    sharesOutstandingPrevYear: 100_000_000,
    grossMargin: 0.40,
    grossMarginPrevYear: 0.38,
    assetTurnover: 1.2,
    assetTurnoverPrevYear: 1.0,
  };

  const result = computeFScore(mockData);
  return NextResponse.json({
    ticker: ticker.toUpperCase(),
    source: 'mock',
    note: 'Dados mockados. Integracao real com brapi.dev planejada.',
    ...result,
  });
}
