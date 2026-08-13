/**
 * Testes para o cliente Brapi.
 * NOTA: testes que dependem de fetch real usam mock de global.fetch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { quote, listFIIs, historical, historicalBatch } from './brapi';

const mockQuote = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValueOnce({
    ok: status === 200,
    status,
    statusText: status === 200 ? 'OK' : 'Internal Server Error',
    json: async () => data,
  });

describe('quote', () => {
  beforeEach(() => {
    process.env.BRAPI_API_KEY = 'test-key';
    global.fetch = vi.fn() as never;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches quote from brapi.dev', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      mockQuote({ results: [{ symbol: 'MXRF11', regularMarketPrice: 9.5 }] }),
    );
    const result = await quote('MXRF11');
    expect(result.symbol).toBe('MXRF11');
    expect(result.regularMarketPrice).toBe(9.5);
  });

  it('throws on error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(mockQuote({}, 500));
    await expect(quote('MXRF11')).rejects.toThrow();
  });
});

describe('listFIIs', () => {
  beforeEach(() => {
    process.env.BRAPI_API_KEY = 'test-key';
    global.fetch = vi.fn() as never;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches list of FIIs', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      mockQuote({ stocks: [{ stock: 'MXRF11', name: 'Maxi Renda', close: 9.5, change: 0.1, volume: 1000000 }] }),
    );
    const result = await listFIIs();
    expect(result).toHaveLength(1);
    expect(result[0].stock).toBe('MXRF11');
  });
});

describe('historical', () => {
  beforeEach(() => {
    process.env.BRAPI_API_KEY = 'test-key';
    global.fetch = vi.fn() as never;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and filters historical data', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      mockQuote({
        results: [
          {
            symbol: 'MXRF11',
            historicalDataPrice: [
              { date: '2020-12-01', close: 9.0 },
              { date: '2021-06-01', close: 9.3 },
              { date: '2022-01-01', close: 9.5 },
              { date: '2023-06-01', close: 10.0 },
            ],
          },
        ],
      }),
    );
    const result = await historical('MXRF11', new Date('2021-01-01'), new Date('2022-12-31'));
    expect(result).toHaveLength(2);
    expect(result[0].close).toBe(9.3);
  });
});

describe('historicalBatch', () => {
  beforeEach(() => {
    process.env.BRAPI_API_KEY = 'test-key';
    global.fetch = vi.fn() as never;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array on full failure (graceful)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
    const result = await historicalBatch(['MXRF11', 'VGHF11'], new Date(), new Date());
    expect(result.size).toBe(2);
    expect(result.get('MXRF11')).toEqual([]);
  });
});
