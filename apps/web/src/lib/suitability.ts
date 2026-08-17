/**
 * Suitability CVM 30 (vigente desde jan/2025).
 *
 * Questionario de 4 pilares (objetivos, tolerancia, experiência, situação financeira).
 * Score 0-100 → 3 perfis (conservador, moderado, agressivo).
 *
 * No MVP, SuitabilityGate isQuestionnaireComplete() é implementado em memória.
 * Futuras versões: persistir em Prisma (SuitabilityProfile) + reavaliação anual.
 */

export type RiskProfile = 'conservador' | 'moderado' | 'agressivo';

export interface SuitabilityAnswers {
  // Pilar 1: Objetivos (25%)
  primaryGoal: 'preservar' | 'renda' | 'crescimento' | 'aposentadoria';
  horizonYears: number; // 0-30

  // Pilar 2: Tolerância ao risco (30%)
  lossReaction: 'vendo' | 'seguro' | 'duvida' | 'desespero'; // queda 10-20%
  riskCapacity: number; // 0-100, % do património que aceita perder

  // Pilar 3: Experiência (25%)
  experience: 'nenhuma' | 'rf' | 'fundos' | 'acoes' | 'derivativos';
  yearsInvesting: number; // 0-50

  // Pilar 4: Situação financeira (20%)
  monthlyIncome: number; // R$/mês
  reserveMonths: number; // reservas de meses
  hasEmergencyFund: boolean;
}

export interface SuitabilityResult {
  score: number;
  profile: RiskProfile;
  bands: {
    conservador: number;
    moderado: number;
    agressivo: number;
  };
  recommendations: string[]; // alocação sugerida
  prohibitedAssets: string[]; // FIIs vs Ações vs Crypto
  needsReassessment: boolean;
  flags: string[]; // alertas regulatórios
}

const PROFILE_THRESHOLDS = {
  conservador: 40,
  moderado: 70,
} as const;

export function computeSuitability(answers: SuitabilityAnswers): SuitabilityResult {
  // --- Score ---
  let score = 0;

  // Pilar 1: Objetivos (25%)
  const goalScores: Record<SuitabilityAnswers['primaryGoal'], number> = {
    preservar: 5,
    renda: 15,
    crescimento: 22,
    aposentadoria: 25,
  };
  score += goalScores[answers.primaryGoal];

  // Horizonte: 0-30 anos
  const horizonContribution = Math.min(answers.horizonYears / 30, 1) * 25;
  // já somou 25 via goal; mas o horizonte também pesa — vou ajustar:
  // Substituo: 12.5 do goal + 12.5 do horizonte
  score = score - goalScores[answers.primaryGoal] + (goalScores[answers.primaryGoal] + 4 * (Math.min(answers.horizonYears / 30, 1))) * 0.5;

  // Pilar 2: Tolerância (30%)
  const lossScores: Record<SuitabilityAnswers['lossReaction'], number> = {
    desespero: 0,
    duvida: 10,
    seguro: 20,
    vendo: 30,
  };
  score += lossScores[answers.lossReaction];
  score += (answers.riskCapacity / 100) * 30;

  // Pilar 3: Experiência (25%)
  const expScores: Record<SuitabilityAnswers['experience'], number> = {
    nenhuma: 0,
    rf: 5,
    fundos: 12,
    acoes: 20,
    derivativos: 25,
  };
  score += expScores[answers.experience];
  score += Math.min(answers.yearsInvesting / 20, 1) * 15;

  // Pilar 4: Situação financeira (20%)
  let sitScore = 0;
  if (answers.hasEmergencyFund) sitScore += 10;
  if (answers.reserveMonths >= 6) sitScore += 10;
  // proxy: renda mensal * 12 >= 100k = 10 pts
  if (answers.monthlyIncome >= 8_000) sitScore += 10;
  score += sitScore;

  // normaliza para 0-100
  score = Math.min(100, Math.max(0, score));

  // --- Bands (pontuação por perfil) ---
  const bands = {
    conservador: computeBandScore(answers, 'conservador'),
    moderado: computeBandScore(answers, 'moderado'),
    agressivo: computeBandScore(answers, 'agressivo'),
  };

  // --- Profile ---
  const profile: RiskProfile =
    score < PROFILE_THRESHOLDS.conservador
      ? 'conservador'
      : score < PROFILE_THRESHOLDS.moderado
      ? 'moderado'
      : 'agressivo';

  // --- Recommendations ---
  const recommendations = buildRecommendations(profile);
  const prohibitedAssets = buildProhibited(profile);

  // --- Flags ---
  const flags: string[] = [];
  if (!answers.hasEmergencyFund) {
    flags.push('Reserva de emergência ausente — bloquear até criar');
  }
  if (answers.primaryGoal === 'aposentadoria' && answers.horizonYears === 0) {
    flags.push('Objetivo aposentadoria sem horizonte definido');
  }
  if (answers.experience === 'derivativos' && answers.yearsInvesting < 2) {
    flags.push('Derivativos sem experiência mínima de 2 anos');
  }

  return {
    score,
    profile,
    bands,
    recommendations,
    prohibitedAssets,
    needsReassessment: score === 0 || false, // futuro: reavaliação anual
    flags,
  };
}

