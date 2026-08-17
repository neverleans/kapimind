/**
 * Monte Carlo Backtest (GBM puro em TS).
 *
 * Geometric Brownian Motion (GBM):
 *   S(t+dt) = S(t) * exp((mu - sigma^2/2) * dt + sigma * sqrt(dt) * Z)
 *   onde Z ~ N(0,1) (Box-Muller)
 *
 * Usado para projetos 5k+ cenarios. Mais leve que scipy.
 * Para Kapimind, sustenta 5000 cenarios em ~200ms no navegador.
 */

export interface GBMConfig {
  initialValue: number;
  monthlyContribution: number;
  years: number;
  simulations: number; // default 5000
  expectedReturn: number; // ex: 0.10 = 10% a.a.
  volatility: number; // ex: 0.15 = 15% a.a.
  seed?: number; // deterministica
}

export interface MonteCarloResult {
  initialValue: number;
  totalContributed: number;
  finalValueByPath: number[]; // resultados finais (1 por simulação)
  percentiles: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  paths: number[][]; // séries temporais (para fan chart)
  pathsByYear: number[][]; // séries agregadas por ano (para visualização)
  confidence95: { low: number; high: number };
  successRate: number; // % de cenários que terminaram > initialValue
  duration: number;
}

/**
 * Box-Muller: gera Z ~ N(0,1) deterministicamente.
 */
export function randn(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1 || 1e-9)) * Math.cos(2 * Math.PI * u2);
}

/**
 * PRNG seeded (mulberry32) para reprodutibilidade.
 */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Calcula todos os paths via GBM em uma só passada.
 */
export function runMonteCarlo(config: GBMConfig): MonteCarloResult {
  const {
    initialValue,
    monthlyContribution,
    years,
    simulations,
    expectedReturn,
    volatility,
    seed,
  } = config;

  const rng = seed !== undefined ? mulberry32(seed) : null;

  // monthly params
  const monthlyMu = expectedReturn / 12;
  const monthlyVol = volatility / Math.sqrt(12);
  const dt = 1;
  const months = years * 12;
  const totalContributed = initialValue + monthlyContribution * months;

  // matrizes [path][month]
  const paths: number[][] = [];
  const pathsByYear: number[][] = [];

  for (let s = 0; s < simulations; s++) {
    const path: number[] = new Array(months + 1);
    path[0] = initialValue;
    for (let m = 1; m <= months; m++) {
      const z = rng ? gaussian(rng) : gaussianFromMathRandom();
      const shock = (monthlyMu - 0.5 * monthlyVol * monthlyVol) * dt + monthlyVol * Math.sqrt(dt) * z;
      path[m] = path[m - 1] * Math.exp(shock) + monthlyContribution;
    }
    paths.push(path);
  }

  const finalValues = paths.map((p) => p[p.length - 1]);

  // agrego por ano (12 meses)
  for (let y = 0; y <= years; y++) {
    const slice = paths.map((p) => {
      const idx = Math.min(y * 12, p.length - 1);
      return p[idx];
    });
    pathsByYear.push(slice);
  }

  const sorted = [...finalValues].sort((a, b) => a - b);
  const p5 = quantile(sorted, 0.05);
  const p25 = quantile(sorted, 0.25);
  const p50 = quantile(sorted, 0.5);
  const p75 = quantile(sorted, 0.75);
  const p95 = quantile(sorted, 0.95);

  const successRate = finalValues.filter((v) => v > initialValue).length / simulations;

  return {
    initialValue,
    totalContributed,
    finalValueByPath: finalValues,
    percentiles: { p5, p25, p50, p75, p95 },
    paths,
    pathsByYear,
    confidence95: { low: p5, high: p95 },
    successRate,
    duration: Date.now(),
  };
}

function quantile(values: number[], q: number): number {
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
 * Box-Muller com PRNG seeded.
 */
function gaussian(rng: () => number): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = rng();
  while (u2 === 0) u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function gaussianFromMathRandom(): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Converte paths por-ano em estrutura para fan chart.
 * Cada ponto tem p5, p25, p50, p75, p95 para renderizar.
 */
export interface FanChartData {
  year: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export function buildFanChartData(result: MonteCarloResult): FanChartData[] {
  const data: FanChartData[] = [];
  for (let y = 0; y < result.pathsByYear.length; y++) {
    const values = result.pathsByYear[y];
    const sorted = [...values].sort((a, b) => a - b);
    data.push({
      year: y,
      p5: quantile(sorted, 0.05),
      p25: quantile(sorted, 0.25),
      p50: quantile(sorted, 0.5),
      p75: quantile(sorted, 0.75),
      p95: quantile(sorted, 0.95),
    });
  }
  return data;
}
