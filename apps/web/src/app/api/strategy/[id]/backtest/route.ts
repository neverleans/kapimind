import { NextResponse } from 'next/server';
import { runBacktest, getMockPriceSeries, PermanentPortfolioInput, PriceBar } from '@/lib/permanent-portfolio';
import { historicalBatch, BrapiHistorical } from '@/lib/brapi';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { startDate, endDate, monthlyContribution } = body as {
      startDate?: string;
      endDate?: string;
      monthlyContribution?: number;
    };

    // Config padrão para MVP (Permanent Portfolio)
    const tickers = ['IVVB11', 'B5P211', 'GOLD11', 'TESOURO'];
    const input: PermanentPortfolioInput = {
      tickers: { equity: 'IVVB11', bonds: 'B5P211', gold: 'GOLD11', cash: 'TESOURO' },
      allocation: { equity: 25, bonds: 25, gold: 25, cash: 25, reits: 0 },
      startDate: startDate ? new Date(startDate) : new Date('2021-01-01'),
      endDate: endDate ? new Date(endDate) : new Date('2025-12-31'),
      monthlyContribution: monthlyContribution ?? 1000,
      rebalanceThreshold: 0.05,
      rebalanceFrequency: 'quarterly',
    };

    // Tentar fetch real da brapi; cair em mock se falhar
    let priceSeries: Map<string, PriceBar[]>;
    let source: 'brapi' | 'mock' = 'mock';
    try {
      if (process.env.BRAPI_API_KEY) {
        const brapiData = await historicalBatch(tickers, input.startDate, input.endDate);
        const converted = new Map<string, PriceBar[]>();
        for (const [ticker, series] of brapiData) {
          converted.set(
            ticker,
            series.map((p) => ({ date: p.date.slice(0, 7), close: p.close })),
          );
        }
        // Se algum ticker retornou vazio, cai em mock para todos
        const allEmpty = Array.from(converted.values()).every((s) => s.length === 0);
        if (allEmpty) {
          priceSeries = getMockPriceSeries();
        } else {
          priceSeries = converted;
          source = 'brapi';
        }
      } else {
        priceSeries = getMockPriceSeries();
      }
    } catch {
      priceSeries = getMockPriceSeries();
    }

    const t0 = Date.now();
    const result = runBacktest(input, priceSeries);
    const durationMs = Date.now() - t0;

    return NextResponse.json({
      backtestId: `mock-${id}-${Date.now()}`,
      source,
      durationMs,
      metrics: result.metrics,
      series: result.series,
      config: result.config,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'backtest_failed', message: err instanceof Error ? err.message : 'Erro' },
      { status: 500 },
    );
  }
}
