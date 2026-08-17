/**
 * VaR (Value at Risk) + CVaR (Conditional VaR / Expected Shortfall).
 * Metodo historico: usa retornos passados para estimar risco.
 *
 * Definições:
 * - VaR alpha: perda maxima esperada em alpha% dos piores cenarios
 * - CVaR alpha: media das perdas piores que VaR (esperanca de shortfall)
 *
 * Para Kapimind: usado em portfolio para mostrar risco historico.
 * No MVP, sem dependencia externa (scipy, quantstats) — pure TS.
 */

export interface ReturnSeries {
  dates: string[]; // ISO YYYY-MM-DD
  values: number[]; // portfolio value nos pontos
}

export interface VaRResult {
  confidence: number; // 0.95 ou 0.99
  windowDays: number; // janela usada
  varLoss: number; // valor absoluto em R$ (perda)
  varPercent: number; // perda em % do portfolio
  cvarLoss: number; // R$ (media das piores)
  cvarPercent: number; // %
  sampleSize: number;
}

export interface VaRConfig {
  confidence: number; // 0.90, 0.95, 0.99
  windowDays?: number; // default 252 (1 ano)
}

/**
 * Calcula retornos diarios a partir de uma serie de valores.
 */
export function computeDailyReturns(values: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }
  }
  return returns;
}

/**
 * Quantile de array (ordenado ascending).
 * Implementacao propria de quantile (sem numpy).
 */
export function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

/**
 * Media simples.
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calcula VaR e CVaR pelo metodo historico.
 *
 * Algoritmo:
 * 1. Calcular retornos diarios da serie
 * 2. Pegar os ultimos N retornos (default 252 = 1 ano)
 * 3. VaR = percentil (1 - confidence) * portfolio_value (negativo)
 * 4. CVaR = media dos retornos piores que o VaR cutoff * portfolio_value
 */
export function computeVaR(
  series: ReturnSeries,
  currentValue: number,
  config: VaRConfig,
): VaRResult {
  const confidence = config.confidence;
  const windowDays = config.windowDays ?? 252;

  const returns = computeDailyReturns(series.values);
  const window = returns.slice(-windowDays);

  // VaR: percentil (1 - confidence) — perda maxima no percentil pior
  // ex.: VaR 95% = pior 5% dos retornos
  const alpha = 1 - confidence;
  const varReturn = quantile(window, alpha);

  // CVaR: media dos retornos piores que o VaR
  const tailReturns = window.filter((r) => r <= varReturn);
  const cvarReturn = tailReturns.length > 0 ? mean(tailReturns) : varReturn;

  // Para VaR/CVaR, valor negativo = perda
  const varLoss = currentValue * Math.abs(varReturn);
  const cvarLoss = currentValue * Math.abs(cvarReturn);

  return {
    confidence,
    windowDays,
    varLoss,
    varPercent: Math.abs(varReturn),
    cvarLoss,
    cvarPercent: Math.abs(cvarReturn),
    sampleSize: window.length,
  };
}

/**
 * Calcula VaR para varias confiancas (95%, 99%) em uma so chamada.
 */
export function computeVaRMatrix(
  series: ReturnSeries,
  currentValue: number,
  windowDays = 252,
): VaRResult[] {
  return [0.95, 0.99].map((confidence) =>
    computeVaR(series, currentValue, { confidence, windowDays }),
  );
}

/**
 * Gera serie de retornos mock deterministica para testes.
 * Crescimento anual ~8% com volatilidade ~2% diaria (15% anual).
 */
export function generateMockReturns(months = 12, seed = 42): ReturnSeries {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const dailyReturn = 0.0003; // ~8% anual
  const dailyVol = 0.02;

  const dates: string[] = [];
  const values: number[] = [];
  let value = 100_000;
  const startDate = new Date('2024-01-01');

  for (let i = 0; i < months * 21; i++) {
    // 21 dias úteis/mês
    const shock = (rand() - 0.5) * 2 * dailyVol;
    value = value * (1 + dailyReturn + shock);
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date.toISOString().slice(0, 10));
    values.push(value);
  }

  return { dates, values };
}

/**
 * Interpretação simplificada do VaR.
 */
export function interpretVaR(varPercent: number, confidence: number): string {
  const pct = (varPercent * 100).toFixed(2);
  if (confidence >= 0.99) {
    return `Em 1% dos piores dias históricos, a perda excedeu ${pct}%`;
  }
  if (confidence >= 0.95) {
    return `Em 5% dos piores dias históricos, a perda excedeu ${pct}%`;
  }
  return `Perda histórica no percentil ${((1 - confidence) * 100).toFixed(0)}%: ${pct}%`;
}
