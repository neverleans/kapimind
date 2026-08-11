'use client';

import { useState, useMemo } from 'react';
import { calculateRendaAlvo, calculateAporteExtra, calculateProgressMeta } from '@/lib/calculators';
import { formatBRL, formatBRLCompact } from '@/lib/format';
import { Calculator, Target, TrendingUp, Flame, Info, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CalculatorsPage() {
  // Renda Alvo
  const [renda, setRenda] = useState({ target: 3000, yld: 12, ret: 10, years: 10 });
  const rendaOut = useMemo(() => calculateRendaAlvo({
    targetMonthlyIncome: renda.target,
    annualDividendYield: renda.yld / 100,
    annualReturn: renda.ret / 100,
    years: renda.years,
  }), [renda]);

  // Aporte Extra
  const [aporte, setAporte] = useState({ current: 600, extra: 900, years: 10, ret: 10 });
  const aporteOut = useMemo(() => calculateAporteExtra({
    currentMonthly: aporte.current,
    extraMonthly: aporte.extra,
    years: aporte.years,
    annualReturn: aporte.ret / 100,
  }), [aporte]);

  // Meta
  const [meta, setMeta] = useState({ target: 1500, current: 600, raise: 10 });
  const metaOut = useMemo(() => calculateProgressMeta({
    targetMonthly: meta.target,
    currentMonthly: meta.current,
    expectedRaise: meta.raise / 100,
  }), [meta]);

  return (
    <div className="space-y-6">
      <header className="text-center space-y-3 py-6">
        <Calculator className="h-12 w-12 mx-auto text-brand-purple" />
        <h1 className="text-4xl font-bold">Calculadoras</h1>
        <p className="text-gray-400">Simule seus objetivos financeiros</p>
      </header>

      {/* Meta Calc - shine pattern, no topo */}
      <section className="glass-panel p-6 rounded-2xl border-l-4 border-brand-yellow">
        <div className="flex items-center gap-3 mb-2">
          <Flame className="h-6 w-6 text-brand-yellow" />
          <h2 className="text-2xl font-bold">Meta de Aporte: R$ {meta.target}/mês</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Saindo de R$ {meta.current} com {meta.raise}% de aumento anual
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Slider
            label="Aporte atual"
            min={100}
            max={5000}
            step={100}
            value={meta.current}
            onChange={(v) => setMeta({ ...meta, current: v })}
            prefix="R$ "
          />
          <Slider
            label="Meta"
            min={500}
            max={10000}
            step={100}
            value={meta.target}
            onChange={(v) => setMeta({ ...meta, target: v })}
            prefix="R$ "
          />
          <Slider
            label="Aumento anual"
            min={0}
            max={30}
            step={1}
            value={meta.raise}
            onChange={(v) => setMeta({ ...meta, raise: v })}
            suffix="%"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Metric label="Progresso" value={`${metaOut.progress.toFixed(1)}%`} color="purple" />
          <Metric label="Faltam" value={formatBRL(metaOut.remaining)} color="yellow" />
          <Metric label="Tempo para meta" value={metaOut.monthsToGoal === 0 ? '✓ Atingido' : `${metaOut.monthsToGoal} meses`} color="green" />
        </div>

        <div className="mt-4 h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-yellow to-brand-green transition-all"
            style={{ width: `${Math.min(100, metaOut.progress)}%` }}
          />
        </div>
      </section>

      {/* Renda Alvo */}
      <section className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Target className="h-6 w-6 text-brand-purple" />
          <h2 className="text-2xl font-bold">Quanto preciso para renda mensal de R$ {renda.target}?</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Patrimônio necessário = renda anual / dividend yield esperado
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Slider label="Renda alvo" min={500} max={20000} step={100} value={renda.target}
            onChange={(v) => setRenda({ ...renda, target: v })} prefix="R$ " />
          <Slider label="Dividend Yield" min={6} max={20} step={0.5} value={renda.yld}
            onChange={(v) => setRenda({ ...renda, yld: v })} suffix="%" />
          <Slider label="Retorno a.a." min={4} max={15} step={0.5} value={renda.ret}
            onChange={(v) => setRenda({ ...renda, ret: v })} suffix="%" />
          <Slider label="Horizonte" min={5} max={30} step={1} value={renda.years}
            onChange={(v) => setRenda({ ...renda, years: v })} suffix=" anos" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Metric label="Patrimônio necessário" value={formatBRL(rendaOut.portfolioRequired)} color="purple" />
          <Metric label="Aporte mensal" value={formatBRL(rendaOut.monthlyInvestment)} color="yellow" />
          <Metric label="Renda final (c/ crescimento)" value={formatBRL(rendaOut.finalAnnualIncome / 12)} color="green" />
        </div>

        <details className="mt-4">
          <summary className="text-sm text-gray-400 cursor-pointer flex items-center gap-1">
            <Info className="h-3 w-3" />
            Ver premissas
          </summary>
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <p>• Premissa: portfólio lastreado 100% em FIIs/REITs com DY de {renda.yld}% a.a.</p>
            <p>• Cota cresce {renda.ret}% a.a. (inflação + valorização)</p>
            <p>• Considera reinvestimento de dividendos</p>
            <p>• NÃO considera IR, taxa de administração, nem custos de transação</p>
          </div>
        </details>
      </section>

      {/* Aporte Extra */}
      <section className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-6 w-6 text-brand-green" />
          <h2 className="text-2xl font-bold">Impacto de aporte extra</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Quanto rende adicionar R$ {aporte.extra}/mês durante {aporte.years} anos?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Slider label="Aporte atual" min={100} max={5000} step={100} value={aporte.current}
            onChange={(v) => setAporte({ ...aporte, current: v })} prefix="R$ " />
          <Slider label="Aporte extra" min={100} max={5000} step={100} value={aporte.extra}
            onChange={(v) => setAporte({ ...aporte, extra: v })} prefix="R$ " />
          <Slider label="Retorno a.a." min={4} max={15} step={0.5} value={aporte.ret}
            onChange={(v) => setAporte({ ...aporte, ret: v })} suffix="%" />
          <Slider label="Horizonte" min={5} max={30} step={1} value={aporte.years}
            onChange={(v) => setAporte({ ...aporte, years: v })} suffix=" anos" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Metric label="Sem o extra" value={formatBRL(aporteOut.finalCurrent)} color="purple" />
          <Metric label="Com o extra" value={formatBRL(aporteOut.finalExtra + aporteOut.finalCurrent)} color="yellow" />
          <Metric label="Ganho do extra" value={formatBRLCompact(aporteOut.extraGain)} color="green" />
          <Metric label="ROI" value={`${aporteOut.roi.toFixed(1)}%`} color="green" />
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Você investiria R$ {formatBRL(aporte.extra * aporte.years * 12)} a mais e teria R$ {formatBRL(aporteOut.extraGain)} a mais de patrimônio.
        </p>
      </section>

      {/* CTA */}
      <section className="glass-panel p-6 rounded-2xl text-center space-y-3">
        <p className="text-gray-300">
          Essas calculadoras vivem no plano Bogleheads:{' '}
          <Link href="/roadmap/investidor-inteligente" className="text-brand-purple underline">
            Graham/Mr. Market
          </Link>
          {' '}+{' '}
          <Link href="/roadmap/little-book-valuation" className="text-brand-purple underline">
            Damodaran/Valor intrinseco
          </Link>
          .
        </p>
        <Link
          href="/simulator"
          className="inline-flex items-center gap-2 text-brand-purple hover:text-white"
        >
          Simulador completo (multi-ativo) <ChevronRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: 'purple' | 'yellow' | 'green' }) {
  const colors = {
    purple: 'text-brand-purple',
    yellow: 'text-brand-yellow',
    green: 'text-brand-green',
  };
  return (
    <article className="bg-gray-900/50 rounded-xl p-4 border border-white/5">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${colors[color]}`}>{value}</p>
    </article>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  prefix = '',
  suffix = '',
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-brand-blue font-bold text-sm w-20 text-right tabular-nums">
          {prefix}
          {value}
          {suffix}
        </span>
      </div>
    </div>
  );
}
