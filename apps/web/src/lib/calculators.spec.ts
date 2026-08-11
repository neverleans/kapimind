import { describe, it, expect } from 'vitest';
import { calculateRendaAlvo, calculateAporteExtra, calculateProgressMeta } from './calculators';

describe('calculateRendaAlvo', () => {
  it('returns portfolio required for target income', () => {
    const out = calculateRendaAlvo({
      targetMonthlyIncome: 3000,
      annualDividendYield: 0.12,
      annualReturn: 0.08,
      years: 10,
    });
    // 3000 * 12 / 0.12 = 300.000
    expect(out.portfolioRequired).toBe(300000);
    expect(out.finalAnnualIncome).toBeGreaterThan(30000);
  });

  it('monthly investment is positive', () => {
    const out = calculateRendaAlvo({
      targetMonthlyIncome: 5000,
      annualDividendYield: 0.10,
      annualReturn: 0.10,
      years: 20,
    });
    expect(out.monthlyInvestment).toBeGreaterThan(0);
  });
});

describe('calculateAporteExtra', () => {
  it('calculates extra contribution gain', () => {
    const out = calculateAporteExtra({
      currentMonthly: 600,
      extraMonthly: 900,
      years: 10,
      annualReturn: 0.10,
    });
    expect(out.finalCurrent).toBeGreaterThan(0);
    expect(out.finalExtra).toBeGreaterThan(0);
    expect(out.finalExtra).toBeGreaterThan(out.finalCurrent * 1.5 - 1);
  });

  it('extra gain compounds over time', () => {
    const a = calculateAporteExtra({ currentMonthly: 600, extraMonthly: 0, years: 10, annualReturn: 0.10 });
    const b = calculateAporteExtra({ currentMonthly: 600, extraMonthly: 600, years: 10, annualReturn: 0.10 });
    // Mesma baseline → finalCurrent identico
    expect(b.finalCurrent).toBeCloseTo(a.finalCurrent, 2);
    // Extra contribuição é profit
    expect(b.extraGain).toBeGreaterThan(0);
    expect(b.roi).toBeGreaterThan(0);
  });
});

describe('calculateProgressMeta', () => {
  it('computes progress percentage', () => {
    const out = calculateProgressMeta({
      targetMonthly: 1500,
      currentMonthly: 600,
      expectedRaise: 0.10,
    });
    expect(out.progress).toBe(40);
    expect(out.remaining).toBe(900);
  });

  it('months to goal is finite', () => {
    const out = calculateProgressMeta({
      targetMonthly: 1500,
      currentMonthly: 600,
      expectedRaise: 0.10,
    });
    expect(out.monthsToGoal).toBeGreaterThan(0);
    expect(out.monthsToGoal).toBeLessThan(120);
  });

  it('returns 0 months if already at goal', () => {
    const out = calculateProgressMeta({
      targetMonthly: 1500,
      currentMonthly: 1500,
      expectedRaise: 0.10,
    });
    expect(out.monthsToGoal).toBe(0);
  });
});
