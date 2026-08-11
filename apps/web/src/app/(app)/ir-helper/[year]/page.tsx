'use client';

import { useIr } from '@/lib/use-ir';
import { formatBRL } from '@/lib/format';
import { FileText, Printer, Download, Info, Loader2, Plus, X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import * as React from 'react';

interface PageProps {
  params: Promise<{ year: string }>;
}

const declaracoes = [
  { nome: 'Bens e Direitos — Cotas de FIIs', codigo: '73', descricao: 'Discriminar FIIs pelo preço de aquisição' },
  { nome: 'Rendimentos Isentos — Dividendos de FIIs', codigo: '09', descricao: 'FIIs são isentos para PF (Lei 11.196/2005)' },
  { nome: 'Ganho de Capital — Venda > R$ 20.000/mês', codigo: '6015', descricao: 'DARF até último dia útil do mês seguinte' },
  { nome: 'Operações Comuns — Ações swing', codigo: '6015', descricao: '15% até R$ 5M, 17,5% de 5-10M, 20% de 10-30M, 22,5% acima' },
  { nome: 'Day-Trade', codigo: '6015', descricao: '20% sobre lucro (alíquota única)' },
];

export default function IRHelperYearPage({ params }: PageProps) {
  const { year: yearStr } = React.use(params);
  const year = Number(yearStr);
  const { summary, loading, error, refetch, addTransaction } = useIr(year);
  const [showForm, setShowForm] = useState(false);

  if (Number.isNaN(year)) {
    return (
      <div className="glass-panel p-6 rounded-2xl">
        <p className="text-red-300">Ano inválido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auxiliar IR {year}</h1>
          <p className="text-sm text-gray-400">Declaração de IRPF · Ano-calendário {year}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/ir/${year}/csv`}
            download={`ir-${year}.csv`}
            className="flex items-center gap-2 px-3 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 text-sm"
          >
            <Download className="h-4 w-4" />
            CSV
          </a>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-brand-purple hover:bg-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm"
          >
            <Plus className="h-4 w-4" />
            Transação
          </button>
        </div>
      </header>

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-brand-red/30">
          <p className="text-sm text-red-300">⚠ {error}</p>
        </div>
      )}

      {/* Year Selector */}
      <section className="flex items-center gap-2">
        {[2024, 2025, 2026, 2027].map((y) => (
          <a
            key={y}
            href={`/ir-helper/${y}`}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              y === year
                ? 'bg-brand-purple text-white'
                : 'border border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {y}
          </a>
        ))}
      </section>

      {/* KPIs */}
      {summary && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <article className="glass-panel p-4 rounded-2xl">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Compras</p>
            <p className="text-2xl font-bold mt-1 text-brand-blue tabular-nums">{formatBRL(summary.totalBuyAmount)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.totalBuys} operações</p>
          </article>
          <article className="glass-panel p-4 rounded-2xl">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Vendas</p>
            <p className="text-2xl font-bold mt-1 text-brand-green tabular-nums">
              {formatBRL(summary.totalSellAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{summary.totalSells} operações</p>
          </article>
          <article className="glass-panel p-4 rounded-2xl">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Dividendos</p>
            <p className="text-2xl font-bold mt-1 text-brand-yellow tabular-nums">
              {formatBRL(summary.totalDividendAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Isento (FIIs)</p>
          </article>
          <article
            className={`glass-panel p-4 rounded-2xl border-l-4 ${
              summary.totalIrDue > 0 ? 'border-brand-red' : 'border-brand-green'
            }`}
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider">IR Devido</p>
            <p
              className={`text-2xl font-bold mt-1 tabular-nums ${
                summary.totalIrDue > 0 ? 'text-brand-red' : 'text-brand-green'
              }`}
            >
              {formatBRL(summary.totalIrDue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.totalIrDue > 0 ? 'DARF código 6015' : 'Isento (< R$ 20k/mês)'}
            </p>
          </article>
        </section>
      )}

      {/* Months over exemption */}
      {summary && summary.monthsOverExemption.length > 0 && (
        <section className="glass-panel p-6 rounded-2xl border-l-4 border-brand-red">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-brand-red" />
            Meses com vendas acima de R$ 20.000
          </h2>
          <div className="space-y-2">
            {summary.monthsOverExemption.map((m) => (
              <div key={m.month} className="flex justify-between text-sm">
                <span className="text-gray-400">{m.month}</span>
                <span className="tabular-nums">
                  Vendas: {formatBRL(m.total)} → IR: {formatBRL(m.irDue)} (15%)
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transactions */}
      <section className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Transações ({summary?.totalTransactions ?? 0})</h2>

        {loading && !summary ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : !summary || summary.transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhuma transação registrada em {year}.</p>
            <p className="text-xs mt-1">Clique em &quot;Transação&quot; para adicionar manualmente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tabular-nums">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-white/10">
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Ticker</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3 text-right">Qtd</th>
                  <th className="pb-3 text-right">Preço</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.transactions.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-sm text-gray-400">{t.date}</td>
                    <td className="py-3 font-semibold">{t.ticker}</td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          t.type === 'BUY'
                            ? 'bg-brand-blue text-white'
                            : t.type === 'SELL'
                              ? 'bg-brand-red text-white'
                              : 'bg-brand-yellow text-gray-900'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 text-right">{t.quantity}</td>
                    <td className="py-3 text-right">{formatBRL(t.price)}</td>
                    <td className="py-3 text-right font-semibold">{formatBRL(t.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DIRPF codes */}
      <section className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Códigos na DIRPF</h2>
        <div className="space-y-3">
          {declaracoes.map((d) => (
            <article key={d.codigo} className="flex items-start gap-4 p-3 rounded-xl border border-white/5 hover:bg-white/5">
              <div className="flex-shrink-0 w-16 text-center">
                <span className="inline-block px-2 py-1 rounded font-mono font-bold text-brand-blue bg-blue-500/10 text-sm">
                  {d.codigo}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{d.nome}</h3>
                <p className="text-xs text-gray-400 mt-1">{d.descricao}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Add Transaction Modal */}
      {showForm && (
        <AddTransactionModal
          onClose={() => setShowForm(false)}
          onSubmit={async (data) => {
            await addTransaction(data);
            setShowForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function AddTransactionModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: {
    ticker: string;
    type: string;
    quantity: number;
    price: number;
    fees: number;
    occurredAt: string;
    notes?: string;
  }) => void;
}) {
  const [form, setForm] = useState({
    ticker: '',
    type: 'BUY',
    quantity: 1,
    price: 0,
    fees: 0,
    occurredAt: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  function handleSubmit() {
    onSubmit({
      ticker: form.ticker.toUpperCase(),
      type: form.type,
      quantity: form.quantity,
      price: form.price,
      fees: form.fees,
      occurredAt: new Date(form.occurredAt).toISOString(),
      notes: form.notes || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-2xl max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Nova Transação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Ticker</label>
            <input
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm uppercase"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
              <option value="DIVIDEND">DIVIDEND</option>
              <option value="JCP">JCP</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Quantidade</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Data</label>
            <input
              type="date"
              value={form.occurredAt}
              onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-brand-green hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
