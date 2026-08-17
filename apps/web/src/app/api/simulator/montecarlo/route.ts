import { NextResponse } from 'next/server';
import { runMonteCarlo, buildFanChartData, FanChartData } from '@/lib/montecarlo';

export async function GET() {
  // Mock: portfolio de R$ 10k com R$ 500/mes por 10 anos
  const result = runMonteCarlo({
    initialValue: 10_000,
    monthlyContribution: 500,
    years: 10,
    simulations: 1000,
    expectedReturn: 0.10,
    volatility: 0.18,
    seed: 42,
  });

  const fanChart: FanChartData[] = buildFanChartData(result);

  return NextResponse.json({
    initialValue: result.initialValue,
    totalContributed: result.totalContributed,
    finalValueMedian: result.percentiles.p50,
    finalValueP5: result.percentiles.p5,
    finalValueP95: result.percentiles.p95,
    confidence95: result.confidence95,
    successRate: result.successRate,
    fanChart,
    durationMs: result.duration,
    source: 'mock',
    note: 'Monte Carlo GBM puro em TypeScript. Em producao, usar serie historica real do portfolio.',
  });
}
