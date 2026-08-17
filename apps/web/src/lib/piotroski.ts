/**
 * Piotroski F-Score (2000) — pure function.
 *
 * Avalia a saúde financeira de uma empresa em 9 critérios binários (0 ou 1).
 * Score final: 0-9. Maior = mais saudável.
 *
 *   8-9: muito saudável
 *   6-7: saudável
 *   4-5: neutro
 *   2-3: arriscado
 *   0-1: muito fraco
 *
 * Adaptado para realidade BR via brapi.dev (formato padrao).
 * Referencia: https://www.oldschoolvalue.com/blog/piotroski-f-score/
 */

export interface FinancialData {
  netIncome: number; // lucro liquido (ano atual)
  netIncomePrevYear: number; // lucro liquido (ano anterior)
  totalAssets: number; // ativos totais (AT)
  roa: number; // return on assets = netIncome / AT
  roaPrevYear: number;
  cashFlowFromOperations: number; // CFO (caixa gerado pelas operacoes)
  totalLiabilities: number; // passivo total
  totalLiabilitiesPrevYear: number;
  sharesOutstanding: number; // acoes em circulacao (atual)
  sharesOutstandingPrevYear: number; // (ano anterior)
  grossMargin: number; // margem bruta (atual)
  grossMarginPrevYear: number; // (anterior)
  assetTurnover: number; // receita / ativos totais (atual)
  assetTurnoverPrevYear: number; // (anterior)
}

export interface FScoreResult {
  total: number; // 0-9
  breakdown: Record<string, number>; // cada criterio 0 ou 1
  reasoning: string[]; // explicacao por criterio
  band: 'muito-fraco' | 'fraco' | 'neutro' | 'saudavel' | 'muito-saudavel';
  score: {
    rentabilidade: number; // 0-4: lucro, ROA, CFO, accruals
    alavancagem: number; // 0-3: divida, equity, current ratio
    eficiencia: number; // 0-2: margem bruta, giro ativo
  };
}

