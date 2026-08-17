/**
 * API route para VaR/CVaR.
 * No MVP, usa mock deterministico (gerador de retornos).
 * Em produção: enviar série real do portfolio via Prisma.
 */

import { NextResponse } from 'next/server';
import { computeVaRMatrix, generateMockReturns, interpretVaR } from '@/lib/var';

export async function GET() {
  // Mock: portfolio de R$ 100k com 1 ano de retornos historicos
  const portfolioValue = 100_000;
  const series = generateMockReturns(12, 42); // 12 meses

  const matrix = computeVaRMatrix(series, portfolioValue, 252);

  return NextResponse.json({
    portfolioValue,
    windowDays: 252,
    results: matrix.map((r) => ({
      confidence: r.confidence,
      var: r.varLoss,
      varPercent: r.varPercent,
      cvar: r.cvarLoss,
      cvarPercent: r.cvarPercent,
      sampleSize: r.sampleSize,
      interpretation: interpretVaR(r.varPercent, r.confidence),
    })),
    source: 'mock',
    note: 'Serie de retornos mockada. Em producao, usar dados reais do portfolio via Prisma.',
  });
}
