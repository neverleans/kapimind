import { PrismaService } from './prisma.service';
import { z } from 'zod';

export const AssetTypeSchema = z.enum(['STOCK', 'FII', 'FIAGRO', 'ETF', 'CRYPTO', 'BOND']);
export const TxTypeSchema = z.enum(['BUY', 'SELL', 'DIVIDEND', 'JCP', 'AMORTIZATION', 'SPLIT']);

export const CreateHoldingSchema = z.object({
  ticker: z.string().min(1).max(20).toUpperCase(),
  type: AssetTypeSchema,
  quantity: z.number().positive(),
  avgPrice: z.number().positive(),
});

export const CreateTransactionSchema = z.object({
  ticker: z.string().min(1).max(20).toUpperCase(),
  type: TxTypeSchema,
  quantity: z.number().positive(),
  price: z.number().positive(),
  fees: z.number().nonnegative().default(0),
  occurredAt: z.string().datetime().or(z.date()),
  notes: z.string().max(500).optional(),
});

export const UpdatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  broker: z.string().min(1).max(50).optional(),
});

export { PrismaService };
