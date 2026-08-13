'use client';

import { useState } from 'react';
import { TrendingUp, Play, Loader2, Calendar, BarChart3 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStrategies } from '@/lib/use-strategies';
import { runBacktest, getMockPriceSeries, BacktestResult, BacktestMetrics } from '@/lib/permanent-portfolio';
import { formatBRL, formatBRLCompact, formatPercent } from '@/lib/format';

export default function StrategyPage() {
  const { strategies, loading } = useStrategies();
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [years, setYears] = useState(5);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [source, setSource] = useState<'brapi' | 'mock' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = strategies[0];

  async function handleRun() {
    if (!active) return;
    setRunning(true);
    setError(null);

    try {
      const res = await fetch(`/api/strategy/${active.id}/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: new Date(new Date().getFullYear() - years, 0, 1).toISOString(),
          endDate: new Date(new Date().getFullYear() - 1, 11, 31).toISOString(),
          monthlyContribution,
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setResult(data as BacktestResult);
      setSource(data.source ?? null);
    } catch (err) {
      // Fallback: rodar local
      try {
        const input = {
          tickers: active.config.tickers ?? { equity: 'IVVB11', bonds: 'B5P211', gold: 'GOLD11', cash: 'TESOURO' },
          allocation: active.config.allocation ?? { equity: 25, bonds: 25, gold: 25, cash: 25, reits: 0 },
          startDate: new Date(new Date().getFullYear() - years, 0, 1),
          endDate: new Date(new Date().getFullYear() - 1, 11, 31),
          monthlyContribution,
          rebalanceThreshold: 0.05,
          rebalanceFrequency: 'quarterly' as const,
        };
        const local = runBacktest(input as Parameters<typeof runBacktest>[0], getMockPriceSeries());
        setResult(local);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao rodar backtest');
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-brand-purple" />
        <div>
          <h1 className="text-3xl font-bold">Estratégia</h1>
          <p className="text-sm text-gray-400">Permanent Portfolio (Browne) — backtest com dados mock</p>
        </div>
      </header>

      {/* Data source indicator */}
      {source && (
        <div className="text-xs text-gray-500 italic">
          Fonte dos dados: <span className={source === 'brapi' ? 'text-brand-green' : 'text-brand-yellow'}>
            {source === 'brapi' ? '✓ Brapi.dev (dados reais)' : '⚠ Mock determinístico'}
          </span>
        </div>
      )}

      {/* Strategy info */}
      {active && (
        <section className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{active.name}</h2>
              <p className="text-xs text-gray-500 font-mono mt-1">id: {active.id}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-green text-white">
              Ativa
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AllocationChip label="Equity" value={active.config.allocation?.equity ?? 0} color="blue" />
            <AllocationChip label="Bonds" value={active.config.allocation?.bonds ?? 0} color="yellow" />
            <AllocationChip label="Gold" value={active.config.allocation?.gold ?? 0} color="purple" />
            <AllocationChip label="Cash" value={active.config.allocation?.cash ?? 0} color="green" />
          </div>
        </section>
      )}

      {/* Controls */}
      <section className="glass-panel p-6 rounded-2xl">
        <h2 className="text-lg font-bold mb-4">Configuração do Backtest</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Aporte Mensal (R$)</label>
            <input
              type="number"
              min={100}
              max={5000}
              step={100}
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:border-brand-purple"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Horizonte (anos)</label>
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:border-brand-purple"
            />
          </div>
        </div>
        <button
          onClick={handleRun}
          disabled={running || loading}
          className="mt-6 flex items-center gap-2 bg-brand-purple hover:bg-purple-600 text-white px-6 py-3 rounded-full font-semibold transition-all disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? 'Rodando backtest...' : 'Rodar Backtest'}
        </button>
      </section>

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-brand-red/30">
          <p className="text-sm text-red-300">⚠ {error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="CAGR" value={formatPercent(result.metrics.cagr)} color="green" />
            <MetricCard label="Sharpe" value={result.metrics.sharpe.toFixed(2)} color="purple" />
            <MetricCard label="Max DD" value={formatPercent(result.metrics.maxDrawdown)} color="red" />
            <MetricCard label="Volatilidade" value={formatPercent(result.metrics.volatility)} color="yellow" />
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SmallMetric label="Valor Final" value={formatBRL(result.metrics.finalValue)} />
            <SmallMetric label="Total Investido" value={formatBRL(result.metrics.totalContributed)} />
            <SmallMetric label="Melhor Ano" value={formatPercent(result.metrics.bestYear)} />
            <SmallMetric label="Pior Ano" value={formatPercent(result.metrics.worstYear)} />
          </section>

          <section className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-green" />
              Evolução Patrimonial
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.series}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke="#94a3b8"
                    tickFormatter={(v) => formatBRLCompact(v)}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    formatter={(v: number) => formatBRL(v)}
                  />
                  <Area type="monotone" dataKey="totalValue" stroke="#10b981" fill="url(#colorValue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-yellow" />
              Resumo
            </h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Período: {result.metrics.years} anos</li>
              <li>• Rebalanceamentos: {result.metrics.rebalanceCount}</li>
              <li>• Retorno total: {formatPercent(result.metrics.totalReturn)}</li>
            </ul>
          </section>
        </>
      )}

      {!result && !running && (
        <div className="glass-panel p-12 rounded-2xl text-center text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Clique em &quot;Rodar Backtest&quot; para ver as métricas</p>
          <p className="text-xs mt-2">Dados mockados para MXRF11, HGLG11, IVVB11, B5P211, GOLD11</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: 'green' | 'red' | 'yellow' | 'purple' }) {
  const colors = {
    green: 'border-brand-green',
    red: 'border-brand-red',
    yellow: 'border-brand-yellow',
    purple: 'border-brand-purple',
  };
  const textColors = {
    green: 'text-brand-green',
    red: 'text-brand-red',
    yellow: 'text-brand-yellow',
    purple: 'text-brand-purple',
  };
  return (
    <article className={`glass-panel p-4 rounded-2xl border-l-4 ${colors[color]}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${textColors[color]}`}>{value}</p>
    </article>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="glass-panel p-3 rounded-xl">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </article>
  );
}

function AllocationChip({ label, value, color }: { label: string; value: number; color: 'blue' | 'yellow' | 'purple' | 'green' }) {
  const colors = {
    blue: 'bg-brand-blue',
    yellow: 'bg-brand-yellow text-gray-900',
    purple: 'bg-brand-purple',
    green: 'bg-brand-green',
  };
  return (
    <div className={`p-3 rounded-xl ${colors[color]} text-white text-center`}>
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}%</p>
    </div>
  );
}
