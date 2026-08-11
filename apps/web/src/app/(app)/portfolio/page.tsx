'use client';

import { usePortfolio, getAssetTypeLabel } from '@/lib/use-portfolio';
import { AddHoldingForm } from '@/components/portfolio/add-holding-form';
import { Trash2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { formatBRL } from '@/lib/format';

export default function PortfolioPage() {
  const { holdings, summary, loading, error, refetch, removeHolding } = usePortfolio();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfólio</h1>
          <p className="text-sm text-gray-400">Inter · seed-portfolio</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <AddHoldingForm onAdded={refetch} />
        </div>
      </header>

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-brand-red/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-brand-red mt-0.5" />
          <div>
            <p className="text-sm text-red-300">{error}</p>
            <p className="text-xs text-gray-400 mt-1">Usando dados offline (fallback).</p>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <article className="glass-panel p-4 rounded-2xl">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Investido</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{formatBRL(summary.totalInvested)}</p>
          </article>
          <article className="glass-panel p-4 rounded-2xl">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Valor Atual</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{formatBRL(summary.totalValue)}</p>
          </article>
          <article className="glass-panel p-4 rounded-2xl">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Dividendos</p>
            <p className="text-2xl font-bold mt-1 text-brand-yellow tabular-nums">{formatBRL(summary.totalDividends)}</p>
          </article>
          <article
            className={`glass-panel p-4 rounded-2xl ${
              summary.pnl >= 0 ? 'border-l-4 border-brand-green' : 'border-l-4 border-brand-red'
            }`}
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider">P&L</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${summary.pnl >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
              {formatBRL(summary.pnl)} ({summary.pnlPct.toFixed(2)}%)
            </p>
          </article>
        </section>
      )}

      {/* Holdings */}
      <section className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Holdings ({holdings.length})</h2>

        {loading && holdings.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : holdings.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Nenhum holding cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tabular-nums">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-white/10">
                  <th className="pb-3">Ticker</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3 text-right">Qtd</th>
                  <th className="pb-3 text-right">PM</th>
                  <th className="pb-3 text-right">Cotação</th>
                  <th className="pb-3 text-right">Valor</th>
                  <th className="pb-3 text-right">DY</th>
                  <th className="pb-3 text-right">P/VP</th>
                  <th className="pb-3 text-right">P&L</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const value = h.marketValue ?? h.quantity * h.avgPrice;
                  const cost = h.quantity * h.avgPrice;
                  const pnl = value - cost;
                  const pnlPct = (pnl / cost) * 100;
                  return (
                    <tr key={h.ticker} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 font-semibold">{h.ticker}</td>
                      <td className="py-3 text-xs text-gray-400">{getAssetTypeLabel(h.type)}</td>
                      <td className="py-3 text-right">{h.quantity}</td>
                      <td className="py-3 text-right">{formatBRL(h.avgPrice)}</td>
                      <td className="py-3 text-right">{h.lastPrice ? formatBRL(h.lastPrice) : '—'}</td>
                      <td className="py-3 text-right font-semibold">{formatBRL(value)}</td>
                      <td className="py-3 text-right text-brand-green">
                        {h.dividendYield ? `${h.dividendYield.toFixed(2)}%` : '—'}
                      </td>
                      <td className={`py-3 text-right ${h.pvp && h.pvp < 1 ? 'text-brand-green' : 'text-brand-yellow'}`}>
                        {h.pvp ? h.pvp.toFixed(2) : '—'}
                      </td>
                      <td className={`py-3 text-right font-semibold ${pnl >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                        {formatBRL(pnl)} ({pnlPct.toFixed(1)}%)
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => removeHolding(h.ticker)}
                          disabled={loading}
                          className="text-brand-red hover:text-red-300 disabled:opacity-30"
                          title="Remover holding"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
