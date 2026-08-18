'use client';

/**
 * Wrapper Client-side para Recharts com lazy loading.
 *
 * Recharts eh pesado (~50kb gzipped). Usar dynamic import em paginas
 * que NAO precisam de graficos em primeira render reduz TTI.
 *
 * Uso:
 *   const charts = useRefCharts();
 *   <charts.LineChart ... />
 *
 * Quando carregado, expoe todas as funcoes de recharts como properties.
 */

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';

type RechartsExports = {
  LineChart: ComponentType<unknown>;
  Line: ComponentType<unknown>;
  BarChart: ComponentType<unknown>;
  Bar: ComponentType<unknown>;
  PieChart: ComponentType<unknown>;
  Pie: ComponentType<unknown>;
  Cell: ComponentType<unknown>;
  AreaChart: ComponentType<unknown>;
  Area: ComponentType<unknown>;
  XAxis: ComponentType<unknown>;
  YAxis: ComponentType<unknown>;
  CartesianGrid: ComponentType<unknown>;
  Tooltip: ComponentType<unknown>;
  Legend: ComponentType<unknown>;
  ResponsiveContainer: ComponentType<unknown>;
};

const DEFAULT_EXPORTS: Partial<RechartsExports> = {
  LineChart: () => null,
  Line: () => null,
  BarChart: () => null,
  Bar: () => null,
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
  AreaChart: () => null,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <>{children as React.ReactNode}</>
  ),
};

/**
 * Hook: retorna componentes de recharts lazy-loaded.
 * Em SSR retorna DEFAULT_EXPORTS; no client, apos carregar, retorna reais.
 */
export function useRefCharts(): RechartsExports {
  const [charts, setCharts] = useState<RechartsExports>(DEFAULT_EXPORTS as RechartsExports);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await import('recharts');
        if (cancelled) return;
        setCharts({
          LineChart: m.LineChart as ComponentType<unknown>,
          Line: m.Line as ComponentType<unknown>,
          BarChart: m.BarChart as ComponentType<unknown>,
          Bar: m.Bar as ComponentType<unknown>,
          PieChart: m.PieChart as ComponentType<unknown>,
          Pie: m.Pie as ComponentType<unknown>,
          Cell: m.Cell as ComponentType<unknown>,
          AreaChart: m.AreaChart as ComponentType<unknown>,
          Area: m.Area as ComponentType<unknown>,
          XAxis: m.XAxis as ComponentType<unknown>,
          YAxis: m.YAxis as ComponentType<unknown>,
          CartesianGrid: m.CartesianGrid as ComponentType<unknown>,
          Tooltip: m.Tooltip as ComponentType<unknown>,
          Legend: m.Legend as ComponentType<unknown>,
          ResponsiveContainer: m.ResponsiveContainer as ComponentType<unknown>,
        });
      } catch (e) {
        // recharts nao carregou — usar fallback
        console.warn('recharts failed to load:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return charts;
}

/**
 * Helper para envolver componentes de recharts em dynamic import
 * para usar em qualquer pagina sem precisar do hook.
 */
export const LineChart = dynamic(
  () => import('recharts').then((m) => m.LineChart as ComponentType<unknown>),
  { ssr: false },
);
export const PieChart = dynamic(
  () => import('recharts').then((m) => m.PieChart as ComponentType<unknown>),
  { ssr: false },
);
export const AreaChart = dynamic(
  () => import('recharts').then((m) => m.AreaChart as ComponentType<unknown>),
  { ssr: false },
);
