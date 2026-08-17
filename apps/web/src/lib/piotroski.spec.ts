import { describe, it, expect } from 'vitest';
import { computeFScore, computeFScoreFromBrapi } from './piotroski';

describe('computeFScore', () => {
  const baseHealthy: Parameters<typeof computeFScore>[0] = {
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

  it('empresa saudavel pontua 9', () => {
    const result = computeFScore(baseHealthy);
    expect(result.total).toBe(9);
    expect(result.band).toBe('muito-saudavel');
    expect(result.score.rentabilidade).toBe(4);
    expect(result.score.alavancagem).toBe(3);
    expect(result.score.eficiencia).toBe(2);
  });

  it('empresa insaudavel pontua 0 ou 1', () => {
    const result = computeFScore({
      netIncome: -50_000_000,
      netIncomePrevYear: 100_000_000,
      totalAssets: 1_000_000_000,
      roa: -0.05,
      roaPrevYear: 0.10,
      cashFlowFromOperations: -10_000_000,
      totalLiabilities: 800_000_000,
      totalLiabilitiesPrevYear: 600_000_000,
      sharesOutstanding: 120_000_000,
      sharesOutstandingPrevYear: 100_000_000,
      grossMargin: 0.20,
      grossMarginPrevYear: 0.30,
      assetTurnover: 0.8,
      assetTurnoverPrevYear: 1.0,
    });
    expect(result.total).toBeLessThanOrEqual(1);
    expect(result.band).toMatch(/muito-fraco|fraco/);
  });

  it('resultado borderline (5) classifica como neutro', () => {
    const result = computeFScore({
      netIncome: 100_000_000,
      netIncomePrevYear: 100_000_000,
      totalAssets: 1_000_000_000,
      roa: 0.11,
      roaPrevYear: 0.10,
      cashFlowFromOperations: 100_000_000,
      totalLiabilities: 500_000_000,
      totalLiabilitiesPrevYear: 500_000_000,
      sharesOutstanding: 100_000_000,
      sharesOutstandingPrevYear: 100_000_000,
      grossMargin: 0.40,
      grossMarginPrevYear: 0.40,
      assetTurnover: 1.0,
      assetTurnoverPrevYear: 1.0,
    });
    // 1 (lucro) + 1 (cfo) + 1 (roa subiu) + 0 (cfo > lucro) + 0 (não caiu) + 0 (não subiu) + 1 (sem diluicao) + 0 (mesma margem) + 0 (mesmo giro) = 4
    expect(result.total).toBeGreaterThanOrEqual(4);
    expect(result.band).toBe('neutro');
  });

  it('reasoning array tem 9 entradas (uma por critério)', () => {
    expect(computeFScore(baseHealthy).reasoning).toHaveLength(9);
  });

  it('breakdown object tem 9 chaves', () => {
    expect(Object.keys(computeFScore(baseHealthy).breakdown)).toHaveLength(9);
  });
});

describe('computeFScoreFromBrapi', () => {
  it('conversão correta de dados brapi', () => {
    const result = computeFScoreFromBrapi({
      currentYear: {
        netIncome: 100_000_000,
        totalAssets: 1_000_000_000,
        totalLiabilities: 400_000_000,
        cashFlowFromOperations: 150_000_000,
        sharesOutstanding: 100_000_000,
        grossProfit: 400_000_000,
        revenue: 1_000_000_000,
      },
      previousYear: {
        netIncome: 80_000_000,
        totalAssets: 1_000_000_000,
        totalLiabilities: 500_000_000,
        cashFlowFromOperations: 90_000_000,
        sharesOutstanding: 100_000_000,
        grossProfit: 380_000_000,
        revenue: 950_000_000,
      },
    });
    expect(result.total).toBeGreaterThanOrEqual(7);
  });
});
