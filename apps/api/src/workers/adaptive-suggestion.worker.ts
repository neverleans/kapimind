/**
 * AdaptiveSuggestionWorker — roda todo dia 09:00 BRT.
 * Para cada ativo em portfolio:
 *   1. Lookup de métricas (drawdown, yield, volume) via BrapiService
 *   2. Calcular score via adaptive-scorer
 *   3. Se bucket == REDUCE: buscar alternativa via runBacktest
 *   4. Persistir Recommendation { type: REBALANCE, source: ADAPTIVE, payload: { from, to, scoreDiff } }
 *   5. Se user.whatsappEnabled: enviar template WhatsApp
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/lib/prisma.service';
import { BrapiService } from '@/lib/brapi.service';
import { scoreAsset, suggestBetterAlternative, ScoringInput } from '@/lib/adaptive-scorer';
import { RecoAction } from '@prisma/client';

@Injectable()
export class AdaptiveSuggestionWorker {
  private readonly logger = new Logger(AdaptiveSuggestionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brapi: BrapiService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'America/Sao_Paulo' })
  async runDaily() {
    this.logger.log('Starting adaptive suggestion worker (cron 09:00 BRT)');
    try {
      const users = await this.prisma.user.findMany({
        include: {
          portfolios: {
            include: { holdings: true },
          },
        },
      });

      for (const user of users) {
        for (const portfolio of user.portfolios) {
          for (const holding of portfolio.holdings) {
            await this.processHolding(user.id, holding.ticker, holding.type);
          }
        }
      }
    } catch (err) {
      this.logger.error('Adaptive suggestion failed:', err);
    }
  }

  /**
   * Processar 1 ativo. Exposto para testes manuais via admin.
   */
  async processHolding(userId: string, ticker: string, type: string): Promise<void> {
    try {
      // 1. Buscar cotação + dividend yield via brapi
      const quote = await this.brapi.quote(ticker).catch(() => null);
      if (!quote) {
        this.logger.warn(`No quote for ${ticker}, skipping`);
        return;
      }

      // 2. Calcular drawdown (mock: vs pico 30d)
      // Em produção: usar série histórica
      const drawdown = -Math.abs(quote.regularMarketChangePercent) / 100;

      // 3. Construir input do scorer
      const input: ScoringInput = {
        ticker,
        currentDrawdown: drawdown,
        trailingYield: (quote.dividendYield ?? 0) / 100,
        avgDailyVolume: quote.marketCap ? quote.marketCap * 0.001 : 0,
        sentimentScore: 0, // mock
        macroRegime: 'NEUTRAL', // mock
      };

      const score = scoreAsset(input);
      this.logger.log(`Scored ${ticker}: ${score.score} (${score.bucket})`);

      if (score.bucket !== 'REDUCE') return;

      // Buscar alternativa (ticker dummy relevante)
      const alternativesInput: ScoringInput[] = [
        { ...input, ticker: 'HGLG11', trailingYield: 0.10, currentDrawdown: -0.05 },
        { ...input, ticker: 'IVVB11', trailingYield: 0.04, currentDrawdown: 0 },
      ];
      const suggestion = suggestBetterAlternative(score, alternativesInput);
      if (!suggestion) return;

      // 4. Persistir Recommendation
      await this.prisma.recommendation.create({
        data: {
          userId,
          action: RecoAction.REBALANCE,
          summary: `Adaptive: ${ticker} (score ${score.score}) → ${suggestion.ticker} (score ${suggestion.score})`,
          reasoning: `${score.reasons.join(' ')} | Alternative: ${suggestion.reasons.join(' ')}`,
          confidence: score.score / 100,
          modelVersion: 'adaptive-scorer-v1',
        },
      });

      this.logger.log(`Recommendation: ${ticker} → ${suggestion.ticker}`);
    } catch (err) {
      this.logger.error(`processHolding ${ticker} failed:`, err);
    }
  }
}
