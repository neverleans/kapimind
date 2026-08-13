/**
 * Permanent Portfolio (Browne) — backtest TypeScript puro.
 *
 * Alocação: 25% ações, 25% bonds, 25% ouro, 25% cash.
 * Rebalanceamento: threshold (5pp drift) ou calendário (trimestral).
 *
 * Algoritmo histórico: ~9% CAGR com drawdown baixo (1970-2024 backtest).
 *
 * NOTA: dados mockados vêm de `getMockPriceSeries()` para reprodutibilidade
 * dos testes. Em produção, substituir por `fetchBrapiSeries()`.
 */

export type AssetClass = 'equity' | 'bonds' | 'gold' | 'cash' | 'reits'

export interface PermanentPortfolioInput {
  tickers: { equity: string; bonds: string; gold: string; cash: string; reits?: string }
  allocation: Record<AssetClass, number> // soma = 100
  startDate: Date
  endDate: Date
  monthlyContribution: number
  rebalanceThreshold: number // ex.: 0.05 = 5pp drift
  rebalanceFrequency: 'monthly' | 'quarterly' | 'annual' | 'threshold'
}

export interface BacktestPoint {
  date: string // ISO
  totalValue: number
  allocation: Record<AssetClass, number> // peso atual por classe
  drift: Record<AssetClass, number> // desvio em pp (0..1) vs target
  rebalanced: boolean
  monthlyContribution: number
  monthlyReturn: number // retorno do mês (%)
}

export interface BacktestMetrics {
  cagr: number
  sharpe: number // anualizado, rf=0
  maxDrawdown: number // ex.: -0.18 = -18%
  volatility: number // anualizada
  totalReturn: number // ex.: 0.85 = 85%
  bestYear: number
  worstYear: number
  rebalanceCount: number
  finalValue: number
  totalContributed: number
  years: number
}

export interface BacktestResult {
  series: BacktestPoint[]
  metrics: BacktestMetrics
  config: PermanentPortfolioInput
}

export interface PriceBar {
  date: string // ISO YYYY-MM-DD
  close: number
}

/**
 * Validar alocação soma = 100 (±0.5).
 */
export function validateAllocation(allocation: Record<AssetClass, number>): boolean {
  const sum = Object.values(allocation).reduce((a, b) => a + b, 0);
  return Math.abs(sum - 100) < 0.5;
}

/**
 * Gerar mock price series determinísticos (PRNG seeded).
 * Ativos: MXRF11, HGLG11, IVVB11, B5P211, GOLD11.
 * Período: 60 meses. Drifts plausíveis (REITs ~9%, Bonds ~10%, Equity ~12%, Gold ~8%).
 */
export function getMockPriceSeries(): Map<string, PriceBar[]> {
  const seed = 42;
  const rand = mulberry32(seed);
  const months = 60;
  const startDate = new Date('2021-01-01');
  const endDate = new Date('2025-12-31');

  // Vol anual % (mensal)
  const params: Record<string, { mu: number; sigma: number; start: number }> = {
    MXRF11: { mu: 0.008, sigma: 0.025, start: 9.6 }, // REITs ~9% a.a.
    HGLG11: { mu: 0.010, sigma: 0.030, start: 157.5 }, // Logistica
    IVVB11: { mu: 0.011, sigma: 0.05, start: 30.0 }, // S&P500
    B5P211: { mu: 0.009, sigma: 0.012, start: 100.0 }, // IRF-M
    GOLD11: { mu: 0.007, sigma: 0.035, start: 50.0 }, // Ouro
  };

  const out = new Map<string, PriceBar[]>();

  for (const [ticker, p] of Object.entries(params)) {
    const series: PriceBar[] = [];
    let price = p.start;

    for (let i = 0; i < months; i++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      if (date > endDate) break;

      // Random walk mensal
      const shock = (rand() - 0.5) * 2 * p.sigma;
      price = price * (1 + p.mu + shock);
      if (price < 0.01) price = 0.01; // floor

      series.push({
        date: date.toISOString().slice(0, 7),
        close: Number(price.toFixed(4)),
      });
    }
    out.set(ticker, series);
  }

  return out;
}

/**
 * PRNG mulberry32 — determinístico e seedável.
 */
