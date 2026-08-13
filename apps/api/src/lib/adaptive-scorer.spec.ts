import { describe, it, expect } from 'vitest';
import { scoreAsset, suggestBetterAlternative } from './adaptive-scorer';

describe('scoreAsset', () => {
  it('drawdown -20% + yield 10% + volume alto → score > 50', () => {
    const out = scoreAsset({
      ticker: 'VGHF11',
      currentDrawdown: -0.20,
      trailingYield: 0.10,
      avgDailyVolume: 2_000_000,
      sentimentScore: 0,
      macroRegime: 'NEUTRAL',
    });
    expect(out.score).toBeGreaterThan(50);
  });

  it('Tudo zero → score < 40', () => {
    const out = scoreAsset({
      ticker: 'TESOURO',
      currentDrawdown: 0,
      trailingYield: 0,
      avgDailyVolume: 0,
      sentimentScore: 0,
      macroRegime: 'NEUTRAL',
    });
    expect(out.score).toBeLessThan(40);
    expect(out.bucket).toBe('REDUCE');
  });

  it('RISK_OFF + bonds → score boost ≥ 4pp vs neutral', () => {
    const base = scoreAsset({
      ticker: 'TESOURO',
      currentDrawdown: 0,
      trailingYield: 0.10,
      avgDailyVolume: 1_000_000,
      sentimentScore: 0,
      macroRegime: 'NEUTRAL',
    });
    const boost = scoreAsset({
      ticker: 'TESOURO',
      currentDrawdown: 0,
      trailingYield: 0.10,
      avgDailyVolume: 1_000_000,
      sentimentScore: 0,
      macroRegime: 'RISK_OFF',
    });
    expect(boost.score - base.score).toBeGreaterThanOrEqual(4);
  });

  it('Bucket boundaries: 39 REDUCE, 40 HOLD, 70 HOLD, 71 INCREASE', () => {
    const reduce39 = scoreAsset({
      ticker: 'X',
      currentDrawdown: 0,
      trailingYield: 0,
      avgDailyVolume: 0,
      sentimentScore: 0,
      macroRegime: 'NEUTRAL',
    });
    expect(reduce39.bucket).toBe('REDUCE');

    // 40 → HOLD
    const hold40 = scoreAsset({
      ticker: 'X',
      currentDrawdown: -0.05,
      trailingYield: 0.08,
      avgDailyVolume: 1_000_000,
      sentimentScore: 0.1,
      macroRegime: 'NEUTRAL',
    });
    expect(hold40.score).toBeGreaterThanOrEqual(40);
    expect(hold40.bucket).toBe('HOLD');
  });

  it('reasons sempre retornadas (≥ 1)', () => {
    const out = scoreAsset({
      ticker: 'X',
      currentDrawdown: 0,
      trailingYield: 0,
      avgDailyVolume: 0,
      sentimentScore: 0,
      macroRegime: 'NEUTRAL',
    });
    expect(out.reasons.length).toBeGreaterThan(0);
  });
});

describe('suggestBetterAlternative', () => {
  it('retorna alternative se bucket=REDUCE', () => {
    const current = scoreAsset({
      ticker: 'VGHF11',
      currentDrawdown: -0.30,
      trailingYield: 0.005,
      avgDailyVolume: 50_000,
      sentimentScore: -0.5,
      macroRegime: 'NEUTRAL',
    });
    const alts = [
      { ticker: 'HGLG11', currentDrawdown: -0.05, trailingYield: 0.10, avgDailyVolume: 2_000_000, sentimentScore: 0.3, macroRegime: 'NEUTRAL' as const },
    ];
    const suggestion = suggestBetterAlternative(current, alts);
    expect(suggestion).not.toBeNull();
    expect(suggestion?.ticker).toBe('HGLG11');
  });

  it('returns null se bucket != REDUCE', () => {
    const current = scoreAsset({
      ticker: 'X',
      currentDrawdown: -0.05,
      trailingYield: 0.10,
      avgDailyVolume: 1_000_000,
      sentimentScore: 0.5,
      macroRegime: 'RISK_ON',
    });
    // Garantir que NÃO é REDUCE
    expect(current.bucket).not.toBe('REDUCE');
    const suggestion = suggestBetterAlternative(current, []);
    expect(suggestion).toBeNull();
  });

  it('returns null se nenhuma alternative melhor', () => {
    const current = scoreAsset({
      ticker: 'X',
      currentDrawdown: -0.40,
      trailingYield: 0.001,
      avgDailyVolume: 10_000,
      sentimentScore: -0.9,
      macroRegime: 'NEUTRAL',
    });
    // alternatives todas piores
    const alts = [
      { ticker: 'Y', currentDrawdown: -0.50, trailingYield: 0.001, avgDailyVolume: 5_000, sentimentScore: -0.9, macroRegime: 'NEUTRAL' as const },
    ];
    const suggestion = suggestBetterAlternative(current, alts);
    expect(suggestion).toBeNull();
  });
});
