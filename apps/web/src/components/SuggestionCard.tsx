'use client';

import { ArrowRight, X, Check, Clock, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { ScoreBadge } from './ScoreBadge';
import { useState } from 'react';

export interface Suggestion {
  id: string;
  fromTicker: string;
  toTicker: string;
  score: number; // 0-100
  bucket: 'REDUCE' | 'HOLD' | 'INCREASE';
  reason: string;
  paperTradeGain: number; // projeção 12m
  createdAt: string;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept?: () => void;
  onDismiss?: () => void;
  onSnooze?: (days: number) => void;
  loading?: boolean;
}

export function SuggestionCard({ suggestion, onAccept, onDismiss, onSnooze, loading }: SuggestionCardProps) {
  const [snoozing, setSnoozing] = useState(false);
  const isUp = suggestion.bucket === 'INCREASE';
  const isDown = suggestion.bucket === 'REDUCE';

  return (
    <article className="glass-panel p-5 rounded-2xl border-l-4 border-brand-purple space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isDown ? (
              <TrendingDown className="h-4 w-4 text-brand-red" />
            ) : isUp ? (
              <TrendingUp className="h-4 w-4 text-brand-green" />
            ) : (
              <Clock className="h-4 w-4 text-brand-yellow" />
            )}
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Sugestão adaptativa
            </span>
          </div>
          <h3 className="text-lg font-bold flex items-center gap-2 flex-wrap">
            {suggestion.fromTicker}
            <ArrowRight className="h-4 w-4 text-gray-500" />
            {suggestion.toTicker}
          </h3>
        </div>
        <ScoreBadge score={suggestion.score} bucket={suggestion.bucket} size="lg" />
      </div>

      {/* Reason */}
      <p className="text-sm text-gray-300">{suggestion.reason}</p>

      {/* Paper trade projection */}
      <div className="bg-gray-900/50 rounded-lg p-3 border border-white/5">
        <p className="text-xs text-gray-500 mb-1">Projeção paper-trade (12m)</p>
        <p
          className={`text-lg font-bold tabular-nums ${
            suggestion.paperTradeGain >= 0 ? 'text-brand-green' : 'text-brand-red'
          }`}
        >
          {suggestion.paperTradeGain >= 0 ? '+' : ''}
          {suggestion.paperTradeGain.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        <button
          onClick={onAccept}
          disabled={loading}
          className="flex items-center gap-1 bg-brand-green hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold text-sm disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Aceitar e rebalancear
        </button>
        <button
          onClick={onDismiss}
          disabled={loading}
          className="flex items-center gap-1 border border-gray-600 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-full font-semibold text-sm disabled:opacity-50 transition-all"
        >
          <X className="h-3 w-3" />
          Agora não
        </button>
        <div className="relative">
          <button
            onClick={() => setSnoozing(!snoozing)}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-full transition-all"
          >
            <Clock className="h-3 w-3" />
            Lembrar em 7 dias
          </button>
          {snoozing && (
            <div className="absolute top-full mt-1 right-0 glass-panel p-2 rounded-lg text-xs z-10 min-w-[150px]">
              {onSnooze && (
                <>
                  <button
                    onClick={() => {
                      onSnooze(1);
                      setSnoozing(false);
                    }}
                    className="block w-full text-left px-2 py-1 hover:bg-white/10 rounded"
                  >
                    1 dia
                  </button>
                  <button
                    onClick={() => {
                      onSnooze(7);
                      setSnoozing(false);
                    }}
                    className="block w-full text-left px-2 py-1 hover:bg-white/10 rounded"
                  >
                    7 dias
                  </button>
                  <button
                    onClick={() => {
                      onSnooze(30);
                      setSnoozing(false);
                    }}
                    className="block w-full text-left px-2 py-1 hover:bg-white/10 rounded"
                  >
                    30 dias
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