function mulberry32(seed: number): () => number {
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
 * Buscar preço por ticker/dia. Retorna null se não achar.
 */
export function findPrice(series: PriceBar[], monthISO: string): number | null {
  const bar = series.find((b) => b.date === monthISO);
  return bar ? bar.close : null;
}

/**
 * Checar se deve rebalancear (threshold OR date-based).
 */
export function shouldRebalance(
  point: BacktestPoint,
  input: PermanentPortfolioInput,
  monthIndex: number,
): boolean {
  // Threshold: max drift > threshold
  const maxDrift = Math.max(...Object.values(point.drift).map(Math.abs));
  const exceedsThreshold = maxDrift > input.rebalanceThreshold;

  // Date-based (monthIndex é 1-based: 1=primeiro mês, 2=segundo, ...)
  let exceedsFrequency = false;

  if (input.rebalanceFrequency === 'monthly') {
    exceedsFrequency = monthIndex > 1; // todo mês após o primeiro
  } else if (input.rebalanceFrequency === 'quarterly') {
    // Mês 3, 6, 9, 12, ... = quarterly trigger (1-based)
    exceedsFrequency = monthIndex >= 3 && monthIndex % 3 === 0;
  } else if (input.rebalanceFrequency === 'annual') {
    // Mês 12, 24, 36, ... = annual trigger (1-based)
    exceedsFrequency = monthIndex >= 12 && monthIndex % 12 === 0;
  }

  if (input.rebalanceFrequency === 'threshold') {
    return exceedsThreshold;
  }

  return exceedsThreshold || exceedsFrequency;
}

/**
 * Normalizar alocação para soma=100.
 */
function normalizeAllocation(
  current: Record<AssetClass, number>,
  target: Record<AssetClass, number>,
): Record<AssetClass, number> {
  const sum = Object.values(current).reduce((a, b) => a + b, 0);
  if (sum === 0) return target;
  const normalized: Record<AssetClass, number> = {} as Record<AssetClass, number>;
  for (const [k, v] of Object.entries(current)) {
    normalized[k as AssetClass] = (v / sum) * 100;
  }
  return normalized;
}

/**
 * Rodar backtest. Pure function.
 */
export function runBacktest(
  input: PermanentPortfolioInput,
  priceSeries: Map<string, PriceBar[]>,
): BacktestResult {
  if (!validateAllocation(input.allocation)) {
    throw new Error('Allocation must sum to 100');
  }

  const series: BacktestPoint[] = [];
  let holdings: Record<AssetClass, { quantity: number; avgPrice: number }> = {
    equity: { quantity: 0, avgPrice: 0 },
    bonds: { quantity: 0, avgPrice: 0 },
    gold: { quantity: 0, avgPrice: 0 },
    cash: { quantity: 0, avgPrice: 0 },
    reits: input.tickers.reits ? { quantity: 0, avgPrice: 0 } : undefined as never,
  };

  // Gerar lista de meses entre startDate e endDate (inclusivo)
  const months: string[] = [];
  const cursor = new Date(input.startDate.getFullYear(), input.startDate.getMonth(), 1);
  const end = new Date(input.endDate.getFullYear(), input.endDate.getMonth(), 1);
  // Limitar para no maximo 60 meses (5 anos)
  let count = 0;
  while (cursor <= end && count < 60) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setMonth(cursor.getMonth() + 1);
    count++;
  }

  let rebalanceCount = 0;
  let totalContributed = 0;

  for (let i = 0; i < months.length; i++) {
    const month = months[i];

    // Adicionar aporte mensal
    totalContributed += input.monthlyContribution;

    // Comprar conforme alocação atual
    for (const [assetKey, ticker] of Object.entries(input.tickers)) {
      if (!ticker) continue;
      const ac = assetKey as AssetClass;
      const price = findPrice(priceSeries.get(ticker) ?? [], month);
      if (price === null || price <= 0) continue;

      const allocationValue = input.allocation[ac];
      if (allocationValue === undefined) continue;
      const targetWeight = allocationValue / 100;
      const allocationAmount = input.monthlyContribution * targetWeight;
      const qty = allocationAmount / price;

      holdings[ac] = holdings[ac] || { quantity: 0, avgPrice: price };
      holdings[ac].quantity += qty;
      holdings[ac].avgPrice = price;
    }

    // Calcular valor total e alocação atual
    const values: Record<AssetClass, number> = {} as Record<AssetClass, number>;
    let totalValue = 0;

    for (const [assetKey, ticker] of Object.entries(input.tickers)) {
      if (!ticker) continue;
      const ac = assetKey as AssetClass;
      const h = holdings[ac];
      if (!h) continue;
      const price = findPrice(priceSeries.get(ticker) ?? [], month) ?? h.avgPrice;
      const value = h.quantity * price;
      values[ac] = value;
      totalValue += value;
    }

    // Cash sempre é nominal
    values.cash = (holdings.cash?.quantity ?? 0) * 1;

    const allocationNow: Record<AssetClass, number> = {} as Record<AssetClass, number>;
    for (const [k, v] of Object.entries(values)) {
      allocationNow[k as AssetClass] = totalValue > 0 ? (v / totalValue) * 100 : 0;
    }

    // Calcular drift
    const drift: Record<AssetClass, number> = {} as Record<AssetClass, number>;
    for (const [k, v] of Object.entries(allocationNow)) {
      const target = (input.allocation[k as AssetClass] ?? 0) / 100;
      drift[k as AssetClass] = (v / 100) - target;
    }

    // Decidir rebalance
    const point: BacktestPoint = {
      date: month,
      totalValue,
      allocation: allocationNow,
      drift,
      rebalanced: false,
      monthlyContribution: input.monthlyContribution,
      monthlyReturn: 0, // será calculado abaixo
    };

    if (i > 0 && shouldRebalance(point, input, i)) {
      // Rebalancear: vender tudo e recomprar conforme target
      // Para simplicidade, recalcular holdings para bater target
      for (const [assetKey, ticker] of Object.entries(input.tickers)) {
        if (!ticker) continue;
        const ac = assetKey as AssetClass;
        const targetValue = (input.allocation[ac] ?? 0) / 100 * totalValue;
        const price = findPrice(priceSeries.get(ticker) ?? [], month) ?? 0;
        if (price > 0) {
          holdings[ac] = { quantity: targetValue / price, avgPrice: price };
        }
      }
      // Marcar como rebalanced e resetar drift
      point.rebalanced = true;
      for (const k of Object.keys(point.drift)) {
        point.drift[k as AssetClass] = 0;
      }
      rebalanceCount++;
    }

    // Calcular retorno mensal
    if (i > 0 && series.length > 0) {
      const prev = series[series.length - 1];
      point.monthlyReturn = prev.totalValue > 0 ? (totalValue - prev.totalValue) / prev.totalValue : 0;
    }

    series.push(point);
  }

  // Calcular métricas
  const metrics = computeMetrics(series, totalContributed);

  return {
    series,
    metrics,
    config: input,
  };
}

