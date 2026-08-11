/**
 * AdminModule - exposição de endpoints de monitoramento.
 */

import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { DailyInsightsWorker } from '@/workers/daily-insights.worker';
import { PrismaService } from '@/lib/prisma.service';

@Module({
  controllers: [AdminController],
  providers: [DailyInsightsWorker, PrismaService],
  exports: [DailyInsightsWorker],
})
export class AdminModule {}
