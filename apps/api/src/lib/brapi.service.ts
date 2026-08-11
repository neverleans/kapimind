/**
 * BrapiService - cliente server-side para brapi.dev.
 * Chave API NUNCA exposta no bundle.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BrapiQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime?: string;
  marketCap?: number;
  dividendYield?: number;
  priceEarnings?: number;
  priceToBook?: number;
  earningsPerShare?: number;
}

const BRAPI_BASE = 'https://brapi.dev/api';

@Injectable()
export class BrapiService {
  private readonly logger = new Logger(BrapiService.name);
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('BRAPI_API_KEY') ?? '';
    if (!this.apiKey) {
      this.logger.warn('BRAPI_API_KEY não configurada; cotações vão falhar');
    }
  }

  async quote(ticker: string): Promise<BrapiQuote> {
    const url = `${BRAPI_BASE}/quote/${ticker}?token=${this.apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Brapi quote ${ticker} failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const item = data.results?.[0] ?? data;
    return item as BrapiQuote;
  }

  async quoteBatch(tickers: string[]): Promise<BrapiQuote[]> {
    // Brapi accepts comma-separated tickers
    const url = `${BRAPI_BASE}/quote/${tickers.join(',')}?token=${this.apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Brapi quote batch failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return (data.results ?? []) as BrapiQuote[];
  }
}