export function computeFScore(data: FinancialData): FScoreResult {
  // 1. Lucro liquido positivo (atual)
  const c1 = data.netIncome > 0 ? 1 : 0;

  // 2. CFO positivo (acumulado)
  const c2 = data.cashFlowFromOperations > 0 ? 1 : 0;

  // 3. ROA atual maior que ano anterior
  const c3 = data.roa > data.roaPrevYear ? 1 : 0;

  // 4. CFO > lucro liquido (accruals)
  const c4 = data.cashFlowFromOperations > data.netIncome ? 1 : 0;

  // 5. Divida total diminuiu (alavancagem)
  const c5 = data.totalLiabilities < data.totalLiabilitiesPrevYear ? 1 : 0;

  // 6. Current ratio > 1 (proxy: (AT - PL) / PL > 1)
  // Para simplificar, comparamos equity: equity = AT - PL
  const equityCurr = data.totalAssets - data.totalLiabilities;
  const equityPrev = data.totalAssets - data.totalLiabilitiesPrevYear;
  const c6 = equityCurr > equityPrev ? 1 : 0;

  // 7. Acoes em circulacao nao aumentaram (sem diluicao)
  const c7 = data.sharesOutstanding <= data.sharesOutstandingPrevYear ? 1 : 0;

  // 8. Margem bruta atual maior que anterior
  const c8 = data.grossMargin > data.grossMarginPrevYear ? 1 : 0;

  // 9. Giro de ativo atual maior que anterior
  const c9 = data.assetTurnover > data.assetTurnoverPrevYear ? 1 : 0;

  const breakdown: Record<string, number> = {
    'lucro-positivo': c1,
    'cfo-positivo': c2,
    'roa-cresceu': c3,
    'cfo-maior-que-lucro': c4,
    'divida-caiu': c5,
    'equity-cresceu': c6,
    'sem-diluicao': c7,
    'margem-bruta-cresceu': c8,
    'giro-ativo-cresceu': c9,
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const reasoning: string[] = [
    `Lucro liquido positivo: ${data.netIncome > 0 ? 'sim' : 'nao'}`,
    `CFO positivo: ${data.cashFlowFromOperations > 0 ? 'sim' : 'nao'}`,
    `ROA cresceu: ${data.roa > data.roaPrevYear ? 'sim' : 'nao'}`,
    `CFO > Lucro: ${data.cashFlowFromOperations > data.netIncome ? 'sim' : 'nao'}`,
    `Divida caiu: ${data.totalLiabilities < data.totalLiabilitiesPrevYear ? 'sim' : 'nao'}`,
    `Equity subiu: ${equityCurr > equityPrev ? 'sim' : 'nao'}`,
    `Sem diluicao: ${data.sharesOutstanding <= data.sharesOutstandingPrevYear ? 'sim' : 'nao'}`,
    `Margem bruta cresceu: ${data.grossMargin > data.grossMarginPrevYear ? 'sim' : 'nao'}`,
    `Giro ativo cresceu: ${data.assetTurnover > data.assetTurnoverPrevYear ? 'sim' : 'nao'}`,
  ];

  const bands: FScoreResult['band'][] = ['muito-fraco', 'fraco', 'fraco', 'neutro', 'neutro', 'saudavel', 'saudavel', 'muito-saudavel', 'muito-saudavel'];
  const band: FScoreResult['band'] = total <= 1 ? 'muito-fraco' : total <= 3 ? 'fraco' : total <= 5 ? 'neutro' : total <= 7 ? 'saudavel' : 'muito-saudavel';

  return {
    total,
    breakdown,
    reasoning,
    band,
    score: {
      rentabilidade: c1 + c2 + c3 + c4,
      alavancagem: c5 + c6 + c7,
      eficiencia: c8 + c9,
    },
  };
}

/**
 * Wrapper: recebe objeto cru do brapi.dev e converte para FinancialData.
 * Para ações BR, brapi retorna: realEstate, profit, cashFlow, balanceSheet, etc.
 */
export interface BrapiPiotroskiInput {
  currentYear: {
    netIncome: number;
    totalAssets: number;
    totalLiabilities: number;
    cashFlowFromOperations: number;
    sharesOutstanding: number;
    grossProfit: number;
    revenue: number;
  };
  previousYear: {
    netIncome: number;
    totalAssets: number;
    totalLiabilities: number;
    cashFlowFromOperations: number;
    sharesOutstanding: number;
    grossProfit: number;
    revenue: number;
  };
}

export function computeFScoreFromBrapi(data: BrapiPiotroskiInput): FScoreResult {
  const curr = data.currentYear;
  const prev = data.previousYear;
  return computeFScore({
    netIncome: curr.netIncome,
    netIncomePrevYear: prev.netIncome,
    totalAssets: curr.totalAssets,
    roa: curr.totalAssets > 0 ? curr.netIncome / curr.totalAssets : 0,
    roaPrevYear: prev.totalAssets > 0 ? prev.netIncome / prev.totalAssets : 0,
    cashFlowFromOperations: curr.cashFlowFromOperations,
    totalLiabilities: curr.totalLiabilities,
    totalLiabilitiesPrevYear: prev.totalLiabilities,
    sharesOutstanding: curr.sharesOutstanding,
    sharesOutstandingPrevYear: prev.sharesOutstanding,
    grossMargin: curr.revenue > 0 ? curr.grossProfit / curr.revenue : 0,
    grossMarginPrevYear: prev.revenue > 0 ? prev.grossProfit / prev.revenue : 0,
    assetTurnover: curr.totalAssets > 0 ? curr.revenue / curr.totalAssets : 0,
    assetTurnoverPrevYear: prev.totalAssets > 0 ? prev.revenue / prev.totalAssets : 0,
  });
}
