import { describe, it, expect } from 'vitest';
import { computeVaR, computeDailyReturns, computeVaRMatrix, generateMockReturns, quantile } from './var';

describe('computeDailyReturns', () => {
  it('calcula retornos diários corretamente', () => {
    const returns = computeDailyReturns([100, 110, 99, 105]);
    expect(returns).toHaveLength(3);
    expect(returns[0]).toBeCloseTo(0.10, 5); // 110/100 - 1
    expect(returns[1]).toBeCloseTo(-0.10, 5); // 99/110 - 1
    expect(returns[2]).toBeCloseTo(0.0606, 3); // 105/99 - 1
  });

  it('ignora divisão por zero', () => {
    const returns = computeDailyReturns([0, 100, 110]);
    // [100, 110] → 100/0 = Infinity pulado, 110/100 = 0.1
    expect(returns).toHaveLength(1);
    expect(returns[0]).toBeCloseTo(0.1, 5);
  });
});

describe('quantile', () => {
  it('quantile 50% (mediana) de [1,2,3,4,5] = 3', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3);
  });

  it('quantile 95% acima de 20% do menor para array completo', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const q95 = quantile(values, 0.95);
    expect(q95).toBeGreaterThan(90);
  });

  it('array vazio = 0', () => {
    expect(quantile([], 0.5)).toBe(0);
  });
});

describe('computeVaR', () => {
  it('VaR 95% calculado para portfolio de R$ 100k', () => {
    const series = generateMockReturns(12, 42);
    const result = computeVaR(series, 100_000, { confidence: 0.95, windowDays: 100 });
    expect(result.confidence).toBe(0.95);
    expect(result.sampleSize).toBe(100);
    expect(result.varLoss).toBeGreaterThan(0);
    expect(result.cvarLoss).toBeGreaterThanOrEqual(result.varLoss); // CVaR >= VaR
    expect(result.varPercent).toBeGreaterThan(0);
    expect(result.varPercent).toBeLessThan(0.2); // VaR diário < 20%
  });

  it('VaR 99% >= VaR 95% (mais conservador em cauda)', () => {
    const series = generateMockReturns(12, 42);
    const var95 = computeVaR(series, 100_000, { confidence: 0.95 });
    const var99 = computeVaR(series, 100_000, { confidence: 0.99 });
    expect(var99.varLoss).toBeGreaterThan(var95.varLoss);
    expect(var99.cvarPercent).toBeGreaterThanOrEqual(var99.varPercent);
  });

  it('CVaR sempre >= VaR (esperanca de shortfall)', () => {
    const series = generateMockReturns(12, 42);
    const result = computeVaR(series, 100_000, { confidence: 0.95 });
    expect(result.cvarLoss).toBeGreaterThanOrEqual(result.varLoss);
  });

  it('portfolio igual a 0 retorna zeros', () => {
    const series = generateMockReturns(12, 42);
    const result = computeVaR(series, 0, { confidence: 0.95 });
    expect(result.varLoss).toBe(0);
    expect(result.cvarLoss).toBe(0);
  });
});

describe('computeVaRMatrix', () => {
  it('retorna VaR para 95% e 99%', () => {
    const series = generateMockReturns(12, 42);
    const matrix = computeVaRMatrix(series, 100_000);
    expect(matrix).toHaveLength(2);
    expect(matrix.map((r) => r.confidence)).toEqual([0.95, 0.99]);
  });
});

describe('generateMockReturns', () => {
  it('deterministico (mesma seed = mesmos retornos)', () => {
    const r1 = generateMockReturns(6, 123);
    const r2 = generateMockReturns(6, 123);
    expect(r1.values).toEqual(r2.values);
  });

  it('gera ~252 valores para 12 meses', () => {
    const series = generateMockReturns(12);
    expect(series.values.length).toBeGreaterThan(200);
    expect(series.dates.length).toBe(series.values.length);
  });
});
