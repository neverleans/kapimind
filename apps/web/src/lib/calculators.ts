/**
 * Calculadoras financeiras didaticas.
 * Base: todas operam em horizonte longo, com inflacao e dividend yield.
 */

export interface RendaAlvoInput {
  targetMonthlyIncome: number; // R$ mensal desejado
  annualDividendYield: number; // ex: 0.12 para 12% a.a.
  annualReturn: number; // ex: 0.10 para 10% a.a. (crescimento de cota)
  years: number; // horizonte
}

export function calculateRendaAlvo(input: RendaAlvoInput) {
  const { targetMonthlyIncome, annualDividendYield, annualReturn, years } = input;
  const annualIncome = targetMonthlyIncome * 12;
  const portfolioRequired = annualIncome / annualDividendYield;
  const monthlyReturn = (1 + annualReturn) ** (1 / 12) - 1;
  const months = years * 12;
  const futureValueFactor = ((1 + monthlyReturn) ** months - 1) / monthlyReturn;
  const monthlyInvestment = portfolioRequired / futureValueFactor;

  return {
    portfolioRequired,
    monthlyInvestment,
    totalInvested: monthlyInvestment * months,
    years,
    targetMonthlyIncome,
    finalPortfolioValue: portfolioRequired * (1 + annualReturn) ** years,
    finalAnnualIncome: portfolioRequired * annualDividendYield * (1 + annualReturn) ** years,
  };
}

export interface AporteExtraInput {
  currentMonthly: number;
  extraMonthly: number;
  years: number;
  annualReturn: number;
}

export function calculateAporteExtra(input: AporteExtraInput) {
  const { currentMonthly, extraMonthly, years, annualReturn } = input;
  const months = years * 12;
  const monthlyReturn = (1 + annualReturn) ** (1 / 12) - 1;
  const factor = ((1 + monthlyReturn) ** months - 1) / monthlyReturn;

  const finalCurrent = currentMonthly * factor;
  const finalExtra = extraMonthly * factor;
  const extraGain = finalExtra - extraMonthly * months; // lucro líquido
  const totalGain = finalExtra - extraMonthly * months;

  return {
    finalCurrent,
    finalExtra,
    extraGain,
    totalGain,
    roi: (extraGain / (extraMonthly * months)) * 100,
  };
}

export interface MetaAporteInput {
  targetMonthly: number;
  currentMonthly: number;
  expectedRaise: number; // 0..1 (ex: 0.10 para 10% a.a.)
}

export function calculateProgressMeta(input: MetaAporteInput) {
  const { targetMonthly, currentMonthly, expectedRaise } = input;
  const progress = (currentMonthly / targetMonthly) * 100;

  if (currentMonthly >= targetMonthly) {
    return {
      current: currentMonthly,
      target: targetMonthly,
      progress: 100,
      remaining: 0,
      monthsToGoal: 0,
    };
  }

  // Meses para bater meta se aplica aumento anual
  const monthlyRate = (1 + expectedRaise) ** (1 / 12) - 1;
  const factor = (targetMonthly / currentMonthly) * monthlyRate + 1;
  const monthsToGoal = Math.log(factor) / Math.log(1 + monthlyRate);

  return {
    current: currentMonthly,
    target: targetMonthly,
    progress,
    remaining: targetMonthly - currentMonthly,
    monthsToGoal: Math.max(0, Math.ceil(monthsToGoal)),
  };
}
