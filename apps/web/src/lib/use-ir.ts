/**
 * Hook para IR (imposto de renda) por ano-calendario.
 */

import { useEffect, useState, useCallback } from 'react';

const PORTFOLIO_ID = 'seed-portfolio';

export interface IrTransaction {
  id: string;
  date: string;
  ticker: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

export interface IrYearSummary {
  year: number;
  portfolioId: string;
  totalTransactions: number;
  totalBuys: number;
  totalSells: number;
  totalDividends: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  totalDividendAmount: number;
  totalIrDue: number;
  monthlyExemption: number;
  taxRate: number;
  monthsOverExemption: Array<{ month: string; total: number; irDue: number }>;
  transactions: IrTransaction[];
}

export function useIr(year: number) {
  const [summary, setSummary] = useState<IrYearSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchYear = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ir/${year}?portfolioId=${PORTFOLIO_ID}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar IR');
    } finally {
      setLoading(false);
    }
  }, [year]);

  async function addTransaction(data: {
    ticker: string;
    type: string;
    quantity: number;
    price: number;
    fees: number;
    occurredAt: string;
    notes?: string;
  }) {
    try {
      const res = await fetch('/api/ir/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: PORTFOLIO_ID, ...data }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      await fetchYear();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar');
    }
  }

  useEffect(() => {
    fetchYear();
  }, [fetchYear]);

  return { summary, loading, error, refetch: fetchYear, addTransaction };
}
