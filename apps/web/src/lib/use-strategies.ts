/**
 * Hook para gerenciar Strategies via API.
 * No MVP, usa fallback mock (não há backend real ainda).
 */

import { useEffect, useState, useCallback } from 'react';

export interface Strategy {
  id: string;
  name: string;
  type: 'PERMANENT_PORTFOLIO' | 'DUAL_MOMENTUM' | 'RISK_PARITY' | 'CUSTOM';
  enabled: boolean;
  config: {
    allocation?: { equity: number; bonds: number; gold: number; cash: number; reits?: number };
    tickers?: { equity: string; bonds: string; gold: string; cash: string; reits?: string };
    rebalanceThreshold?: number;
    rebalanceFrequency?: 'monthly' | 'quarterly' | 'annual' | 'threshold';
  };
  createdAt: string;
}

const MOCK_STRATEGIES: Strategy[] = [
  {
    id: 'mock-pp-1',
    name: 'Permanent Portfolio 25/25/25/25',
    type: 'PERMANENT_PORTFOLIO',
    enabled: true,
    config: {
      allocation: { equity: 25, bonds: 25, gold: 25, cash: 25, reits: 0 },
      tickers: { equity: 'IVVB11', bonds: 'B5P211', gold: 'GOLD11', cash: 'TESOURO' },
      rebalanceThreshold: 0.05,
      rebalanceFrequency: 'quarterly',
    },
    createdAt: new Date().toISOString(),
  },
];

export function useStrategies() {
  const [strategies, setStrategies] = useState<Strategy[]>(MOCK_STRATEGIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/strategy', { cache: 'no-store' });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setStrategies(data.strategies ?? data);
    } catch (err) {
      // Mantém mock fallback
      setError(err instanceof Error ? err.message : 'Erro ao buscar');
    } finally {
      setLoading(false);
    }
  }, []);

  const createStrategy = useCallback(async (strategy: Omit<Strategy, 'id' | 'createdAt'>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategy),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      await fetchStrategies();
    } catch (err) {
      // Em produção, não usar fallback aqui
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStrategies]);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  return { strategies, loading, error, refetch: fetchStrategies, createStrategy };
}
