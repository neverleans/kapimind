'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, Activity, AlertCircle, BarChart3 } from 'lucide-react';
import { ScoreBadge } from '@/components/ScoreBadge';
import { formatBRL } from '@/lib/format';

interface FScoreDetail {
  ticker: string;
  total: number;
  band: 'muito-fraco' | 'fraco' | 'neutro' | 'saudavel' | 'muito-saudavel';
  score: { rentabilidade: number; alavancagem: number; eficiencia: number };
  breakdown: Record<string, number>;
  reasoning: string[];
  source?: string;
  note?: string;
}

const BAND_LABEL: Record<FScoreDetail['band'], string> = {
  'muito-fraco': 'Muito Fraco',
  fraco: 'Fraco',
  neutro: 'Neutro',
  saudavel: 'Saudável',
  'muito-saudavel': 'Muito Saudável',
};

const BAND_COLOR: Record<FScoreDetail['band'], string> = {
  'muito-fraco': 'text-brand-red',
  fraco: 'text-brand-red',
  neutro: 'text-gray-400',
  saudavel: 'text-brand-green',
  'muito-saudavel': 'text-brand-green',
};

const REASON_LABELS: Record<string, string> = {
  'lucro-positivo': 'Lucro líquido positivo',
  'cfo-positivo': 'Caixa operacional positivo',
  'roa-cresceu': 'ROA cresceu vs ano anterior',
  'cfo-maior-que-lucro': 'Caixa > Lucro (baixa accruals)',
  'divida-caiu': 'Dívida total diminuiu',
  'equity-cresceu': 'Equity (PL) aumentou',
  'sem-diluicao': 'Sem emissão de novas ações',
  'margem-bruta-cresceu': 'Margem bruta cresceu',
  'giro-ativo-cresceu': 'Giro de ativo cresceu',
};

export default function FScorePage() {
  const [ticker, setTicker] = useState('VALE3');
  const [data, setData] = useState<FScoreDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/f-score/${encodeURIComponent(ticker.toUpperCase())}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Calculator className="h-8 w-8 text-brand-purple" />
        <div>
          <h1 className="text-3xl font-bold">Piotroski F-Score</h1>
          <p className="text-sm text-gray-400">Saúde financeira de empresas (0-9)</p>
        </div>
      </header>

      {/* Form */}
      <section className="glass-panel p-6 rounded-2xl">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="VALE3"
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:border-brand-purple"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-brand-purple hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Calculando...' : 'Calcular F-Score'}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Para patrimônio, descubra empresas com F-Score 7-9 historicamente associadas a outperform.
        </p>
      </section>

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-brand-red/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-brand-red mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Big score */}
          <section className="glass-panel p-8 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{data.ticker}</h2>
                <p className={`text-sm font-semibold ${BAND_COLOR[data.band]}`}>
                  {BAND_LABEL[data.band]}
                </p>
                {data.source === 'mock' && (
                  <p className="text-xs text-gray-500 mt-1 italic">⚠ Dados mockados · {data.note}</p>
                )}
              </div>
              <ScoreBadge score={data.total} bucket={
                data.band === 'muito-saudavel' || data.band === 'saudavel' ? 'INCREASE' :
                data.band === 'muito-fraco' || data.band === 'fraco' ? 'REDUCE' : 'HOLD'
              } size="lg" />
            </div>

            {/* Sub-scores */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <SubScore label="Rentabilidade" value={data.score.rentabilidade} of={4} icon={TrendingUp} />
              <SubScore label="Alavancagem" value={data.score.alavancagem} of={3} icon={Activity} />
              <SubScore label="Eficiência" value={data.score.eficiencia} of={2} icon={BarChart3} />
            </div>
          </section>

          {/* Breakdown */}
          <section className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4">Critérios (9 sinais)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(data.breakdown).map(([key, value]) => (
                <div
                  key={key}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                    value === 1
                      ? 'bg-brand-green/10 border-brand-green/30 text-brand-green'
                      : 'bg-brand-red/10 border-brand-red/30 text-brand-red'
                  }`}
                >
                  <span className="text-xl">{value === 1 ? '✓' : '✗'}</span>
                  <span className="text-sm">{REASON_LABELS[key] ?? key}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {!data && !loading && (
        <div className="glass-panel p-12 rounded-2xl text-center text-gray-500">
          <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Digite um ticker acima (ex: PETR4, VALE3, ITUB4) para calcular o F-Score.</p>
        </div>
      )}
    </div>
  );
}

function SubScore({
  label,
  value,
  of,
  icon: Icon,
}: {
  label: string;
  value: number;
  of: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pct = (value / of) * 100;
  const color = pct >= 75 ? 'text-brand-green' : pct >= 50 ? 'text-brand-yellow' : 'text-brand-red';
  return (
    <article className="bg-gray-900/50 rounded-xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className={`font-mono font-bold ${color}`}>{value}/{of}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${pct >= 75 ? 'bg-brand-green' : pct >= 50 ? 'bg-brand-yellow' : 'bg-brand-red'}`} style={{ width: `${pct}%` }} />
      </div>
    </article>
  );
}
