import { describe, it, expect } from 'vitest';
import { computeSuitability, SuitabilityGate } from './suitability';

describe('computeSuitability', () => {
  it('conservador puro (capac. zero, sem exp)', () => {
    const r = computeSuitability({
      primaryGoal: 'preservar',
      horizonYears: 1,
      lossReaction: 'desespero',
      riskCapacity: 0,
      experience: 'nenhuma',
      yearsInvesting: 0,
      monthlyIncome: 1000,
      reserveMonths: 0,
      hasEmergencyFund: false,
    });
    expect(r.profile).toBe('conservador');
    expect(r.score).toBeLessThan(40);
    expect(r.flags).toContain('Reserva de emergência ausente — bloquear até criar');
  });

  it('agressivo puro (renda alta, horizonte longo, derivativos)', () => {
    const r = computeSuitability({
      primaryGoal: 'crescimento',
      horizonYears: 20,
      lossReaction: 'vendo',
      riskCapacity: 80,
      experience: 'derivativos',
      yearsInvesting: 10,
      monthlyIncome: 20_000,
      reserveMonths: 12,
      hasEmergencyFund: true,
    });
    expect(r.profile).toBe('agressivo');
    expect(r.score).toBeGreaterThanOrEqual(70);
  });

  it('moderado borderline (mix risco)', () => {
    const r = computeSuitability({
      primaryGoal: 'renda',
      horizonYears: 5,
      lossReaction: 'seguro',
      riskCapacity: 25,
      experience: 'fundos',
      yearsInvesting: 3,
      monthlyIncome: 6_000,
      reserveMonths: 6,
      hasEmergencyFund: true,
    });
    expect(r.profile).toBe('moderado');
  });

  it('flags: derivativos sem 2 anos de experiência', () => {
    const r = computeSuitability({
      primaryGoal: 'crescimento',
      horizonYears: 5,
      lossReaction: 'vendo',
      riskCapacity: 50,
      experience: 'derivativos',
      yearsInvesting: 1,
      monthlyIncome: 10_000,
      reserveMonths: 6,
      hasEmergencyFund: true,
    });
    expect(r.flags).toContain('Derivativos sem experiência mínima de 2 anos');
  });

  it('recomendações batem com perfil', () => {
    const conservador = computeSuitability({
      primaryGoal: 'preservar',
      horizonYears: 0,
      lossReaction: 'desespero',
      riskCapacity: 0,
      experience: 'nenhuma',
      yearsInvesting: 0,
      monthlyIncome: 0,
      reserveMonths: 0,
      hasEmergencyFund: false,
    });
    expect(conservador.recommendations[0]).toMatch(/Renda fixa/i);
    expect(conservador.prohibitedAssets).toContain('Cripto (BTC, ETH)');

    const agressivo = computeSuitability({
      primaryGoal: 'crescimento',
      horizonYears: 30,
      lossReaction: 'vendo',
      riskCapacity: 90,
      experience: 'derivativos',
      yearsInvesting: 15,
      monthlyIncome: 50_000,
      reserveMonths: 24,
      hasEmergencyFund: true,
    });
    expect(agressivo.recommendations.find((r) => /crypto/i.test(r))).toBeTruthy();
    expect(agressivo.prohibitedAssets[0]).toMatch(/SEM proib/i);
  });
});

describe('SuitabilityGate', () => {
  it('bloqueia crypto para conservador', () => {
    const result = SuitabilityGate('conservador', 0.05, 'crypto');
    expect(result.ok).toBe(false);
  });

  it('permite crypto limitado para moderado', () => {
    const result = SuitabilityGate('moderado', 0.10, 'crypto');
    expect(result.ok).toBe(true);
  });

  it('bloqueia derivativo para conservador', () => {
    const result = SuitabilityGate('conservador', 0.05, 'derivativo');
    expect(result.ok).toBe(false);
  });

  it('bloqueia alocação acima do máximo por perfil', () => {
    const result = SuitabilityGate('conservador', 0.80, 'fii');
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/alocação/i);
  });

  it('permite alocação dentro do máx', () => {
    const result = SuitabilityGate('agressivo', 0.40, 'acao');
    expect(result.ok).toBe(true);
  });
});