/**
 * Calcular métricas agregadas (CAGR, Sharpe, max drawdown, vol).
 */
export function computeMetrics(
  series: BacktestPoint[],
  totalContributed: number,
): BacktestMetrics {
  if (series.length === 0) {
    return {
      cagr: 0,
      sharpe: 0,
      maxDrawdown: 0,
      volatility: 0,
      totalReturn: 0,
      bestYear: 0,
      worstYear: 0,
      rebalanceCount: 0,
      finalValue: 0,
      totalContributed,
      years: 0,
    };
  }

  const final = series[series.length - 1];
  const initial = series[0];
  const months = series.length;
  const years = months / 12;

  // CAGR
  const cagr =
    final.totalValue > 0 && initial.totalValue > 0 && years > 0
      ? Math.pow(final.totalValue / initial.totalValue, 1 / years) - 1
      : 0;

  // Retornos mensais
  const monthlyReturns = series.slice(1).map((p) => p.monthlyReturn);
  const mean =
    monthlyReturns.reduce((a, b) => a + b, 0) / Math.max(monthlyReturns.length, 1);
  const variance =
    monthlyReturns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) /
    Math.max(monthlyReturns.length - 1, 1);
  const std = Math.sqrt(variance);

  // Sharpe anualizado (rf=0)
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(12) : 0;

  // Vol anualizada
  const volatility = std * Math.sqrt(12);

  // Max drawdown
  let peak = series[0].totalValue;
  let maxDD = 0;
  for (const p of series) {
    if (p.totalValue > peak) peak = p.totalValue;
    const dd = (p.totalValue - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }

  // Best/worst year (agregado por ano)
  const yearlyReturns = new Map<number, { start: number; peak: number }>();
  for (const p of series) {
    const year = new Date(p.date).getFullYear();
    const cur = yearlyReturns.get(year);
    if (!cur) {
      yearlyReturns.set(year, { start: p.totalValue, peak: p.totalValue });
    } else {
      cur.peak = Math.max(cur.peak, p.totalValue);
    }
  }
  const yearArray = Array.from(yearlyReturns.entries());
  const yearlyReturnsArray = yearArray.map(([year, data]) => {
    const final = series.filter((p) => new Date(p.date).getFullYear() === year).slice(-1)[0];
    return { year, return: (final.totalValue - data.start) / data.start };
  });
  const bestYear = Math.max(...yearlyReturnsArray.map((y) => y.return), 0);
  const worstYear = Math.min(...yearlyReturnsArray.map((y) => y.return), 0);

  // Total return
  const totalReturn =
    initial.totalValue > 0 ? (final.totalValue - initial.totalValue) / initial.totalValue : 0;

  // Rebalance count
  const rebalanceCount = series.filter((p) => p.rebalanced).length;

  return {
    cagr: round(cagr),
    sharpe: round(sharpe, 2),
    maxDrawdown: round(maxDD),
    volatility: round(volatility),
    totalReturn: round(totalReturn),
    bestYear: round(bestYear),
    worstYear: round(worstYear),
    rebalanceCount,
    finalValue: round(final.totalValue),
    totalContributed: round(totalContributed),
    years: round(years, 1),
  };
}

function round(value: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Fetch BRAPI.dev série de preços.
 * NOTA: em produção. No MVP, retorna mock.
 */
export async function fetchBrapiSeries(
  ticker: string,
  _startDate: Date,
  _endDate: Date,
): Promise<PriceBar[]> {
  // Mock — implementação real precisaria de BRAPI_PRO key
  const mock = getMockPriceSeries();
  return mock.get(ticker) ?? [];
}
