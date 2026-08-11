/**
 * Pure simulation logic ported from legacy/app.js.
 *
 * Two-phase strategy:
 *  - Phase 1 (months 1-60): High Yield (MXRF11 + VGHF11 + VGIA11)
 *  - Phase 2 (months 61+): Tijolo (HGLG11 + VISC11)
 *
 * Annual dividend growth (4% a.a.) modeled after IGP-M.
 * Annual contribution growth (10% a.a.) modeled after inflation.
 *
 * NO side effects, NO DOM. Fully testable.
 */

export type AssetKey = 'MXRF11' | 'VGHF11' | 'VGIA11' | 'HGLG11' | 'VISC11';

export interface AssetConfig {
  name: string;
  type: 'paper' | 'fiagro' | 'brick';
  price: number;
  dividend: number;
  color: string;
}

export interface SimulationConfig {
  initialInvestment: number;
  months: number;
  inflationRate: number;
  dividendGrowthRate: number;
  assets: Record<AssetKey, AssetConfig>;
}

export const DEFAULT_CONFIG: SimulationConfig = {
  initialInvestment: 600,
  months: 120,
  inflationRate: 0.10,
  dividendGrowthRate: 0.04,
  assets: {
    MXRF11: { name: 'MXRF11', type: 'paper', price: 9.62, dividend: 0.10, color: '#10b981' },
    VGHF11: { name: 'VGHF11', type: 'paper', price: 7.17, dividend: 0.07, color: '#8b5cf6' },
    VGIA11: { name: 'VGIA11', type: 'fiagro', price: 9.96, dividend: 0.14, color: '#ef4444' },
    HGLG11: { name: 'HGLG11', type: 'brick', price: 157.5, dividend: 1.1, color: '#f59e0b' },
    VISC11: { name: 'VISC11', type: 'brick', price: 109.3, dividend: 0.84, color: '#3b82f6' },
  },
};

export type PortfolioQty = Record<AssetKey, number>;

export interface SimulationMonth {
  monthTotal: number;
  monthLabel: string;
  contribution: number;
  dividends: number;
  totalToInvest: number;
  allocation: Record<AssetKey, number>;
  buyAmounts: PortfolioQty;
  buyQtys: PortfolioQty;
  portfolioQty: PortfolioQty;
  balanceTotal: number;
}

export interface SimulationResult {
  months: SimulationMonth[];
  config: SimulationConfig;
  totalInvested: number;
  totalDividends: number;
  finalPortfolioValue: number;
  finalPortfolioQty: PortfolioQty;
  finalMonthlyDividend: number;
  finalMonthlyContribution: number;
  independenceMonth: number | null;
  paybackMonth: number | null;
}

function getAllocationForMonth(month: number): Record<AssetKey, number> {
  if (month <= 60) {
    return { MXRF11: 0.33, VGHF11: 0.33, VGIA11: 0.34, HGLG11: 0, VISC11: 0 };
  }
  return { MXRF11: 0.05, VGHF11: 0.05, VGIA11: 0.05, HGLG11: 0.425, VISC11: 0.425 };
}

function formatTime(totalMonths: number | null): string {
  if (totalMonths === null || totalMonths === undefined) return 'Fora do horizonte (50 anos)';
  if (totalMonths < 0) return 'Fora do horizonte (50 anos)';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return `${years} anos e ${months} meses`;
}

