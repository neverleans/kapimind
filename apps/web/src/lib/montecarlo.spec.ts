import { describe, it, expect } from 'vitest';
import { runMonteCarlo, buildFanChartData, mulberry32, randn } from './montecarlo';

describe('mulberry32', () => {
  it('determinista com mesma seed', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    const seq1 = Array.from({ length: 5 }, () => r1());
    const seq2 = Array.from({ length: 5 }, () => r2());
    expect(seq1).toEqual(seq2);
  });

  it('valores uniformes [0,1)', () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('seeds diferentes produzem sequencias diferentes', () => {
    const seq1 = Array.from({ length: 3 }, () => mulberry32(1)());
    const seq2 = Array.from({ length: 3 }, () => mulberry32(2)());
    expect(seq1).not.toEqual(seq2);
  });
});

describe('randn', () => {
  it('distribuição não vaza muito (1000 amostras)', () => {
    const samples = Array.from({ length: 1000 }, () => randn());
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const std = Math.sqrt(
      samples.reduce((sum, x) => sum + (x - mean) ** 2, 0) / samples.length,
    );
    expect(Math.abs(mean)).toBeLessThan(0.2); // esperado ~0
    expect(std).toBeGreaterThan(0.8); // esperado ~1
    expect(std).toBeLessThan(1.2);
  });
});

describe('runMonteCarlo', () => {
  it('1000 simulações com seed = resultados determinísticas', () => {
    const a = runMonteCarlo({
      initialValue: 10_000,
      monthlyContribution: 500,
      years: 5,
      simulations: 1000,
      expectedReturn: 0.10,
      volatility: 0.15,
      seed: 42,
    });
    const b = runMonteCarlo({
      initialValue: 10_000,
      monthlyContribution: 500,
      years: 5,
      simulations: 1000,
      expectedReturn: 0.10,
      volatility: 0.15,
      seed: 42,
    });
    expect(a.finalValueByPath).toEqual(b.finalValueByPath);
    expect(a.percentiles.p50).toBeCloseTo(b.percentiles.p50, 2);
  });

  it('mediana cresce significativamente com aporte mensal', () => {
    const semAporte = runMonteCarlo({
      initialValue: 10_000,
      monthlyContribution: 0,
      years: 10,
      simulations: 1000,
      expectedReturn: 0.10,
      volatility: 0.20,
      seed: 42,
    });
    const comAporte = runMonteCarlo({
      initialValue: 10_000,
      monthlyContribution: 500,
      years: 10,
      simulations: 1000,
      expectedReturn: 0.10,
      volatility: 0.20,
      seed: 42,
    });
    expect(comAporte.percentiles.p50).toBeGreaterThan(semAporte.percentiles.p50);
  });

  it('percentis respeitam ordem (p5 < p25 < p50 < p75 < p95)', () => {
    const result = runMonteCarlo({
      initialValue: 10_000,
      monthlyContribution: 500,
      years: 10,
      simulations: 1000,
      expectedReturn: 0.10,
      volatility: 0.20,
      seed: 42,
    });
    const { p5, p25, p50, p75, p95 } = result.percentiles;
    expect(p5).toBeLessThan(p25);
    expect(p25).toBeLessThan(p50);
    expect(p50).toBeLessThan(p75);
    expect(p75).toBeLessThan(p95);
  });

  it('successRate alto para portfolio conservador (baixa vol)', () => {
    const result = runMonteCarlo({
      initialValue: 10_000,
      monthlyContribution: 500,
      years: 5,
      simulations: 1000,
      expectedReturn: 0.10,
      volatility: 0.05, // baixa vol
      seed: 42,
    });
    expect(result.successRate).toBeGreaterThan(0.9);
  });

  it('successRate varia com parametros', () => {
    const conservador = runMonteCarlo({
      initialValue: 10_000,
      monthlyContribution: 500,
      years: 5,
      simulations: 1000,
      expectedReturn: 0.10,
      volatility: 0.05,
      seed: 42,
    });
    const agressivo = runMonteCarlo({
      initialValue: 10_000,
      monthlyContribution: 500,
      years: 5,
      simulations: 1000,
      expectedReturn: 0.10,
      volatility: 0.40,
      seed: 42,
    });
    // Vol maior = mais dispersão
    expect(agressivo.percentiles.p95 - agressivo.percentiles.p5).toBeGreaterThan(
      conservador.percentiles.p95 - conservador.percentiles.p5,
    );
  });

  it('valor final tende a crescer com mais contribuicoes (sem garantia em choques extremos)', () => {
    const result = runMonteCarlo({
      initialValue: 10_000,
      monthlyContribution: 500,
      years: 10,
      simulations: 100,
      expectedReturn: 0.10,
      volatility: 0.20,
      seed: 42,
    });
    // Mediana final > valor inicial + soma dos aportes em 80% dos casos
    const p50 = result.percentiles.p50;
    const funded = 10_000 + 500 * 12 * 10; // 70k
    expect(p50).toBeGreaterThan(funded);
  });
});

describe('buildFanChartData', () => {
  it('gera 1 entrada por ano (years + 1)', () => {
    const result = runMonteCarlo({
      initialValue: 1_000,
      monthlyContribution: 0,
      years: 5,
      simulations: 100,
      expectedReturn: 0.10,
      volatility: 0.15,
      seed: 42,
    });
    const data = buildFanChartData(result);
    expect(data).toHaveLength(6); // 0 a 5 inclusive
    expect(data[0].year).toBe(0);
    expect(data[5].year).toBe(5);
  });

  it('percentis respeitam ordem em cada ano', () => {
    const result = runMonteCarlo({
      initialValue: 1_000,
      monthlyContribution: 100,
      years: 5,
      simulations: 100,
      expectedReturn: 0.10,
      volatility: 0.15,
      seed: 42,
    });
    const data = buildFanChartData(result);
    for (const pt of data) {
      expect(pt.p5).toBeLessThanOrEqual(pt.p25);
      expect(pt.p25).toBeLessThanOrEqual(pt.p50);
      expect(pt.p50).toBeLessThanOrEqual(pt.p75);
      expect(pt.p75).toBeLessThanOrEqual(pt.p95);
    }
  });
});