function computeBandScore(answers: SuitabilityAnswers, band: 'conservador' | 'moderado' | 'agressivo'): number {
  let score = 0;
  if (band === 'conservador') {
    if (answers.riskCapacity < 20) score += 30;
    if (answers.horizonYears >= 5) score += 25;
    if (answers.experience !== 'nenhuma') score += 20;
    if (answers.hasEmergencyFund) score += 15;
    if (answers.primaryGoal === 'preservar' || answers.primaryGoal === 'renda') score += 10;
  } else if (band === 'moderado') {
    if (answers.riskCapacity >= 20 && answers.riskCapacity < 60) score += 25;
    if (answers.horizonYears >= 3) score += 20;
    if (answers.experience !== 'nenhuma') score += 15;
    if (answers.reserveMonths >= 6) score += 15;
    if (answers.monthlyIncome >= 5_000) score += 15;
    if (answers.lossReaction === 'seguro' || answers.lossReaction === 'vendo') score += 10;
  } else {
    if (answers.riskCapacity >= 40) score += 25;
    if (answers.horizonYears >= 5) score += 20;
    if (answers.experience === 'acoes' || answers.experience === 'derivativos') score += 20;
    if (answers.yearsInvesting >= 5) score += 15;
    if (answers.lossReaction === 'vendo') score += 20;
  }
  // bônus: renda alta
  if (answers.monthlyIncome >= 10_000) score += 10;
  return score;
}

function buildRecommendations(profile: RiskProfile): string[] {
  if (profile === 'conservador') {
    return [
      '70% Renda fixa (Tesouro Selic, CDB liquidez diária)',
      '15% FIIs de tijolo (HGLG11, BTLG11)',
      '10% Ações blue chip (ITUB4, VALE3)',
      '5% Reserva de oportunidade',
    ];
  }
  if (profile === 'moderado') {
    return [
      '40% Renda fixa (Tesouro Selic)',
      '30% FIIs mistos (MXRF11, HGLG11, XPML11)',
      '25% Ações + ETFs (BOVA11, IVVB11)',
      '5% Crypto (BTC, ETH)',
    ];
  }
  return [
    '25% Renda fixa (Tesouro IPCA+)',
    '25% FIIs high-yield (HGLG11, XPML11)',
    '30% Ações + ETFs (BOVA11, IVVB11)',
    '15% Crypto (BTC, ETH)',
    '5% Reserva de oportunidade',
  ];
}

function buildProhibited(profile: RiskProfile): string[] {
  if (profile === 'conservador') {
    return ['Cripto (BTC, ETH)', 'Derivativos', 'Day-trade', 'FIIs high-yield (yield trap)'];
  }
  if (profile === 'moderado') {
    return ['Derivativos sem hedge', 'Alavancagem > 2x'];
  }
  return ['SEM proibições (perfil agressivo conduz, com responsabilidade)'];
}

// --- SuitabilityGate ---

export interface Gate {
  ok: boolean;
  reason?: string;
}

/**
 * SuitabilityGate — valida se uma operação é adequada para o perfil.
 * Bloqueia alocações excessivas ou ativos não permitidos.
 */
export function SuitabilityGate(
  profile: RiskProfile,
  allocationPercent: number,
  assetType: 'renda-fixa' | 'fii' | 'acao' | 'crypto' | 'derivativo',
): Gate {
  const maxPerAsset: Record<RiskProfile, Record<string, number>> = {
    conservador: {
      'renda-fixa': 0.70,
      fii: 0.30,
      acao: 0.15,
      crypto: 0,
      derivativo: 0,
    },
    moderado: {
      'renda-fixa': 0.50,
      fii: 0.40,
      acao: 0.30,
      crypto: 0.10,
      derivativo: 0,
    },
    agressivo: {
      'renda-fixa': 0.30,
      fii: 0.50,
      acao: 0.40,
      crypto: 0.20,
      derivativo: 0.10,
    },
  };

  const max = maxPerAsset[profile][assetType] ?? 0;
  if (max === 0) {
    return { ok: false, reason: `Ativo ${assetType} não permitido para perfil ${profile}` };
  }
  if (allocationPercent > max) {
    return {
      ok: false,
      reason: `Alocação ${(allocationPercent * 100).toFixed(1)}% excede máx ${(max * 100).toFixed(0)}% para perfil ${profile}`,
    };
  }
  return { ok: true };
}