export function runSimulation(config: SimulationConfig = DEFAULT_CONFIG): SimulationResult {
  const portfolioQty: PortfolioQty = { MXRF11: 0, VGHF11: 0, VGIA11: 0, HGLG11: 0, VISC11: 0 };
  let currentDividends: Record<AssetKey, number> = {
    MXRF11: config.assets.MXRF11.dividend,
    VGHF11: config.assets.VGHF11.dividend,
    VGIA11: config.assets.VGIA11.dividend,
    HGLG11: config.assets.HGLG11.dividend,
    VISC11: config.assets.VISC11.dividend,
  };

  let cashBalance = 0;
  let cumulativeInvestedFromPocket = 0;
  let cumulativeDividendsReceived = 0;
  let currentMonthlyDividend = 0;
  let lastMonthlyContribution = 0;
  let independenceMonth: number | null = null;

  const months: SimulationMonth[] = [];

  for (let i = 1; i <= config.months; i++) {
    // Apply dividend growth at the start of each year (after month 1)
    if (i > 1 && (i - 1) % 12 === 0) {
      (Object.keys(currentDividends) as AssetKey[]).forEach((key) => {
        currentDividends[key] *= 1 + config.dividendGrowthRate;
      });
    }

    const allocation = getAllocationForMonth(i);
    const yearIndex = Math.floor((i - 1) / 12);
    const monthlyContribution = config.initialInvestment * Math.pow(1 + config.inflationRate, yearIndex);
    lastMonthlyContribution = monthlyContribution;
    cumulativeInvestedFromPocket += monthlyContribution;
    cashBalance += monthlyContribution;

    // Recalculate dividends using current values
    let dividendsThisMonth = 0;
    (Object.keys(portfolioQty) as AssetKey[]).forEach((key) => {
      dividendsThisMonth += portfolioQty[key] * currentDividends[key];
    });
    currentMonthlyDividend = dividendsThisMonth;
    cumulativeDividendsReceived += dividendsThisMonth;
    cashBalance += dividendsThisMonth;

    if (independenceMonth === null && dividendsThisMonth >= monthlyContribution) {
      independenceMonth = i;
    }

    const totalAvailableToInvest = cashBalance;
    const buyAmounts: PortfolioQty = { MXRF11: 0, VGHF11: 0, VGIA11: 0, HGLG11: 0, VISC11: 0 };
    const buyQtys: PortfolioQty = { MXRF11: 0, VGHF11: 0, VGIA11: 0, HGLG11: 0, VISC11: 0 };

    (Object.keys(allocation) as AssetKey[]).forEach((key) => {
      const weight = allocation[key];
      const targetAmount = totalAvailableToInvest * weight;
      const price = config.assets[key].price;
      const qtyToBuy = targetAmount / price;

      portfolioQty[key] += qtyToBuy;
      buyAmounts[key] = targetAmount;
      buyQtys[key] = qtyToBuy;
    });
    cashBalance = 0;

    let totalBalance = 0;
    (Object.keys(portfolioQty) as AssetKey[]).forEach((key) => {
      totalBalance += portfolioQty[key] * config.assets[key].price;
    });

    const monthInYear = ((i - 1) % 12) + 1;
    months.push({
      monthTotal: i,
      monthLabel: `Mês ${monthInYear}`,
      contribution: monthlyContribution,
      dividends: dividendsThisMonth,
      totalToInvest: totalAvailableToInvest,
      allocation,
      buyAmounts,
      buyQtys,
      portfolioQty: { ...portfolioQty },
      balanceTotal: totalBalance,
    });
  }

  // Project crossover + payback beyond the simulation horizon
  const { crossoverMonth, paybackMonth } = projectCrossoverAndPayback(
    config,
    portfolioQty,
    cumulativeInvestedFromPocket,
    cumulativeDividendsReceived,
    lastMonthlyContribution,
    config.months,
  );

  return {
    months,
    config,
    totalInvested: cumulativeInvestedFromPocket,
    totalDividends: cumulativeDividendsReceived,
    finalPortfolioValue: months[months.length - 1]?.balanceTotal ?? 0,
    finalPortfolioQty: portfolioQty,
    finalMonthlyDividend: currentMonthlyDividend,
    finalMonthlyContribution: lastMonthlyContribution,
    independenceMonth: independenceMonth,
    paybackMonth: paybackMonth,
  };
}

function projectCrossoverAndPayback(
  config: SimulationConfig,
  startQty: PortfolioQty,
  startInv: number,
  startDivs: number,
  startContrib: number,
  startMonth: number,
): { crossoverMonth: number | null; paybackMonth: number | null } {
  const qty: PortfolioQty = { ...startQty };
  let totalInvested = startInv;
  let totalDividends = startDivs;
  let currentContrib = startContrib;

  let month = startMonth;
  let crossoverMonth: number | null = null;
  let paybackMonth: number | null = null;

  while (month < 600) {
    if (month % 12 === 1 && month > 1) {
      currentContrib = currentContrib * (1 + config.inflationRate);
    }

    const allocation = getAllocationForMonth(month);
    totalInvested += currentContrib;

    let monthlyDiv = 0;
    (Object.keys(qty) as AssetKey[]).forEach((k) => {
      monthlyDiv += qty[k] * config.assets[k].dividend;
    });
    totalDividends += monthlyDiv;

    if (crossoverMonth === null && monthlyDiv > currentContrib) {
      crossoverMonth = month;
    }
    if (paybackMonth === null && totalDividends > totalInvested) {
      paybackMonth = month;
    }
    if (crossoverMonth !== null && paybackMonth !== null) {
      break;
    }

    const totalToInvest = currentContrib + monthlyDiv;
    (Object.keys(allocation) as AssetKey[]).forEach((k) => {
      const weight = allocation[k];
      qty[k] += (totalToInvest * weight) / config.assets[k].price;
    });

    month++;
  }

  return { crossoverMonth, paybackMonth };
}

export { formatTime };
