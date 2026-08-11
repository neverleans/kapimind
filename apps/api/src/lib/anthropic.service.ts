/**
 * AnthropicService - wrapper do Anthropic SDK.
 * Modelo: claude-haiku-4-5-20251001 (barato + rapido).
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface SuggestionOutput {
  action: 'BUY' | 'HOLD' | 'SELL' | 'REBALANCE' | 'REVIEW' | 'NOTHING';
  summary: string;
  reasoning: string;
  confidence: number;
}

@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
  private client: Anthropic | null = null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.model = this.config.get<string>('ANTHROPIC_MODEL') ?? 'claude-haiku-4-5-20251001';
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not configured; AI suggestions will return REVIEW fallback');
    }
  }

  async suggest(input: {
    ticker: string;
    price: number;
    action: string;
    strategy: string;
    dividendYield?: number | null;
    pvp?: number | null;
  }): Promise<SuggestionOutput> {
    if (!this.client) {
      return this.fallback('IA desabilitada (ANTHROPIC_API_KEY ausente)');
    }

    const prompt = this.buildPrompt(input);
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 600,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });

      const block = response.content[0];
      if (block.type !== 'text') throw new Error('Unexpected response type');

      // Extract JSON from text (sometimes wrapped in ```json ... ```)
      const text = block.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      const parsed = JSON.parse(jsonMatch[0]) as SuggestionOutput;

      // Validate
      const validActions = ['BUY', 'HOLD', 'SELL', 'REBALANCE', 'REVIEW', 'NOTHING'];
      if (!validActions.includes(parsed.action)) throw new Error('Invalid action');
      if (parsed.confidence < 0 || parsed.confidence > 1) throw new Error('Invalid confidence');

      return {
        action: parsed.action,
        summary: parsed.summary.slice(0, 120),
        reasoning: parsed.reasoning,
        confidence: parsed.confidence,
      };
    } catch (err) {
      this.logger.error(`AI suggestion failed for ${input.ticker}:`, err);
      return this.fallback('Erro na chamada da IA — análise manual recomendada');
    }
  }

  private buildPrompt(input: {
    ticker: string;
    price: number;
    action: string;
    strategy: string;
    dividendYield?: number | null;
    pvp?: number | null;
  }): string {
    const dy = input.dividendYield?.toFixed(2) ?? 'N/D';
    const pvp = input.pvp?.toFixed(2) ?? 'N/D';
    return `Voce e um assistente de investimentos BRL. Recebeu um alerta do TradingView sobre ${input.ticker}.

Contexto:
- Ticker: ${input.ticker}
- Preco atual: R$ ${input.price.toFixed(2)}
- Acao sugerida (TV): ${input.action}
- Estrategia: ${input.strategy}
- Dividend Yield (12m): ${dy}%
- P/VP: ${pvp}

Baseie sua resposta nos seguintes livros-texto (NÃO invente dados):
- Graham (Investidor Inteligente): Mr. Market, margem de seguranca (30-50%), investidor defensivo
- Damodaran (Little Book of Valuation): valor intrinseco, DCF, adaptacao por ciclo de vida
- Brodersen/Pysh (Buffett Accounting): 4 principios (gestao vigilante, longo prazo, estavel, preco atrativo)
- Malkiel (Random Walk): index funds > stock picking, custos destroem retornos, tempo > timing
- Eker (Mente Milionaria): pagar-se primeiro, controle emocional
- Kiyosaki (Pai Rico): ativos vs passivos, IQ financeiro
- Marcos Abe (Manual AT): tendencia, volume confirma, gestao de capital

Responda EXCLUSIVAMENTE em JSON valido, sem markdown:

{
  "action": "BUY" | "HOLD" | "SELL" | "REBALANCE" | "REVIEW" | "NOTHING",
  "summary": "PT-BR com ate 120 caracteres",
  "reasoning": "PT-BR com 2-3 paragrafos citando o livro que justifica a decisao",
  "confidence": numero entre 0.0 e 1.0
}

Se faltar contexto, confidence < 0.4. NUNCA invente cotacoes ou dados.`;
  }

  private fallback(reason: string): SuggestionOutput {
    return {
      action: 'REVIEW',
      summary: reason,
      reasoning: 'Sem IA ativa. Operador deve analisar manualmente antes de agir.',
      confidence: 0,
    };
  }
}
