'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Loader2, Sparkles } from 'lucide-react';
import { FanChartData } from '@/lib/montecarlo';
import { formatBRL, formatBRLCompact, formatPercent } from '@/lib/format';

interface MCResponse {
  initialValue: number;
  totalContributed: number;
  finalValueMedian: number;
  finalValueP5: number;
  finalValueP95: number;
  confidence95: { low: number; high: number };
  successRate: number;
  fanChart: FanChartData[];
  durationMs: number;
  source?: string;
  note?: string;
}

export default function MonteCarloPage() {
  const [data, setData] = useState<MCResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchMC() {
      setLoading(true);
      try {
        const res = await fetch('/api/simulator/montecarlo');
        if (!res.ok) throw new Error(`API ${res.status}`);
        setData(await res.json());
      } catch {
        // erro silencioso
      } finally {
        setLoading(false);
      }
    }
    fetchMC();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) return null;

  const upside = ((data.finalValueMedian - data.totalContributed) / data.totalContributed) * 100;
  const rangeWidth = data.finalValueP95 - data.finalValueP5;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-brand-purple" />
        <div>
          <h1 className="text-3xl font-bold">Monte Carlo</h1>
          <p className="text-sm text-gray-400">
            1.000 cenários · Geometric Brownian Motion (GBM) · {data.durationMs}ms
          </p>
        </div>
      </header>

      {data.source === 'mock' && (
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-brand-yellow">
          <p className="text-xs text-gray-400 italic">⚠ Dados mockados · {data.note}</p>
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Mediana final" value={data.finalValueMedian} color="green" trend={upside} />
        <KpiCard label="Cenário otimista (p95)" value={data.finalValueP95} color="purple" />
        <KpiCard label="Cenário pessimista (p5)" value={data.finalValueP5} color="red" />
        <KpiCard label="Taxa de sucesso" value={data.successRate} color="blue" isPercent />
      </section>

      {/* Fan chart */}
      <section className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-4">Fan Chart — Evolução projetada</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.fanChart.map((p) => ({
              year: `Y${p.year}`,
              p5: p.p5,
              p25: p.p25,
              p50: p.p50,
              p75: p.p75,
              p95: p.p95,
            }))}>
              <defs>
                <linearGradient id="p95-p5" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(v) => formatBRLCompact(v)} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                formatter={(v: number) => formatBRL(v)}
              />
              <Legend />
              <Area type="monotone" dataKey="p95" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              <Area type="monotone" dataKey="p75" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Area type="monotone" dataKey="p50" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              <Area type="monotone" dataKey="p25" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Area type="monotone" dataKey="p5" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>Ano 0: {formatBRL(data.initialValue)}</span>
          <span>Mediana: {formatBRL(data.finalValueMedian)}</span>
          <span>Range p5-p95: {formatBRLCompact(rangeWidth)}</span>
        </div>
      </section>

      {/* Explicação */}
      <section className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-3">O que significa?</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          A simulação roda {data.fanChart.length - 1} anos × 1.000 cenários usando
          <strong> Geometric Brownian Motion (GBM)</strong> — o modelo padrão de Black-Scholes
          para ativos lognormais. Cada cenário gera uma trajetória diferente baseada em
          choques aleatórios.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed mt-3">
          <strong>P5 (pessimista)</strong> = apenas 5% dos cenários pior que isso.
          <strong> P95 (otimista)</strong> = 95% dos cenários pior que isso.
          <strong> Mediana (p50)</strong> = cenário &quot;típico&quot;.
        </p>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
  trend,
  isPercent,
}: {
  label: string;
  value: number;
  color: 'green' | 'red' | 'purple' | 'blue';
  trend?: number;
  isPercent?: boolean;
}) {
  const colors = {
    green: 'text-brand-green',
    red: 'text-brand-red',
    purple: 'text-brand-purple',
    blue: 'text-brand-blue',
  };
  const labels = {
    green: 'Cenário central',
    red: 'Cenário pior',
    purple: 'Cenário otimista',
    blue: 'Probabilidade',
  };
  return (
    <article className="glass-panel p-4 rounded-2xl">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${colors[color]}`}>
        {isPercent ? formatPercent(value, 1) : formatBRLCompact(value)}
      </p>
      {trend !== undefined && (
        <p className={`text-xs flex items-center gap-1 mt-1 ${trend >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend >= 0 ? '+' : ''}
          {formatPercent(trend / 100, 1)} sobre aporte
        </p>
      )}
      <p className="text-xs text-gray-500 mt-1">{labels[color]}</p>
    </article>
  );
}
