/**
 * Cliente Brapi.dev — server-side only.
 * A chave NUNCA deve vazar para o bundle do cliente.
 */

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

export interface BrapiDividend {
  symbol: string;
  dividends?: Array<{
    date: string;
    amount: number;
    type: 'dividend' | 'jcp';
  }>;
}

export interface BrapiListItem {
  stock: string;
  name: string;
  close: number;
  change: number;
  volume: number;
  market_cap?: number;
  sector?: string;
  type?: 'stock' | 'fund';
}

const BRAPI_BASE_URL = 'https://brapi.dev/api';

export async function quote(ticker: string): Promise<BrapiQuote> {
  const apiKey = process.env.BRAPI_API_KEY;
  const res = await fetch(`${BRAPI_BASE_URL}/quote/${ticker}?token=${apiKey}`, {
    cache: 'no-store', // sempre fresh; em produção, cachear via Redis
  });
  if (!res.ok) {
    throw new Error(`Brapi quote failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.results?.[0] ?? data;
}

export async function listFIIs(): Promise<BrapiListItem[]> {
  const apiKey = process.env.BRAPI_API_KEY;
  const res = await fetch(`${BRAPI_BASE_URL}/quote/list?type=fund&token=${apiKey}`, {
    next: { revalidate: 900 }, // 15 min cache
  });
  if (!res.ok) {
    throw new Error(`Brapi list failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.stocks ?? [];
}
