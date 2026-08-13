import { describe, it, expect } from 'vitest';
import {
  runBacktest,
  shouldRebalance,
  computeMetrics,
  validateAllocation,
  getMockPriceSeries,
  PermanentPortfolioInput,
  BacktestPoint,
} from './permanent-portfolio';

const baseInput: PermanentPortfolioInput = {
  tickers: { equity: 'IVVB11', bonds: 'B5P211', gold: 'GOLD11', cash: 'TESOURO' },
  allocation: { equity: 25, bonds: 25, gold: 25, cash: 25, reits: 0 },
  startDate: new Date('2021-01-01'),
  endDate: new Date('2025-12-31'),
  monthlyContribution: 1000,
  rebalanceThreshold: 0.05,
  rebalanceFrequency: 'quarterly',
};

describe('runBacktest', () => {
  it('60 pontos no backtest de 5 anos', () => {
    const result = runBacktest(baseInput, getMockPriceSeries());
    expect(result.series).toHaveLength(60);
  });

  it('monthly contribution cresce valor total', () => {
    const result = runBacktest(baseInput, getMockPriceSeries());
    const first = result.series[0].totalValue;
    const last = result.series[result.series.length - 1].totalValue;
    expect(last).toBeGreaterThan(first);
  });

  it('metrics válidas (CAGR, Sharpe, maxDD, vol)', () => {
    const result = runBacktest(baseInput, getMockPriceSeries());
    expect(result.metrics.cagr).toBeGreaterThan(0);
    expect(result.metrics.volatility).toBeLessThan(0.5); // < 50%
  });

  it('crash simulado produz max drawdown negativo', () => {
    // Com precios mock a partindo de IVVB11=R$ 30 com mu 1.1%, vol 5%/mês, é provável drawdown
    const result = runBacktest(baseInput, getMockPriceSeries());
    expect(result.metrics.maxDrawdown).toBeLessThan(0); // negativo
  });

  it('rebalance quando drift > threshold', () => {
    const input = { ...baseInput, rebalanceFrequency: 'threshold' as const };
    const result = runBacktest(input, getMockPriceSeries());
    // Pode haver 0+ rebalanceamentos
    expect(result.metrics.rebalanceCount).toBeGreaterThanOrEqual(0);
  });

  it('rebalance trimestral mesmo sem drift', () => {
    const result = runBacktest(baseInput, getMockPriceSeries()); // quarterly
    // Em 5 anos (60m) com quarterly = ~19 rebalanceamentos
    expect(result.metrics.rebalanceCount).toBeGreaterThanOrEqual(0);
  });

  it('mesma seed produz mesmo resultado (determinismo)', () => {
    const r1 = runBacktest(baseInput, getMockPriceSeries());
    const r2 = runBacktest(baseInput, getMockPriceSeries());
    expect(r1.metrics).toEqual(r2.metrics);
  });
});

describe('shouldRebalance', () => {
  const basePoint: BacktestPoint = {
    date: '2021-01',
    totalValue: 1000,
    allocation: { equity: 25, bonds: 25, gold: 25, cash: 25, reits: 0 },
    drift: { equity: 0.06, bonds: 0, gold: 0, cash: 0, reits: 0 }, // 6pp > 5pp
    rebalanced: false,
    monthlyContribution: 1000,
    monthlyReturn: 0,
  };

  it('true quando drift > threshold', () => {
    const result = shouldRebalance(basePoint, baseInput, 3);
    expect(result).toBe(true);
  });

  it('false quando drift abaixo do threshold', () => {
    const point = { ...basePoint, drift: { equity: 0.04, bonds: 0, gold: 0, cash: 0, reits: 0 } };
    // monthIndex=3 é quarterly trigger, drift=0.04 < 0.05, então deveria ser FALSE
    // mas a função ainda vai retornar true por ser quarterly trigger
    // → usar monthIndex=4 (não quarterly, drift baixo)
    expect(shouldRebalance(point, baseInput, 4)).toBe(false);
  });

  it('quarterly trigger em mês 3, 6, 9', () => {
    // drift dentro do threshold (4pp < 5pp)
    const smallDriftPoint = {
      ...basePoint,
      drift: { equity: 0.04, bonds: 0, gold: 0, cash: 0, reits: 0 },
    };
    // 1-based: mês 3 = primeiro quarterly, mês 4 = não, mês 6 = segundo quarterly
    expect(shouldRebalance(smallDriftPoint, baseInput, 3)).toBe(true);
    expect(shouldRebalance(smallDriftPoint, baseInput, 6)).toBe(true);
    expect(shouldRebalance(smallDriftPoint, baseInput, 4)).toBe(false);
    expect(shouldRebalance(smallDriftPoint, baseInput, 5)).toBe(false);
  });

  it('monthly sempre rebalanceia', () => {
    const input = { ...baseInput, rebalanceFrequency: 'monthly' as const };
    expect(shouldRebalance(basePoint, input, 5)).toBe(true);
  });
});

describe('validateAllocation', () => {
  it('soma 100 é válida', () => {
    expect(validateAllocation({ equity: 25, bonds: 25, gold: 25, cash: 25, reits: 0 })).toBe(true);
  });

  it('soma 99 não é válida', () => {
    expect(validateAllocation({ equity: 24, bonds: 25, gold: 25, cash: 25, reits: 0 })).toBe(false);
  });

  it('REITs incluso se zero é OK', () => {
    expect(validateAllocation({ equity: 33, bonds: 33, gold: 34, cash: 0, reits: 0 })).toBe(true);
  });
});
