/**
 * IR Module - calculos de imposto de renda para renda variável.
 * Regras vigentes em 2026:
 * - Vendas ate R$ 20.000/mes: isento
 * - Vendas > R$ 20.000/mes: 15% sobre lucro
 * - Dividendos de FIIs: isentos (Lei 11.196/2005)
 * - DARF codigo 6015 ate ultimo dia util do mes seguinte
 */

import { Module, Controller, Get, Post, Body, Query, Res, Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma.service';
import { Prisma, TxType } from '@prisma/client';
import { z } from 'zod';

const TAX_RATE = 0.15;
const MONTHLY_EXEMPTION = 20000;

const AddTxSchema = z.object({
  portfolioId: z.string().min(1),
  ticker: z.string().min(1).max(20).toUpperCase(),
  type: z.nativeEnum(TxType),
  quantity: z.coerce.number().positive(),
  price: z.coerce.number().positive(),
  fees: z.coerce.number().nonnegative().default(0),
  occurredAt: z.string().datetime().or(z.date()),
  notes: z.string().max(500).optional(),
});

@Injectable()
export class IrService {
  constructor(private readonly prisma: PrismaService) {}

  async getYearSummary(portfolioId: string, year: number) {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

    const transactions = await this.prisma.transaction.findMany({
      where: { portfolioId, occurredAt: { gte: start, lte: end } },
      orderBy: { occurredAt: 'asc' },
    });

    const totalBuyAmount = transactions
      .filter((t) => t.type === 'BUY')
      .reduce((acc, t) => acc + Number(t.total), 0);
    const totalSellAmount = transactions
      .filter((t) => t.type === 'SELL')
      .reduce((acc, t) => acc + Number(t.total), 0);
    const totalDividendAmount = transactions
      .filter((t) => t.type === 'DIVIDEND')
      .reduce((acc, t) => acc + Number(t.total), 0);

    // Monthly sells for IR due (only counts months > R$ 20k)
    const monthlySells = new Map<string, number>();
    for (const tx of transactions.filter((t) => t.type === 'SELL')) {
      const month = tx.occurredAt.toISOString().slice(0, 7);
      monthlySells.set(month, (monthlySells.get(month) ?? 0) + Number(tx.total));
    }

    let totalIrDue = 0;
    const monthsOverExemption: Array<{ month: string; total: number; irDue: number }> = [];
    for (const [month, total] of monthlySells) {
      if (total > MONTHLY_EXEMPTION) {
        const irDue = total * TAX_RATE;
        totalIrDue += irDue;
        monthsOverExemption.push({ month, total, irDue });
      }
    }

    return {
      year,
      portfolioId,
      totalTransactions: transactions.length,
      totalBuys: transactions.filter((t) => t.type === 'BUY').length,
      totalSells: transactions.filter((t) => t.type === 'SELL').length,
      totalDividends: transactions.filter((t) => t.type === 'DIVIDEND').length,
      totalBuyAmount,
      totalSellAmount,
      totalDividendAmount,
      totalIrDue,
      monthlyExemption: MONTHLY_EXEMPTION,
      taxRate: TAX_RATE,
      monthsOverExemption,
      transactions: transactions.map((t) => ({
        id: t.id,
        date: t.occurredAt.toISOString().slice(0, 10),
        ticker: t.ticker,
        type: t.type,
        quantity: Number(t.quantity),
        price: Number(t.price),
        total: Number(t.total),
        notes: t.notes,
      })),
    };
  }

  async addTransaction(data: z.infer<typeof AddTxSchema>) {
    const occurredAt = typeof data.occurredAt === 'string' ? new Date(data.occurredAt) : data.occurredAt;
    const total = data.quantity * data.price;
    return this.prisma.transaction.create({
      data: {
        portfolioId: data.portfolioId,
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

  async exportCsv(portfolioId: string, year: number): Promise<string> {
    const summary = await this.getYearSummary(portfolioId, year);
    const lines = [
      'Data,Ticker,Tipo,Quantidade,Preco,Total,Observacao',
      ...summary.transactions.map(
        (t) =>
          `${t.date},${t.ticker},${t.type},${t.quantity},${t.price.toFixed(2)},${t.total.toFixed(2)},${t.notes ?? ''}`,
      ),
    ];
    return lines.join('\n');
  }
}

@Controller('ir')
export class IrController {
  constructor(private readonly service: IrService) {}

  @Get(':year')
  async getYearSummary(
    @Query('portfolioId') portfolioId: string,
    @Query('year') yearStr: string,
  ) {
    const year = Number(yearStr);
    return this.service.getYearSummary(portfolioId ?? 'seed-portfolio', year);
  }

  @Post('transaction')
  async addTransaction(@Body() body: unknown) {
    const data = AddTxSchema.parse(body);
    return this.service.addTransaction(data);
  }

  @Get(':year/csv')
  async exportCsv(
    @Query('portfolioId') portfolioId: string,
    @Query('year') yearStr: string,
    @Res() res: { header: (k: string, v: string) => void; send: (v: string) => void },
  ) {
    const year = Number(yearStr);
    const csv = await this.service.exportCsv(portfolioId ?? 'seed-portfolio', year);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', `attachment; filename="ir-${year}.csv"`);
    res.send(csv);
  }
}

@Module({
  controllers: [IrController],
  providers: [IrService, PrismaService],
  exports: [IrService],
})
export class IrModule {}
