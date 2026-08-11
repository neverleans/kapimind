/**
 * Hook que busca holdings via API backend.
 * Por enquanto usa fallback mock; será trocado para fetch real após Fase 3.
 */

import { useEffect, useState } from 'react';
import { formatBRL } from './format';

export interface Holding {
  id: string;
  ticker: string;
  type: 'STOCK' | 'FII' | 'FIAGRO' | 'ETF' | 'CRYPTO' | 'BOND';
  quantity: number;
  avgPrice: number;
  lastPrice?: number;
  marketValue?: number;
  dividendYield?: number;
  pvp?: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalValue: number;
  totalDividends: number;
  pnl: number;
  pnlPct: number;
  holdingsCount: number;
}

const FALLBACK_HOLDINGS: Holding[] = [
  {
    id: '1',
    ticker: 'MXRF11',
    type: 'FII',
    quantity: 73,
    avgPrice: 9.7,
    lastPrice: 9.44,
    marketValue: 689.12,
    dividendYield: 12.66,
    pvp: 1.02,
  },
  {
    id: '2',
    ticker: 'VGHF11',
    type: 'FII',
    quantity: 58,
    avgPrice: 7.07,
    lastPrice: 5.19,
    marketValue: 301.02,
    dividendYield: 16.44,
    pvp: 0.63,
  },
  {
    id: '3',
    ticker: 'VGIA11',
    type: 'FIAGRO',
    quantity: 41,
    avgPrice: 9.95,
    lastPrice: 8.4,
    marketValue: 344.4,
    dividendYield: 19.67,
    pvp: 0.87,
  },
];

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>(FALLBACK_HOLDINGS);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchFromApi() {
    setLoading(true);
    setError(null);
    try {
      // Chamar /api/portfolio/seed-portfolio/holdings
      const res = await fetch('/api/portfolio/seed-portfolio/holdings', { cache: 'no-store' });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      setHoldings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar holdings');
      // Mantém fallback
    } finally {
      setLoading(false);
    }
  }

  async function fetchSummary() {
    try {
      const res = await fetch('/api/portfolio/seed-portfolio/summary', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setSummary({
        totalInvested: parseFloat(data.totalInvested),
        totalValue: parseFloat(data.totalValue),
        totalDividends: parseFloat(data.totalDividends),
        pnl: parseFloat(data.pnl),
        pnlPct: parseFloat(data.pnlPct),
        holdingsCount: data.holdingsCount,
      });
    } catch {
      // Mantém fallback
    }
  }

  useEffect(() => {
    fetchFromApi();
    fetchSummary();
  }, []);

  async function addHolding(data: { ticker: string; type: Holding['type']; quantity: number; avgPrice: number }) {
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/seed-portfolio/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      await fetchFromApi();
      await fetchSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar holding');
    } finally {
      setLoading(false);
    }
  }

  async function removeHolding(ticker: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/seed-portfolio/holdings/${ticker}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      await fetchFromApi();
      await fetchSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover holding');
    } finally {
      setLoading(false);
    }
  }

  return {
    holdings,
    summary,
    loading,
    error,
    refetch: () => {
      fetchFromApi();
      fetchSummary();
    },
    addHolding,
    removeHolding,
  };
}

export function getAssetTypeLabel(t: Holding['type']): string {
  const map: Record<Holding['type'], string> = {
    STOCK: 'Ação',
    FII: 'FII',
    FIAGRO: 'Fiagro',
    ETF: 'ETF',
    CRYPTO: 'Cripto',
    BOND: 'Renda Fixa',
  };
  return map[t];
}

export { formatBRL };
