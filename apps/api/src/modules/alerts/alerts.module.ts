/**
 * AlertsModule - webhook receiver + worker para alertas do TradingView.
 *
 * Pipeline: TradingView → HMAC validate → enqueue alerts.raw →
 * ai-suggest worker → Anthropic → Recommendation → enqueue alerts.suggested →
 * telegram-dispatch worker → Telegraf → user.
 */

import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AiWorker } from '@/workers/ai-suggest.worker';
import { TelegramDispatchWorker } from '@/workers/telegram-dispatch.worker';
import { BullMQService } from '@/lib/bullmq.service';
import { TelegramService } from '@/lib/telegram.service';
import { AnthropicService } from '@/lib/anthropic.service';
import { PrismaService } from '@/lib/prisma.service';
import { RedisService } from '@/lib/redis.service';

@Module({
  controllers: [AlertsController],
  providers: [
    AlertsService,
    AiWorker,
    TelegramDispatchWorker,
    BullMQService,
    TelegramService,
    AnthropicService,
    PrismaService,
    RedisService,
  ],
  exports: [AlertsService, BullMQService],
})
export class AlertsModule {}
