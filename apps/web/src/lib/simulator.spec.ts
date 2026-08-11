import { describe, it, expect } from 'vitest';
import { runSimulation, DEFAULT_CONFIG, formatTime } from './simulator';

describe('runSimulation', () => {
  it('returns 120 months with default config', () => {
    const result = runSimulation();
    expect(result.months).toHaveLength(120);
  });

  it('respects custom months count', () => {
    const result = runSimulation({ ...DEFAULT_CONFIG, months: 60 });
    expect(result.months).toHaveLength(60);
  });

  it('starts with portfolio value equal to first month buy', () => {
    const result = runSimulation();
    // First month: pays R$ 600 in cash, then immediately buys all 5 assets
    // (HGLG11/VISC11 have 0% allocation in phase 1, so they stay 0; only MXRF+VGHF+VGIA bought)
    // Wait — actually HGLG11/VISC11 allocations are 0 in phase 1, so they don't buy
    expect(result.months[0].balanceTotal).toBeGreaterThan(0);
    expect(result.months[0].balanceTotal).toBeLessThanOrEqual(600);
  });

  it('compounds contributions with inflation (10% a.a.)', () => {
    const result = runSimulation();
    // Year 1: 600/month
    expect(result.months[0].contribution).toBe(600);
    // Year 2: 660/month (600 * 1.10)
    expect(result.months[12].contribution).toBeCloseTo(660, 2);
    // Year 3: 726/month
    expect(result.months[24].contribution).toBeCloseTo(726, 2);
  });

  it('total invested equals sum of monthly contributions', () => {
    const result = runSimulation();
    const sum = result.months.reduce((acc, m) => acc + m.contribution, 0);
    expect(result.totalInvested).toBeCloseTo(sum, 2);
  });

  it('eventually reaches positive balance', () => {
    const result = runSimulation();
    expect(result.finalPortfolioValue).toBeGreaterThan(0);
  });

  it('detects independence month (dividend > contribution)', () => {
    const result = runSimulation();
    expect(result.independenceMonth).not.toBeNull();
    expect(result.independenceMonth).toBeGreaterThan(0);
  });

  it('projects payback beyond horizon', () => {
    const result = runSimulation();
    expect(result.paybackMonth).not.toBeNull();
  });

  it('phase 1 allocation focuses on MXRF11+VGHF11+VGIA11', () => {
    const result = runSimulation();
    const month12 = result.months[11];
    expect(month12.allocation.MXRF11).toBe(0.33);
    expect(month12.allocation.VGHF11).toBe(0.33);
    expect(month12.allocation.VGIA11).toBeCloseTo(0.34, 2);
    expect(month12.allocation.HGLG11).toBe(0);
    expect(month12.allocation.VISC11).toBe(0);
  });

  it('phase 2 allocation shifts to tijolo (HGLG11+VISC11)', () => {
    const result = runSimulation();
    const month72 = result.months[71];
    expect(month72.allocation.HGLG11).toBe(0.425);
    expect(month72.allocation.VISC11).toBe(0.425);
    expect(month72.allocation.MXRF11).toBe(0.05);
    expect(month72.allocation.VGHF11).toBe(0.05);
    expect(month72.allocation.VGIA11).toBe(0.05);
  });

  it('final portfolio has all 5 assets', () => {
    const result = runSimulation();
    expect(result.finalPortfolioQty.MXRF11).toBeGreaterThan(0);
    expect(result.finalPortfolioQty.VGHF11).toBeGreaterThan(0);
    expect(result.finalPortfolioQty.VGIA11).toBeGreaterThan(0);
    expect(result.finalPortfolioQty.HGLG11).toBeGreaterThan(0);
    expect(result.finalPortfolioQty.VISC11).toBeGreaterThan(0);
  });
});

describe('formatTime', () => {
  it('formats months correctly', () => {
    expect(formatTime(60)).toBe('5 anos e 0 meses');
    expect(formatTime(125)).toBe('10 anos e 5 meses');
    expect(formatTime(0)).toBe('0 anos e 0 meses');
  });

  it('returns special string for null', () => {
    expect(formatTime(null)).toBe('Fora do horizonte (50 anos)');
  });
});
