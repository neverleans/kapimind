'use client';

import { useState } from 'react';
import { Send, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { ScoreBadge } from '@/components/ScoreBadge';
import { formatPercent } from '@/lib/format';

interface SentimentResult {
  score: number;
  label: string;
  confidence: number;
  signals: { bullish: string[]; bearish: string[]; intensifiers: string[] };
  badge: 'REDUCE' | 'HOLD' | 'INCREASE';
}

export default function SentimentPage() {
  const [text, setText] = useState('A empresa registrou queda de dividendo e pessimismo geral do mercado.');
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      // erro silencioso
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="text-center space-y-2">
        <Sparkles className="h-12 w-12 mx-auto text-brand-purple" />
        <h1 className="text-3xl font-bold">Sentiment Analysis</h1>
        <p className="text-sm text-gray-400">
          Análise de sentimento PT-BR · MVP lexical (HF Inference API no roadmap)
        </p>
      </header>

      {/* Input */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl space-y-3">
        <label className="block text-sm text-gray-400">Texto da notícia</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-brand-purple"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-brand-purple hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {loading ? 'Analisando...' : 'Analisar'}
        </button>
      </form>

      {/* Result */}
      {result && (
        <>
          <section className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Score: {formatPercent(result.score, 1)}</h2>
                <p className="text-xs text-gray-500">
                  Confiança: {formatPercent(result.confidence, 1)}
                </p>
              </div>
              <ScoreBadge score={Math.round((result.score + 1) * 50)} bucket={result.badge} size="lg" />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <SignalList label="Bullish" items={result.signals.bullish} color="green" icon={TrendingUp} />
              <SignalList label="Bearish" items={result.signals.bearish} color="red" icon={TrendingDown} />
            </div>

            {result.signals.intensifiers.length > 0 && (
              <div className="mt-3 text-xs text-gray-400">
                Intensificadores: {result.signals.intensifiers.join(', ')}
              </div>
            )}
          </section>

          <section className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-bold mb-2">Label</h3>
            <p className="text-sm text-gray-300">{result.label}</p>
            <p className="text-xs text-gray-500 mt-2">
              Roadmap: integrar lucas-leme/FinBERT-PT-BR (Hugging Face) quando 500 req/dia
              atingirem o limite.
            </p>
          </section>
        </>
      )}

      {!result && (
        <div className="glass-panel p-12 rounded-2xl text-center text-gray-500">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Cole um texto acima para analisar o sentimento.</p>
        </div>
      )}
    </div>
  );
}

function SignalList({
  label,
  items,
  color,
  icon: Icon,
}: {
  label: string;
  items: string[];
  color: 'green' | 'red';
  icon: any;
}) {
  const colorClass = color === 'green' ? 'border-brand-green/30 text-brand-green' : 'border-brand-red/30 text-brand-red';
  const bgClass = color === 'green' ? 'bg-brand-green/10' : 'bg-brand-red/10';
  return (
    <article className={`rounded-xl p-3 border ${colorClass} ${bgClass}`}>
      <div className="flex items-center gap-1 mb-2 text-xs font-bold uppercase tracking-wider">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500">Nenhum termo detectado</p>
      ) : (
        <ul className="text-xs space-y-1">
          {items.slice(0, 8).map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
