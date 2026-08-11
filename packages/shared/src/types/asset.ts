/**
 * Tipos compartilhados com o backend (apps/api).
 * Re-exporta de @shared/* para evitar duplicação.
 */

export type AssetType = 'STOCK' | 'FII' | 'FIAGRO' | 'ETF' | 'CRYPTO' | 'BOND';

export type TxType = 'BUY' | 'SELL' | 'DIVIDEND' | 'JCP' | 'AMORTIZATION' | 'SPLIT';

export type RiskProfile = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

export type AlertSource = 'TRADINGVIEW' | 'BRAPI' | 'INTERNAL' | 'MACRO';

export type AlertStatus = 'NEW' | 'REVIEWED' | 'ACTED' | 'DISMISSED';

export type RecoAction = 'BUY' | 'HOLD' | 'SELL' | 'REBALANCE' | 'REVIEW' | 'NOTHING';

export type Feedback = 'HELPFUL' | 'NEUTRAL' | 'MISLEADING';

export interface Holding {
  id: string;
  ticker: string;
  type: AssetType;
  quantity: number;
  avgPrice: number;
  lastPrice?: number;
  lastDividend?: number;
  dividendYield?: number;
  pvp?: number;
  marketValue?: number;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  ticker: string;
  type: TxType;
  quantity: number;
  price: number;
  total: number;
  fees: number;
  occurredAt: string;
  notes?: string;
}

export interface Alert {
  id: string;
  source: AlertSource;
  ticker?: string;
  kind: string;
  payload: Record<string, unknown>;
  status: AlertStatus;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  action: RecoAction;
  summary: string;
  reasoning: string;
  confidence: number;
  modelVersion: string;
  createdAt: string;
}
