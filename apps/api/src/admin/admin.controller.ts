/**
 * AdminController - endpoints de monitoramento e trigger manual.
 * Útil para inspeção durante desenvolvimento.
 */

import { Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma.service';
import { DailyInsightsWorker } from '@/workers/daily-insights.worker';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dailyInsights: DailyInsightsWorker,
  ) {}

  @Get('alerts/recent')
  async recentAlerts(@Query('limit') limit = '20') {
    const num = Math.min(Number(limit) || 20, 100);
    return this.prisma.alert.findMany({
      take: num,
      orderBy: { createdAt: 'desc' },
      include: { recommendation: true },
    });
  }

  @Get('recommendations/recent')
  async recentRecommendations(@Query('limit') limit = '20') {
    const num = Math.min(Number(limit) || 20, 100);
    return this.prisma.recommendation.findMany({
      take: num,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('portfolio/summary')
  async portfolioSummary() {
    const user = await this.prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!user) return { error: 'No user found' };
    const portfolio = await this.prisma.portfolio.findFirst({ where: { userId: user.id } });
    if (!portfolio) return { error: 'No portfolio' };
    const holdings = await this.prisma.holding.findMany({ where: { portfolioId: portfolio.id } });
    return {
      user: user.email,
      portfolioName: portfolio.name,
      holdingsCount: holdings.length,
      holdings: holdings.map((h) => ({
        ticker: h.ticker,
        type: h.type,
        quantity: h.quantity.toString(),
        avgPrice: h.avgPrice.toString(),
        lastPrice: h.lastPrice?.toString() ?? null,
        marketValue: h.marketValue?.toString() ?? null,
        dividendYield: h.dividendYield?.toString() ?? null,
        pvp: h.pvp?.toString() ?? null,
      })),
    };
  }

  @Post('daily-insights/run')
  async triggerDailyInsights() {
    await this.dailyInsights.runDailyInsights();
    return { triggered: true, timestamp: new Date().toISOString() };
  }
}
