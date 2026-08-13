/**
 * AdaptiveScorer — pure function que classifica ativos por score 0-100.
 * Pesos soma = 1.0.
 *
 * Ref: pesquisa "sistemas adaptativos e feedback loops" (item 7.1).
 * "NÃO precisa: RL, deep learning, regime detection com HMM, sentiment NLP em produção.
 *  PRECISA: regras claras, bandas explícitas, paper-trade de sugestões, aprendizado bayesiano simples."
 */

export interface ScoringInput {
  ticker: string;
  currentDrawdown: number; // -0.15 = -15% desde topo
  trailingYield: number; // 0.12 = 12% a.a.
  avgDailyVolume: number; // BRL
  sentimentScore: number; // -1 a +1
  macroRegime: 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL';
}

export interface ScoringOutput {
  ticker: string;
  score: number; // 0-100
  bucket: 'REDUCE' | 'HOLD' | 'INCREASE';
  reasons: string[];
}

const WEIGHTS = {
  drawdown: 0.30,
  yield: 0.25,
  volume: 0.20,
  sentiment: 0.15,
  macro: 0.10,
} as const;

const LOW_VOLUME_THRESHOLD = 100_000; // R$ - proxy de liquidez

export function scoreAsset(input: ScoringInput): ScoringOutput {
  const reasons: string[] = [];

  // 1. Drawdown (-0.5 = -50% → 100; 0 = topo → 0; +0.5 = +50% → 0)
  // Inversamente: quanto mais negativo, melhor o "buy the dip"
  const drawdownComponent = Math.min(100, Math.max(0, 50 + input.currentDrawdown * 100));
  if (input.currentDrawdown < -0.10) {
    reasons.push(`Drawdown ${(input.currentDrawdown * 100).toFixed(1)}%: boa entrada (Graham/Mr. Market)`);
  } else if (input.currentDrawdown > 0.05) {
    reasons.push(`Em alta ${(input.currentDrawdown * 100).toFixed(1)}%: menos upside no curto prazo`);
  }

  // 2. Yield (0% → 0; 12% → 60; 20%+ → 100)
  const yieldComponent = Math.min(100, (input.trailingYield / 0.20) * 100);
  if (input.trailingYield > 0.10) {
    reasons.push(`Yield ${(input.trailingYield * 100).toFixed(1)}% a.a. saudável`);
  } else if (input.trailingYield < 0.05) {
    reasons.push(`Yield ${(input.trailingYield * 100).toFixed(1)}% abaixo da média histórica`);
  }

  // 3. Volume (proxy de liquidez): 0 = R$ 0; 1M+ = 100
  const volumeComponent = Math.min(100, (input.avgDailyVolume / 1_000_000) * 100);
  if (input.avgDailyVolume < LOW_VOLUME_THRESHOLD) {
    reasons.push(`Volume diário baixo (R$ ${input.avgDailyVolume.toFixed(0)}): baixa liquidez`);
  }

  // 4. Sentiment (-1 = muito negativo → 0; 0 = neutro → 50; +1 muito positivo → 100)
  const sentimentComponent = ((input.sentimentScore + 1) / 2) * 100;
  if (input.sentimentScore < -0.3) {
    reasons.push(`Sentiment negativo (${input.sentimentScore.toFixed(2)})`);
  } else if (input.sentimentScore > 0.3) {
    reasons.push(`Sentiment positivo (${input.sentimentScore.toFixed(2)})`);
  }

  // 5. Macro regime: boost/reduction
  let macroComponent = 50;
  const isRendaFixa = input.ticker === 'TESOURO' || input.ticker === 'B5P211' || input.ticker.includes('IRF');
  if (input.macroRegime === 'RISK_OFF') {
    macroComponent = isRendaFixa ? 90 : 20;
    if (isRendaFixa) reasons.push('RISK_OFF favorece renda fixa');
  } else if (input.macroRegime === 'RISK_ON') {
    macroComponent = isRendaFixa ? 30 : 80;
    if (!isRendaFixa) reasons.push('RISK_ON favorece renda variável');
  } else {
    macroComponent = 50;
  }

  // Score ponderado
  const score =
    drawdownComponent * WEIGHTS.drawdown +
    yieldComponent * WEIGHTS.yield +
    volumeComponent * WEIGHTS.volume +
    sentimentComponent * WEIGHTS.sentiment +
    macroComponent * WEIGHTS.macro;

  // Bucket thresholds
  const bucket: ScoringOutput['bucket'] = score < 40 ? 'REDUCE' : score >= 70 ? 'INCREASE' : 'HOLD';

  if (bucket === 'REDUCE') {
    reasons.unshift('Score baixo — sinal de REDUCE');
  } else if (bucket === 'INCREASE') {
    reasons.unshift('Score alto — sinal de INCREASE');
  } else {
    reasons.unshift('Score neutro — manter posição');
  }

  return {
    ticker: input.ticker,
    score: Math.round(score),
    bucket,
    reasons,
  };
}

/**
 * Encontrar ativo alternativo melhor (score mais alto) na mesma classe.
 * MVP: comparar 2 ativos.
 */
export function suggestBetterAlternative(
  current: ScoringOutput,
  alternatives: ScoringInput[],
): ScoringOutput | null {
  if (current.bucket !== 'REDUCE') return null;
  const candidates = alternatives
    .filter((a) => a.ticker !== current.ticker)
    .map(scoreAsset)
    .filter((c) => c.bucket === 'INCREASE' || c.bucket === 'HOLD');
  if (candidates.length === 0) return null;
  // Sort by score desc
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}
