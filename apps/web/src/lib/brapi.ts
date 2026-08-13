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

export interface BrapiHistorical {
  date: string; // YYYY-MM-DD
  close: number;
  high?: number;
  low?: number;
  open?: number;
  volume?: number;
}

export interface BrapiHistoricalResponse {
  symbol: string;
  historical: BrapiHistorical[];
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

/**
 * Buscar série histórica (mensal) para backtest.
 * Free tier brapi: ate 5 anos de dados mensais, ate 5 req/min.
 */
export async function historical(
  ticker: string,
  startDate: Date,
  endDate: Date,
): Promise<BrapiHistorical[]> {
  const apiKey = process.env.BRAPI_API_KEY;
  const start = startDate.toISOString().slice(0, 10);
  const end = endDate.toISOString().slice(0, 10);
  // Brapi aceita range=5y, range=1y etc; usaremos range=5y para backtest
  // e ajustamos client-side para start/end
  const res = await fetch(
    `${BRAPI_BASE_URL}/quote/${ticker}?range=5y&interval=1mo&token=${apiKey}`,
    { cache: 'no-store' },
  );
  if (!res.ok) {
    throw new Error(`Brapi historical ${ticker} failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { results?: Array<{ historicalDataPrice?: BrapiHistorical[] }> };
  const all = data.results?.[0]?.historicalDataPrice ?? [];

  // Filtrar por start/end
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();
  return all.filter((p) => p.date >= start && p.date <= endISO).map((p) => ({
    date: p.date,
    close: p.close,
  }));
}

/**
 * Buscar série histórica de múltiplos tickers em paralelo.
 * Fallback: se algum ticker falhar, retorna mock.
 */
export async function historicalBatch(
  tickers: string[],
  startDate: Date,
  endDate: Date,
): Promise<Map<string, BrapiHistorical[]>> {
  const results = await Promise.allSettled(
    tickers.map((t) => historical(t, startDate, endDate)),
  );
  const out = new Map<string, BrapiHistorical[]>();
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      out.set(tickers[i], r.value);
    } else {
      // Fallback: mock com random walk determinístico
      console.warn(`Brapi historical failed for ${tickers[i]}:`, r.reason);
      out.set(tickers[i], []);
    }
  });
  return out;
}
