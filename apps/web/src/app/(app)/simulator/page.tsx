'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { runSimulation, formatTime, AssetKey, DEFAULT_CONFIG } from '@/lib/simulator';
import { formatBRL, formatBRLCompact } from '@/lib/format';
import { Sliders, TrendingUp, Repeat, Wallet, Calendar } from 'lucide-react';

export default function SimulatorPage() {
  const [initialInvestment, setInitialInvestment] = useState(DEFAULT_CONFIG.initialInvestment);
  const [inflationRate, setInflationRate] = useState(DEFAULT_CONFIG.inflationRate * 100);
  const [monthlyExpenses, setMonthlyExpenses] = useState(3000);

  const result = useMemo(
    () =>
      runSimulation({
        ...DEFAULT_CONFIG,
        initialInvestment,
        inflationRate: inflationRate / 100,
        months: 120,
      }),
    [initialInvestment, inflationRate],
  );

  const chartData = result.months.map((m) => ({
    month: m.monthTotal,
    patrimonio: m.balanceTotal,
    investido: result.months
      .slice(0, m.monthTotal)
      .reduce((acc, mm) => acc + mm.contribution, 0),
  }));

  const allocData = (Object.keys(result.finalPortfolioQty) as AssetKey[])
    .map((key) => ({
      name: result.config.assets[key].name,
      value: result.finalPortfolioQty[key] * (result.config.assets[key].price as number),
      color: result.config.assets[key].color,
    }))
    .filter((d) => d.value > 0);

  const paybackText = formatTime(result.paybackMonth);
  const crossoverText = formatTime(
    result.independenceMonth !== null ? result.independenceMonth + 1 : null,
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-brand-green" />
        <div>
          <h1 className="text-3xl font-bold">Simulador</h1>
          <p className="text-sm text-gray-400">Projete seu futuro financeiro em 120 meses</p>
        </div>
      </header>

      {/* Controls */}
      <section className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Sliders className="h-5 w-5 text-brand-purple" />
          Painel de Controle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Aporte Mensal Inicial</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={400}
                max={2000}
                step={50}
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-brand-blue font-bold text-sm w-24 text-right tabular-nums">
                {formatBRL(initialInvestment)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Crescimento Anual do Aporte</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={inflationRate}
                onChange={(e) => setInflationRate(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-brand-green font-bold text-sm w-16 text-right tabular-nums">
                {inflationRate}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Despesas Mensais (Meta)</label>
            <input
              type="number"
              min={1000}
              max={20000}
              step={100}
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:border-brand-yellow"
            />
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="glass-panel p-6 rounded-2xl border-l-4 border-brand-blue">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Patrimônio Final
          </h3>
          <p className="text-3xl font-bold mt-2 tabular-nums">{formatBRL(result.finalPortfolioValue)}</p>
          <p className="text-xs text-brand-blue mt-1">em 120 meses</p>
        </article>

        <article className="glass-panel p-6 rounded-2xl border-l-4 border-brand-green">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
            Renda Mensal Final
          </h3>
          <p className="text-3xl font-bold mt-2 text-brand-green tabular-nums">
            {formatBRL(result.finalMonthlyDividend)}
          </p>
          <p className="text-xs text-green-400 mt-1">Isento de IR (FIIs)</p>
        </article>

        <article className="glass-panel p-6 rounded-2xl border-l-4 border-brand-purple">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
            Total Investido
          </h3>
          <p className="text-3xl font-bold mt-2 tabular-nums">{formatBRL(result.totalInvested)}</p>
          <p className="text-xs text-brand-purple mt-1">
            Yield on cost: {((result.finalMonthlyDividend * 12 / result.totalInvested) * 100).toFixed(2)}%
          </p>
        </article>
      </section>

      {/* Projections */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="glass-panel p-6 rounded-2xl border border-brand-green/30">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <Repeat className="h-4 w-4 text-brand-green" />
            Payback Integral
          </h3>
          <p className="text-2xl font-bold mt-2 text-white tabular-nums">{paybackText}</p>
          <p className="text-xs text-gray-400 mt-1">
            <span className="text-brand-green font-bold">Dividendos &gt; Total Investido</span>
          </p>
        </article>

        <article className="glass-panel p-6 rounded-2xl border border-brand-purple/30">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-purple" />
            Efeito Bola de Neve
          </h3>
          <p className="text-2xl font-bold mt-2 text-white tabular-nums">{crossoverText}</p>
          <p className="text-xs text-gray-400 mt-1">Renda mensal &gt; Aporte mensal</p>
        </article>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">Evolução Patrimonial</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={(v) => `M${v}`} />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(v) => formatBRLCompact(v)}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                  formatter={(v: number) => formatBRL(v)}
                  labelFormatter={(v) => `Mês ${v}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="patrimonio"
                  name="Patrimônio"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="investido"
                  name="Total Investido"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">Alocação Final</h3>
          {allocData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(d) => `${d.name}: ${formatBRLCompact(d.value)}`}
                  >
                    {allocData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">
              Configure o aporte para ver a alocação
            </p>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="glass-panel p-4 rounded-2xl border border-brand-yellow/30">
        <p className="text-xs text-gray-400">
          <span className="text-brand-yellow font-bold">⚠ Disclaimer:</span> Simulação usa preços
          fixos de janeiro/2026. Não inclui variação de cotação, IR sobre venda, taxa de administração
          de ETF nem eventos de crédito (calote Languiru, seca de dividendos VGHF11). Para projeção
          real, conecte a cotação dinâmica via brapi.dev (Fase 3).
        </p>
      </section>
    </div>
  );
}
