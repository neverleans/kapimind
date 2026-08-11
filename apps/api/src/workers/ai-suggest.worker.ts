/**
 * AI Worker - processa alerts.raw → chama Anthropic → persiste Recommendation → enfileira alerts.suggested.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisService } from '@/lib/redis.service';
import { AnthropicService } from '@/lib/anthropic.service';
import { BullMQService, AlertRawJob, AlertSuggestedJob } from '@/lib/bullmq.service';
import { PrismaService } from '@/lib/prisma.service';
import { AlertSource, RecoAction } from '@prisma/client';

@Injectable()
export class AiWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiWorker.name);
  private worker: Worker<AlertRawJob> | null = null;

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly anthropic: AnthropicService,
    private readonly queues: BullMQService,
  ) {}

  async onModuleInit() {
    this.worker = new Worker<AlertRawJob>(
      'alerts.raw',
      async (job) => this.process(job),
      { connection: this.redis.getClient(), concurrency: 5 },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed for ${job.data.ticker}`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log('AiWorker started (concurrency=5)');
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('AiWorker stopped');
    }
  }

  private async process(job: Job<AlertRawJob>): Promise<void> {
    const { ticker, userId } = job.data;

    // Already have an alert from trading view webhook
    const alert = await this.prisma.alert.findFirst({
      where: { userId, ticker, source: AlertSource.TRADINGVIEW },
      orderBy: { createdAt: 'desc' },
    });
    if (!alert) {
      this.logger.warn(`No alert found for ${ticker}`);
      return;
    }

    // Lookup holding metrics for context
    const holding = await this.prisma.holding.findFirst({
      where: { portfolio: { userId }, ticker },
    });

    // Call AI
    const suggestion = await this.anthropic.suggest({
      ticker,
      price: job.data.price,
      action: job.data.action,
      strategy: job.data.strategy,
      dividendYield: holding?.dividendYield ? Number(holding.dividendYield) : null,
      pvp: holding?.pvp ? Number(holding.pvp) : null,
    });

    // Persist Recommendation
    const recommendation = await this.prisma.recommendation.create({
      data: {
        userId,
        alertId: alert.id,
        action: suggestion.action as RecoAction,
        summary: suggestion.summary,
        reasoning: suggestion.reasoning,
        confidence: suggestion.confidence,
        modelVersion: 'claude-haiku-4-5-20251001',
      },
    });

    // Update alert status
    await this.prisma.alert.update({
      where: { id: alert.id },
      data: { status: 'REVIEWED' },
    });

    // Enqueue for Telegram
    const suggestedJob: AlertSuggestedJob = {
      alertId: alert.id,
      userId,
      ticker,
      action: suggestion.action,
      summary: suggestion.summary,
      reasoning: suggestion.reasoning,
      confidence: suggestion.confidence,
      modelVersion: 'claude-haiku-4-5-20251001',
    };
    await this.queues.alertsSuggested.add('dispatch', suggestedJob);

    this.logger.log(`Recommendation ${recommendation.id} created for ${ticker}`);
  }
}
