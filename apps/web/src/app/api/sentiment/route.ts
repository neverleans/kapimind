/**
 * API route para análise de sentimento de texto.
 * MVP: usa lib lexical local (rapido, deterministico).
 * Em produção: integra com Hugging Face Inference API
 * (lucas-leme/FinBERT-PT-BR ou lucasalmda/pt-br-financial-sentiment-analysis).
 */

import { NextResponse } from 'next/server';
import { computeSentiment, sentimentToBadge } from '@/lib/sentiment';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; source?: 'feed' | 'news' | 'social' };
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }
    const result = computeSentiment({
      text: body.text,
      source: body.source,
    });
    return NextResponse.json({
      score: result.score,
      label: result.label,
      confidence: result.confidence,
      signals: result.signals,
      badge: sentimentToBadge(result.score),
      source: result.source,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_payload', message: err instanceof Error ? err.message : 'Erro' },
      { status: 400 },
    );
  }
}
