/**
 * BullMQ Queue - configuração central.
 * Filas: alerts.raw, alerts.suggested, telegram.dispatch.
 */

import { Queue, QueueOptions } from 'bullmq';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface AlertRawJob {
  ticker: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  strategy: string;
  interval: string;
  timestamp: string;
  raw: Record<string, unknown>;
  userId: string;
}

export interface AlertSuggestedJob {
  alertId: string;
  userId: string;
  ticker: string;
  action: string;
  summary: string;
  reasoning: string;
  confidence: number;
  modelVersion: string;
}

export interface TelegramDispatchJob {
  userId: string;
  chatId: string;
  message: string;
}

@Injectable()
export class BullMQService implements OnModuleDestroy {
  readonly alertsRaw: Queue<AlertRawJob>;
  readonly alertsSuggested: Queue<AlertSuggestedJob>;
  readonly telegramDispatch: Queue<TelegramDispatchJob>;

  constructor(private readonly redisService: RedisService) {
    const connection = redisService.getClient();
    const baseOpts: QueueOptions = { connection };

    this.alertsRaw = new Queue<AlertRawJob>('alerts.raw', baseOpts);
    this.alertsSuggested = new Queue<AlertSuggestedJob>('alerts.suggested', baseOpts);
    this.telegramDispatch = new Queue<TelegramDispatchJob>('telegram.dispatch', baseOpts);
  }

  async onModuleDestroy() {
    await Promise.all([
      this.alertsRaw.close(),
      this.alertsSuggested.close(),
      this.telegramDispatch.close(),
    ]);
  }
}
