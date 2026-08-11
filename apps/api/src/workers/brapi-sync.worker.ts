/**
 * Worker brapi-sync: roda a cada 15min via runOnStartup.
 * Busca cotação de todos os holdings e atualiza Holding.lastPrice, dividendYield, pvp, marketValue.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma.service';
import { BrapiService } from '@/lib/brapi.service';
import { Prisma } from '@prisma/client';

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15min

@Injectable()
export class BrapiSyncWorker implements OnModuleInit {
  private readonly logger = new Logger(BrapiSyncWorker.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly brapi: BrapiService,
  ) {}

  async onModuleInit() {
    // Run 1x on startup
    this.runSync().catch((err) => this.logger.error('Initial sync failed:', err));
    // Then schedule every 15min
    this.timer = setInterval(() => {
      this.runSync().catch((err) => this.logger.error('Scheduled sync failed:', err));
    }, SYNC_INTERVAL_MS);
    this.logger.log(`BrapiSyncWorker scheduled every ${SYNC_INTERVAL_MS / 1000}s`);
  }

  async runSync(): Promise<void> {
    const holdings = await this.prisma.holding.findMany({
      select: { id: true, ticker: true, type: true, quantity: true },
    });

    if (holdings.length === 0) {
      this.logger.log('No holdings to sync');
      return;
    }

    const tickers = holdings.map((h) => h.ticker);
    this.logger.log(`Syncing ${tickers.length} holdings via brapi`);

    try {
      const quotes = await this.brapi.quoteBatch(tickers);
      const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

      let updated = 0;
      for (const h of holdings) {
        const q = quoteMap.get(h.ticker);
        if (!q) {
          this.logger.warn(`No quote for ${h.ticker}`);
          continue;
        }
        const lastPrice = new Prisma.Decimal(q.regularMarketPrice);
        const qty = new Prisma.Decimal(h.quantity);
        const marketValue = qty.times(lastPrice);

        await this.prisma.holding.update({
          where: { id: h.id },
          data: {
            lastPrice,
            dividendYield: q.dividendYield != null ? new Prisma.Decimal(q.dividendYield) : null,
            pvp: q.priceToBook != null ? new Prisma.Decimal(q.priceToBook) : null,
            marketValue,
            updatedAt: new Date(),
          },
        });
        updated++;
      }
      this.logger.log(`Synced ${updated}/${tickers.length} holdings`);
    } catch (err) {
      this.logger.error('brapi-sync failed:', err);
    }
  }
}
