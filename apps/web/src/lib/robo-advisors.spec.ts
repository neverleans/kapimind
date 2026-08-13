import { describe, it, expect } from 'vitest';
import { calculateRoboCompare } from './robo-advisors';

describe('calculateRoboCompare', () => {
  it('Retorna valores positivos para inputs válidos', () => {
    const out = calculateRoboCompare({
      patrimonioAtual: 5000,
      aporteMensal: 600,
      anos: 5,
      rentabilidadeBruta: 0.12,
      taxaRobo: 0.005,
      anosIR: 2,
    });
    expect(out.valorFinalDIY).toBeGreaterThan(0);
    expect(out.valorFinalRobo).toBeGreaterThan(0);
  });

  it('DIY > Robo quando taxa do robo come rentabilidade', () => {
    const out = calculateRoboCompare({
      patrimonioAtual: 5000,
      aporteMensal: 600,
      anos: 5,
      rentabilidadeBruta: 0.12,
      taxaRobo: 0.005,
      anosIR: 2,
    });
    // Com taxa 0,5% a.a. e IR 15%, DIY deve ter mais líquido (porque evita custo de gestão)
    expect(out.diferencaLiquida).toBeGreaterThan(0);
    expect(out.valeAPena).toBe(true);
  });

  it('Para 30 anos, taxa do robo pesa mais → DIY é melhor', () => {
    const out = calculateRoboCompare({
      patrimonioAtual: 5000,
      aporteMensal: 600,
      anos: 30,
      rentabilidadeBruta: 0.10,
      taxaRobo: 0.005,
      anosIR: 2,
    });
    expect(out.diferencaLiquida).toBeGreaterThan(0);
  });

  it('Para 1 ano, diferença pequena', () => {
    const out = calculateRoboCompare({
      patrimonioAtual: 5000,
      aporteMensal: 600,
      anos: 1,
      rentabilidadeBruta: 0.12,
      taxaRobo: 0.005,
      anosIR: 2,
    });
    // Em 1 ano a taxa pesa pouco
    expect(Math.abs(out.diferencaLiquida)).toBeLessThan(1000);
  });
});
