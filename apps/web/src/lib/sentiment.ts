/**
 * SentimentFinBERT — pure function que calcula score de sentimento.
 *
 * Compõe 3 sinais didáticos:
 * 1. Palavras-chave (rapido, deterministico)
 * 2. Score numerico de lexical overlap (basico)
 * 3. Estrutura sintatica (presenca de intensificadores)
 *
 * No MVP, nao chama Hugging Face Inference API (HF) — seria necessario
 * adicionar fetch com retry + cache. Fica pronto para integracao.
 *
 * Para Kapimind, score -1 a +1:
 * - < -0.3: bearish (venda)
 * - -0.3 a 0.3: neutro
 * - > 0.3: bullish (compra)
 */

export interface InputSentiment {
  text: string;
  source?: 'feed' | 'news' | 'social';
}

export interface OutputSentiment {
  score: number; // -1 (muito negativo) a +1 (muito positivo)
  label: 'muito-negativo' | 'negativo' | 'neutro' | 'positivo' | 'muito-positivo';
  confidence: number; // 0-1
  signals: {
    bullish: string[];
    bearish: string[];
    intensifiers: string[];
  };
  source?: 'lexical' | 'hf-inference' | 'mixed';
  hfScore?: number;
}

const BULLISH_TERMS = [
  'alta', 'subiu', 'sobe', 'cresce', 'crescimento', 'lucro', 'lucrou', 'positivo',
  'otimo', 'bom', 'forte', 'fortalecido', 'expandido', 'recorde', 'aprovado',
  'dividendo', 'dividendos', 'yield', 'valorizado', 'otimista', 'positivo',
  'alta', 'forte', 'beneficio', 'oportunidade', 'crescimento', 'ganhou',
];

const BEARISH_TERMS = [
  'queda', 'caiu', 'cai', 'despenca', 'despencou', 'perda', 'perdeu', 'negativo',
  'ruim', 'fraco', 'enfraquecido', 'pressionado', 'rejeitado', 'recuo',
  'prejuizo', 'prejuizo', 'cortou', 'reduziu', 'cortado', 'reduzido',
  'pessimista', 'derrota', 'pessimo', 'pessimo', 'pessimo',
  'risco', 'incerteza', 'calote', 'default', 'restruturacao',
];

const POSITIVE_INTENSIFIERS = ['muito', 'extremamente', 'altamente', 'fortemente', 'amplamente', 'significativamente'];
const NEGATIVE_INTENSIFIERS = ['pouco', 'levemente', 'pouco', 'fracamente', 'minimamente'];

export function computeSentiment(input: InputSentiment): OutputSentiment {
  const text = input.text.toLowerCase();
  const tokens = text.split(/\s+/);

  const bullishMatches: string[] = [];
  const bearishMatches: string[] = [];
  const intensifiers: string[] = [];

  for (const token of tokens) {
    const cleaned = token.replace(/[.,;:!?\"]/g, '');
    if (BULLISH_TERMS.includes(cleaned)) bullishMatches.push(cleaned);
    if (BEARISH_TERMS.includes(cleaned)) bearishMatches.push(cleaned);
    if (POSITIVE_INTENSIFIERS.includes(cleaned) || NEGATIVE_INTENSIFIERS.includes(cleaned)) {
      intensifiers.push(cleaned);
    }
  }

  // Composição base
  let score = (bullishMatches.length - bearishMatches.length) / Math.max(tokens.length, 5);

  // Bônus: intensificadores multiplicam o sinal
  for (const int of intensifiers) {
    if (POSITIVE_INTENSIFIERS.includes(int)) score += 0.05;
    if (NEGATIVE_INTENSIFIERS.includes(int)) score -= 0.05;
  }

  // Clamp
  score = Math.max(-1, Math.min(1, score));

  // Confidence: até 0.7+. Aumenta com matches.
  const confidence = Math.min(0.95, 0.3 + (bullishMatches.length + bearishMatches.length) * 0.1);

  // Label
  const label: OutputSentiment['label'] =
    score < -0.6 ? 'muito-negativo' :
    score < -0.2 ? 'negativo' :
    score < 0.2 ? 'neutro' :
    score < 0.6 ? 'positivo' :
    'muito-positivo';

  return {
    score,
    label,
    confidence,
    signals: {
      bullish: bullishMatches,
      bearish: bearishMatches,
      intensifiers,
    },
    source: 'lexical',
  };
}

/**
 * Helper: traduz score em label PT-BR.
 */
export function sentimentToBadge(score: number): 'REDUCE' | 'HOLD' | 'INCREASE' {
  if (score < -0.3) return 'REDUCE';
  if (score > 0.3) return 'INCREASE';
  return 'HOLD';
}
