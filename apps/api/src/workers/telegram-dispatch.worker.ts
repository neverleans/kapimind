/**
 * Telegram Dispatch Worker - consome alerts.suggested → envia mensagem via Telegraf.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisService } from '@/lib/redis.service';
import { BullMQService, AlertSuggestedJob } from '@/lib/bullmq.service';
import { TelegramService } from '@/lib/telegram.service';
import { PrismaService } from '@/lib/prisma.service';

@Injectable()
export class TelegramDispatchWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramDispatchWorker.name);
  private worker: Worker<AlertSuggestedJob> | null = null;

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly queues: BullMQService,
  ) {}

  async onModuleInit() {
    this.worker = new Worker<AlertSuggestedJob>(
      'alerts.suggested',
      async (job) => this.dispatch(job),
      { connection: this.redis.getClient(), concurrency: 2 },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Telegram dispatch failed for job ${job?.id}: ${err.message}`);
    });

    this.logger.log('TelegramDispatchWorker started');
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async dispatch(job: Job<AlertSuggestedJob>): Promise<void> {
    const { userId, ticker, action, summary, confidence } = job.data;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.telegramChatId) {
      this.logger.warn(`User ${userId} has no telegramChatId; skipping`);
      return;
    }

    const message = this.formatMessage(job.data);
    await this.telegram.sendMessage(user.telegramChatId, message);
    this.logger.log(`Telegram message sent to ${user.telegramChatId} for ${ticker}`);
  }

  private formatMessage(job: AlertSuggestedJob): string {
    const conf = (job.confidence * 100).toFixed(0);
    return `🔔 *${job.ticker}* — Sugestão: *${job.action}*\n\n${job.summary}\n\n_Confiança: ${conf}%_\n\n_Detalhes: /alerts na plataforma_`;
  }
}
