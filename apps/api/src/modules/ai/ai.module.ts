/**
 * AiModule - camada de IA para alertas E insights diários.
 */

import { Module } from '@nestjs/common';
import { AiWorker } from '@/workers/ai-suggest.worker';
import { TelegramDispatchWorker } from '@/workers/telegram-dispatch.worker';
import { DailyInsightsWorker } from '@/workers/daily-insights.worker';
import { BullMQService } from '@/lib/bullmq.service';
import { TelegramService } from '@/lib/telegram.service';
import { AnthropicService } from '@/lib/anthropic.service';
import { PrismaService } from '@/lib/prisma.service';
import { RedisService } from '@/lib/redis.service';

@Module({
  providers: [
    AiWorker,
    TelegramDispatchWorker,
    DailyInsightsWorker,
    BullMQService,
    TelegramService,
    AnthropicService,
    PrismaService,
    RedisService,
  ],
  exports: [BullMQService, AnthropicService],
})
export class AiModule {}
