/**
 * AlertsService - recebe alertas do TradingView, persiste, enfileira.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AlertSource, Prisma } from '@prisma/client';
import { PrismaService } from '@/lib/prisma.service';
import { BullMQService, AlertRawJob } from '@/lib/bullmq.service';

interface TradingViewPayload {
  ticker: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  strategy: string;
  interval: string;
  timestamp?: string;
  userId?: string;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: BullMQService,
  ) {}

  async receiveAlert(payload: TradingViewPayload) {
    // Resolve user (default to seed-user / single-user mode)
    const userId = payload.userId ?? (await this.getDefaultUserId());

    const alert = await this.prisma.alert.create({
      data: {
        userId,
        source: AlertSource.TRADINGVIEW,
        ticker: payload.ticker,
        kind: payload.strategy,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Alert ${alert.id} from TradingView for ${payload.ticker}`);

    // Enqueue raw alert for AI processing
    const job: AlertRawJob = {
      ticker: payload.ticker,
      action: payload.action,
      price: payload.price,
      strategy: payload.strategy,
      interval: payload.interval,
      timestamp: payload.timestamp ?? new Date().toISOString(),
      raw: { ...payload },
      userId,
    };
    await this.queues.alertsRaw.add('process', job);

    return { alertId: alert.id, queued: true };
  }

  private async getDefaultUserId(): Promise<string> {
    const user = await this.prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!user) throw new Error('No user found. Run seed first.');
    return user.id;
  }
}
