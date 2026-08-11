/**
 * Daily Insights Worker - roda 03:00 BRT todo dia.
 * 1. Coleta alertas/recomendações das últimas 24h
 * 2. Detecta padrões (mesmo ticker alertou 3x+ em 7 dias)
 * 3. Chama Anthropic com contexto macro + alerta
 * 4. Persiste Recommendation consolidada
 * 5. Enfileira para Telegram
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from '@/lib/prisma.service';
import { AnthropicService } from '@/lib/anthropic.service';
import { BullMQService, AlertSuggestedJob } from '@/lib/bullmq.service';
import { RecoAction, AlertSource } from '@prisma/client';

const CRON_EXPR = '0 3 * * *'; // 03:00 BRT diário

@Injectable()
export class DailyInsightsWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DailyInsightsWorker.name);
  private task: ReturnType<typeof cron.schedule> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly anthropic: AnthropicService,
    private readonly queues: BullMQService,
  ) {}

  async onModuleInit() {
    this.task = cron.schedule(CRON_EXPR, async () => {
      try {
        await this.runDailyInsights();
      } catch (err) {
        this.logger.error('Daily insights failed:', err);
      }
    });

    this.logger.log(`DailyInsightsWorker scheduled: ${CRON_EXPR}`);
  }

  async onModuleDestroy() {
    if (this.task) {
      this.task.stop();
    }
  }

  async runDailyInsights(): Promise<void> {
    this.logger.log('Running daily insights job');

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = new Date();

    // Aggregate alerts from last 24h
    const recentAlerts = await this.prisma.alert.findMany({
      where: { createdAt: { gte: since } },
      include: { recommendation: true },
      orderBy: { createdAt: 'desc' },
    });

    if (recentAlerts.length === 0) {
      this.logger.log('No alerts in last 24h; skipping');
      return;
    }

    // Detect patterns: same ticker > 3x in 7 days
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const pattern = await this.prisma.alert.groupBy({
      by: ['ticker'],
      where: { createdAt: { gte: last7d } },
      _count: { ticker: true },
      having: { ticker: { _count: { gt: 3 } } },
    });

    const hotTickers = pattern.map((p) => `${p.ticker} (${p._count.ticker})`).join(', ');

    // Build macro context
    const totalAlerts = recentAlerts.length;
    const recomendorias = recentAlerts.filter((a) => a.recommendation).length;
    const uniqueTickers = new Set(recentAlerts.map((a) => a.ticker).filter(Boolean));

    const summary = `Últimas 24h: ${totalAlerts} alertas, ${recomendorias} recomendações, ${uniqueTickers.size} tickers únicos. ${
      hotTickers ? 'TICKERS QUENTES (7d): ' + hotTickers : 'Sem padrão de repetição.'
    }`;

    // Get default user
    const user = await this.prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!user) {
      this.logger.warn('No user found; skipping insights');
      return;
    }

    // Pick first ticker from recent alerts for suggestion
    const targetTicker = recentAlerts[0]?.ticker;
    if (!targetTicker) {
      this.logger.log('No ticker in recent alerts');
      return;
    }

    // Lookup holding if exists
    const holding = await this.prisma.holding.findFirst({
      where: { portfolio: { userId: user.id }, ticker: targetTicker },
    });

    // Ask AI for daily insight
    const suggestion = await this.anthropic.suggest({
      ticker: targetTicker,
      price: holding?.lastPrice ? Number(holding.lastPrice) : 0,
      action: 'HOLD',
      strategy: 'daily_rebalance',
      dividendYield: holding?.dividendYield ? Number(holding.dividendYield) : null,
      pvp: holding?.pvp ? Number(holding.pvp) : null,
    });

    // Persist Recommendation
    const recommendation = await this.prisma.recommendation.create({
      data: {
        userId: user.id,
        action: (suggestion.action === 'NOTHING' ? 'REBALANCE' : suggestion.action) as RecoAction,
        summary: `Insight diário: ${suggestion.summary}`,
        reasoning: `${summary}\n\n${suggestion.reasoning}`,
        confidence: suggestion.confidence,
        modelVersion: 'claude-haiku-4-5-20251001',
      },
    });

    this.logger.log(`Daily recommendation ${recommendation.id} created for ${targetTicker}`);

    // Enqueue for Telegram (if user has chatId)
    if (user.telegramChatId) {
      const job: AlertSuggestedJob = {
        alertId: '',
        userId: user.id,
        ticker: targetTicker,
        action: suggestion.action,
        summary: `🌅 ${suggestion.summary}`,
        reasoning: suggestion.reasoning,
        confidence: suggestion.confidence,
        modelVersion: 'claude-haiku-4-5-20251001',
      };
      await this.queues.alertsSuggested.add('daily', job);
    }
  }
}
