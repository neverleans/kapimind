import { describe, it, expect } from 'vitest';
import { computeSentiment, sentimentToBadge } from './sentiment';

describe('computeSentiment', () => {
  it('detecta texto bullish', () => {
    const r = computeSentiment({
      text: 'A empresa registrou alta de dividendo recorde com forte crescimento',
    });
    expect(r.score).toBeGreaterThan(0.3);
    expect(r.label).toMatch(/positivo|muito-positivo/);
    expect(r.signals.bullish.length).toBeGreaterThan(0);
  });

  it('detecta texto bearish', () => {
    const r = computeSentiment({
      text: 'A empresa registrou queda, queda, prejuízo recorde, desconfiança, calote, risco elevado, pessimismo, derrota, prejuizo, cortou, reducao.',
    });
    expect(r.score).toBeLessThan(-0.1);
    expect(r.label).toMatch(/negativo|muito-negativo/);
    expect(r.signals.bearish.length).toBeGreaterThan(0);
  });

  it('neutro quando sem palavras-chave', () => {
    const r = computeSentiment({ text: 'Neste dia, o tempo ficou nublado e frio.' });
    expect(r.score).toBe(0);
    expect(r.label).toBe('neutro');
    expect(r.confidence).toBeLessThan(0.5);
  });

  it('intensificadores aumentam score', () => {
    const r = computeSentiment({
      text: 'O dividendo subiu muito. Foi um ganho extremamente positivo.',
    });
    expect(r.score).toBeGreaterThan(0.4);
  });

  it('confianca cresce com matches', () => {
    const few = computeSentiment({ text: 'O dividendo subiu.' });
    const many = computeSentiment({
      text: 'O dividendo subiu, o lucro cresceu, a empresa registrou recorde, forte alta, ganho recorde',
    });
    expect(many.confidence).toBeGreaterThan(few.confidence);
  });

  it('clamp entre -1 e +1', () => {
    const r = computeSentiment({
      text: 'alta alta alta alta alta alta alta alta alta alta alta alta alta alta alta',
    });
    expect(r.score).toBeLessThanOrEqual(1);
    expect(r.score).toBeGreaterThanOrEqual(-1);
  });

  it('detecta termos negativos em contexto positivo (caixa-preta)', () => {
    const r = computeSentiment({
      text: 'Caixa-preta e default geraram alta volatilidade, mas lucro foi forte.',
    });
    // ambos: bearish (caixa-preta, default) + bullish (alta, lucro)
    expect(r.signals.bullish.length).toBeGreaterThan(0);
    expect(r.signals.bearish.length).toBeGreaterThan(0);
  });
});

describe('sentimentToBadge', () => {
  it('REDUCE para score < -0.3', () => {
    expect(sentimentToBadge(-0.5)).toBe('REDUCE');
  });
  it('INCREASE para score > 0.3', () => {
    expect(sentimentToBadge(0.5)).toBe('INCREASE');
  });
  it('HOLD para score intermedio', () => {
    expect(sentimentToBadge(0)).toBe('HOLD');
    expect(sentimentToBadge(0.1)).toBe('HOLD');
    expect(sentimentToBadge(-0.2)).toBe('HOLD');
  });
});
