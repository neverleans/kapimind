/**
 * Calculadora "Vale a pena um robo-advisor?".
 * Compara retorno DIY vs Robo Advisor considerando taxa a.a.
 */

export interface RoboCompareInput {
  patrimonioAtual: number; // R$
  aporteMensal: number; // R$/mes
  anos: number; // horizonte
  rentabilidadeBruta: number; // ex: 0.12 = 12% a.a. (Brapi Ibov ou CDI)
  taxaRobo: number; // ex: 0.005 = 0.5% a.a. (Warren)
  anosIR: number; // ex: 2 = IR ja caiu para 15%
}

export interface RoboCompareResult {
  valorFinalDIY: number;
  valorFinalRobo: number;
  diferencaBruta: number;
  custoTaxaTotal: number;
  irPagoDIY: number;
  irPagoRobo: number;
  valorLiquidoDIY: number;
  valorLiquidoRobo: number;
  diferencaLiquida: number;
  valeAPena: boolean;
}

const IR_RATES = [
  { ate: 180, rate: 0.225 },
  { ate: 360, rate: 0.20 },
  { ate: 720, rate: 0.175 },
  { ate: Infinity, rate: 0.15 },
];

/**
 * Aliquota IR regressiva para venda de ativos (dias de holding).
 */
function alíquotaIR(dias: number): number {
  for (const r of IR_RATES) {
    if (dias <= r.ate) return r.rate;
  }
  return 0.15;
}

/**
 * Projectar valor futuro com aportes mensais (anualizado).
 * Formula: valor = P * (1+r)^n + M * [((1+r)^n - 1) / r] * (1+r)
 * Onde: P = patrimonio, r = taxa mensal, M = aporte, n = meses
 */
function projectFutureValue(
  patrimonioInicial: number,
  aporteMensal: number,
  taxaAnual: number,
  meses: number,
): number {
  if (taxaAnual === 0) {
    return patrimonioInicial + aporteMensal * meses;
  }
  const r = (1 + taxaAnual) ** (1 / 12) - 1;
  const compound = Math.pow(1 + r, meses);
  return patrimonioInicial * compound + (aporteMensal * (compound - 1) / r) * (1 + r);
}

export function calculateRoboCompare(input: RoboCompareInput): RoboCompareResult {
  const {
    patrimonioAtual,
    aporteMensal,
    anos,
    rentabilidadeBruta,
    taxaRobo,
    anosIR,
  } = input;

  const meses = anos * 12;

  // Sem IR: mesma rentabilidade
  const valorFinalDIY = projectFutureValue(patrimonioAtual, aporteMensal, rentabilidadeBruta, meses);
  const valorFinalRobo = projectFutureValue(patrimonioAtual, aporteMensal, rentabilidadeBruta, meses);

  // IR: so incide no resgate. Com robo, a taxa ja come a rentabilidade ao longo do caminho.
  // Para simplificar, calculamos IR apenas sobre o lucro na venda (resgate total).
  const lucroBruto = valorFinalDIY - patrimonioAtual - aporteMensal * meses;
  const diasHolding = anos * 365;
  const aliquota = alíquotaIR(diasHolding);
  const irPagoDIY = Math.max(lucroBruto, 0) * aliquota;

  // Robo: taxa cobrada anualmente sobre o patrimônio
  const patrimonioMedioRobo = (patrimonioAtual + valorFinalRobo) / 2;
  const custoTaxaTotal = patrimonioMedioRobo * taxaRobo * anos;
  const irPagoRobo = Math.max(valorFinalRobo - patrimonioAtual - aporteMensal * meses - custoTaxaTotal, 0) * aliquota;

  // Valor líquido = bruto - IR - taxas robo
  const valorLiquidoDIY = valorFinalDIY - irPagoDIY;
  const valorLiquidoRobo = valorFinalRobo - custoTaxaTotal - irPagoRobo;

  const diferencaLiquida = valorLiquidoDIY - valorLiquidoRobo;
  const valeAPena = diferencaLiquida > 0; // DIY > Robo → vale a pena fazer manual

  return {
    valorFinalDIY,
    valorFinalRobo,
    diferencaBruta: valorFinalDIY - valorFinalRobo,
    custoTaxaTotal,
    irPagoDIY,
    irPagoRobo,
    valorLiquidoDIY,
    valorLiquidoRobo,
    diferencaLiquida,
    valeAPena,
  };
}

export interface RoboAdvisor {
  name: string;
  slug: string;
  taxaAnual: number; // ex: 0.005 = 0.5% a.a.
  aporteMinimo: number;
  foco: 'renda-fixa' | 'multimercado' | 'carteira-global' | 'fii-acao';
  descricao: string;
  url: string;
  pros: string[];
  contras: string[];
}

export const ROBO_ADVISORS: RoboAdvisor[] = [
  {
    name: 'Warren',
    slug: 'warren',
    taxaAnual: 0.005,
    aporteMinimo: 100,
    foco: 'multimercado',
    descricao: 'Pioneira fee-based. Combina algoritmo + especialistas humanos.',
    url: 'https://warren.com.br',
    pros: ['Taxa acessível (0,5% a.a.)', 'Aporte mínimo baixo (R$ 100)', 'Didática forte'],
    contras: ['ReclameAqui com queixas de transparência', 'Foco em RF/multimercado, não tem FIIs individuais'],
  },
  {
    name: 'Vérios',
    slug: 'verios',
    taxaAnual: 0.005,
    aporteMinimo: 100,
    foco: 'multimercado',
    descricao: 'Taxa única "tudo incluso" (corretagem + custódia + administração).',
    url: 'https://verios.com.br',
    pros: ['Taxa fixa que cobre tudo', 'Modelo simples'],
    contras: ['Aporte mínimo variável (NÃO CONFIRMADO)', 'Pouca informação pública sobre a estratégia'],
  },
  {
    name: 'Magnetis (BTG)',
    slug: 'magnetis',
    taxaAnual: 0.006,
    aporteMinimo: 1000,
    foco: 'carteira-global',
    descricao: 'Carteira recomendada Markowitz + Life-Cycle, com cripto. Integrado ao BTG Digital.',
    url: 'https://magnetis.com.br',
    pros: ['Filha do BTG', 'Inclui cripto', 'Foco em alocação global'],
    contras: ['Aporte mínimo mais alto (R$ 1.000)', 'Taxa um pouco maior (0,6% a.a.)'],
  },
  {
    name: 'BTG Digital',
    slug: 'btg-digital',
    taxaAnual: 0.005,
    aporteMinimo: 1,
    foco: 'renda-fixa',
    descricao: 'Carteira automatizada via XP Allocation e Magnetis. Corretora com produtos próprios.',
    url: 'https://investimentos.btgpactual.com',
    pros: ['Aporte mínimo R$ 1', 'Ecossistema BTG completo', 'Múltiplas carteiras'],
    contras: ['Taxa sobre os produtos subjacentes', 'Opções de renda fixa dominantes'],
  },
  {
    name: 'Genial Investimentos',
    slug: 'genial',
    taxaAnual: 0.0,
    aporteMinimo: 1,
    foco: 'carteira-global',
    descricao: 'Corretagem zero + carteiras recomendadas (não é gestão discricionária).',
    url: 'https://www.genialinvestimentos.com.br',
    pros: ['Corretagem zero em ações', 'Aporte mínimo R$ 1', 'Recomendação manual do usuário'],
    contras: ['Não faz gestão automática (rebalanceamento é manual)', 'Taxa zero não significa grátis (tem produtos subjacentes)'],
  },
];
