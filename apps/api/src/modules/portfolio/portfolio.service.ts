import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma.service';
import { AssetType, TxType, Prisma } from '@prisma/client';

interface CreateHoldingData {
  ticker: string;
  type: AssetType;
  quantity: number;
  avgPrice: number;
}

interface CreateTransactionData {
  ticker: string;
  type: TxType;
  quantity: number;
  price: number;
  fees: number;
  occurredAt: string | Date;
  notes?: string;
}

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPortfolio(id: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id },
      include: { holdings: true, transactions: { take: 50, orderBy: { occurredAt: 'desc' } } },
    });
    if (!portfolio) throw new NotFoundException(`Portfolio ${id} not found`);
    return portfolio;
  }

  async updatePortfolio(id: string, data: { name?: string; broker?: string }) {
    return this.prisma.portfolio.update({ where: { id }, data });
  }

  async listHoldings(portfolioId: string) {
    return this.prisma.holding.findMany({
      where: { portfolioId },
      orderBy: { ticker: 'asc' },
    });
  }

  async addHolding(portfolioId: string, data: CreateHoldingData) {
    // Reject duplicate ticker
    const existing = await this.prisma.holding.findUnique({
      where: { portfolioId_ticker: { portfolioId, ticker: data.ticker } },
    });
    if (existing) {
      throw new ConflictException(`Holding ${data.ticker} already exists in portfolio ${portfolioId}`);
    }
    return this.prisma.holding.create({
      data: {
        portfolioId,
        ticker: data.ticker,
        type: data.type,
        quantity: new Prisma.Decimal(data.quantity),
        avgPrice: new Prisma.Decimal(data.avgPrice),
      },
    });
  }

  async removeHolding(portfolioId: string, ticker: string) {
    const existing = await this.prisma.holding.findUnique({
      where: { portfolioId_ticker: { portfolioId, ticker } },
    });
    if (!existing) throw new NotFoundException(`Holding ${ticker} not found`);
    await this.prisma.holding.delete({
      where: { portfolioId_ticker: { portfolioId, ticker } },
    });
    return { ticker, deleted: true };
  }

  async listTransactions(
    portfolioId: string,
    filters: { ticker?: string; from?: string; to?: string },
  ) {
    const where: Prisma.TransactionWhereInput = { portfolioId };
    if (filters.ticker) where.ticker = filters.ticker;
    if (filters.from || filters.to) {
      where.occurredAt = {};
      if (filters.from) where.occurredAt.gte = new Date(filters.from);
      if (filters.to) where.occurredAt.lte = new Date(filters.to);
    }
    return this.prisma.transaction.findMany({ where, orderBy: { occurredAt: 'desc' } });
  }

  async addTransaction(portfolioId: string, data: CreateTransactionData) {
    const occurredAt = typeof data.occurredAt === 'string' ? new Date(data.occurredAt) : data.occurredAt;
    const total = data.quantity * data.price;
    return this.prisma.transaction.create({
      data: {
        portfolioId,
        ticker: data.ticker,
        type: data.type,
        quantity: new Prisma.Decimal(data.quantity),
        price: new Prisma.Decimal(data.price),
        total: new Prisma.Decimal(total),
        fees: new Prisma.Decimal(data.fees),
        occurredAt,
        notes: data.notes,
      },
    });
  }

  /**
   * Summary: holdings + derived market value + total invested + P&L.
   */
  async getSummary(portfolioId: string) {
    const holdings = await this.prisma.holding.findMany({ where: { portfolioId } });
    const transactions = await this.prisma.transaction.findMany({
      where: { portfolioId, type: { in: ['BUY', 'SELL'] } },
    });

    let totalInvested = new Prisma.Decimal(0);
    let totalValue = new Prisma.Decimal(0);
    let totalDividends = new Prisma.Decimal(0);

    // Calculate total invested from BUY transactions
    for (const tx of transactions) {
      if (tx.type === 'BUY') totalInvested = totalInvested.plus(tx.total);
      if (tx.type === 'SELL') totalInvested = totalInvested.minus(tx.total);
    }

    // Calculate current value from holdings
    for (const h of holdings) {
      const qty = new Prisma.Decimal(h.quantity);
      const avgPrice = new Prisma.Decimal(h.avgPrice);
      const lastPrice = h.lastPrice ? new Prisma.Decimal(h.lastPrice) : avgPrice;
      totalValue = totalValue.plus(qty.times(lastPrice));
    }

    // Calculate dividends
    const dividends = await this.prisma.transaction.aggregate({
      where: { portfolioId, type: 'DIVIDEND' },
      _sum: { total: true },
    });
    totalDividends = new Prisma.Decimal(dividends._sum.total ?? 0);

    const pnl = totalValue.minus(totalInvested);
    const pnlPct = totalInvested.gt(0) ? pnl.dividedBy(totalInvested).times(100) : new Prisma.Decimal(0);

    return {
      portfolioId,
      totalInvested: totalInvested.toFixed(2),
      totalValue: totalValue.toFixed(2),
      totalDividends: totalDividends.toFixed(2),
      pnl: pnl.toFixed(2),
      pnlPct: pnlPct.toFixed(2),
      holdingsCount: holdings.length,
    };
  }
}
