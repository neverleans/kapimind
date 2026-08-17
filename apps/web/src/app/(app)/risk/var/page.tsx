'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Activity, TrendingDown, Loader2 } from 'lucide-react';
import { formatBRL, formatBRLCompact } from '@/lib/format';

interface VaRResult {
  confidence: number;
  var: number;
  varPercent: number;
  cvar: number;
  cvarPercent: number;
  sampleSize: number;
  interpretation: string;
}

interface VaRResponse {
  portfolioValue: number;
  windowDays: number;
  results: VaRResult[];
  source?: string;
  note?: string;
}

export default function VarPage() {
  const [data, setData] = useState<VaRResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVar() {
      setLoading(true);
      try {
        const res = await fetch('/api/risk/var');
        if (!res.ok) throw new Error(`API ${res.status}`);
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro');
      } finally {
        setLoading(false);
      }
    }
    fetchVar();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-4 rounded-2xl border border-brand-red/30 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-brand-red mt-0.5" />
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-brand-red" />
        <div>
          <h1 className="text-3xl font-bold">VaR / CVaR</h1>
          <p className="text-sm text-gray-400">
            Risco histórico do portfolio · {data.windowDays} pregões
          </p>
        </div>
      </header>

      {data.source === 'mock' && (
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-brand-yellow">
          <p className="text-xs text-gray-400 italic">⚠ Dados mockados · {data.note}</p>
        </div>
      )}

      {data.results.map((r: VaRResult) => (
        <section
          key={r.confidence}
          className="glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              Confiança {(r.confidence * 100).toFixed(0)}%
            </h2>
            <span className="text-xs text-gray-500 font-mono">
              n = {r.sampleSize}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RiskCard
              title="VaR"
              description="Perda maxima esperada"
              value={r.var}
              percent={r.varPercent}
              color="yellow"
            />
            <RiskCard
              title="CVaR"
              description="Perda media em piores cenarios"
              value={r.cvar}
              percent={r.cvarPercent}
              color="red"
            />
          </div>

          <p className="text-xs text-gray-500 mt-4 italic">{r.interpretation}</p>
        </section>
      ))}

      <section className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-3">O que significa?</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          <strong>VaR (Value at Risk)</strong> mede a perda maxima esperada do portfolio em um
          horizonte de 1 dia, com nivel de confianca X%. Por exemplo, VaR 95% = R$ 1.000
          significa que ha 5% de chance de perder mais que R$ 1.000 em 1 dia.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed mt-3">
          <strong>CVaR (Conditional VaR)</strong> vai alem: mede a perda media esperada
          <em>dentro</em> desses piores cenarios. E mais sensivel a caudas extremas — dizem
          quanto voce <em>realmente perderia</em> no dia ruim.
        </p>
      </section>
    </div>
  );
}

function RiskCard({
  title,
  description,
  value,
  percent,
  color,
}: {
  title: string;
  description: string;
  value: number;
  percent: number;
  color: 'yellow' | 'red';
}) {
  const borderColor = color === 'red' ? 'border-brand-red' : 'border-brand-yellow';
  const textColor = color === 'red' ? 'text-brand-red' : 'text-brand-yellow';
  return (
    <article className={`bg-gray-900/50 rounded-xl p-5 border-l-4 ${borderColor}`}>
      <div className="flex items-baseline justify-between mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>{title}</span>
        <span className="text-xs text-gray-500">{description}</span>
      </div>
      <p className={`text-3xl font-bold tabular-nums ${textColor}`}>
        {formatBRLCompact(value)}
      </p>
      <p className="text-xs text-gray-400 mt-1">{(percent * 100).toFixed(2)}% do portfolio</p>
      <p className="text-xs text-gray-500 mt-1">{formatBRL(value)} absoluto</p>
    </article>
  );
}
