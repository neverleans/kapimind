import Link from 'next/link';
import { Wallet, TrendingUp, TrendingDown, ArrowRight, BookOpen, Bell } from 'lucide-react';
import { formatBRL } from '@/lib/format';

const currentHoldings = [
  { ticker: 'MXRF11', name: 'Maxi Renda', qty: 73, avgPrice: 9.7, currentPrice: 9.44, sector: 'FII - Paper' },
  { ticker: 'VGHF11', name: 'Valora Hedge Fund', qty: 58, avgPrice: 7.07, currentPrice: 5.19, sector: 'FII - Paper' },
  { ticker: 'VGIA11', name: 'Valora CRA Fiagro', qty: 41, avgPrice: 9.95, currentPrice: 8.4, sector: 'Fiagro' },
];

export default function DashboardPage() {
  const totalInvested = currentHoldings.reduce((acc, h) => acc + h.qty * h.avgPrice, 0);
  const totalValue = currentHoldings.reduce((acc, h) => acc + h.qty * h.currentPrice, 0);
  const totalReturn = totalValue - totalInvested;
  const totalReturnPct = (totalReturn / totalInvested) * 100;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Wallet className="h-8 w-8 text-brand-blue" />
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400">Visão geral do portfólio (Inter, 11/08/2026)</p>
        </div>
      </header>

      {/* Top KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="glass-panel p-6 rounded-2xl border-l-4 border-brand-blue">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Patrimônio Atual</h3>
          <p className="text-3xl font-bold mt-2 tabular-nums">{formatBRL(totalValue)}</p>
          <p className="text-xs text-brand-blue mt-1">3 ativos · Banco Inter</p>
        </article>

        <article className="glass-panel p-6 rounded-2xl border-l-4 border-brand-purple">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Total Investido</h3>
          <p className="text-3xl font-bold mt-2 tabular-nums">{formatBRL(totalInvested)}</p>
          <p className="text-xs text-brand-purple mt-1">Custo de aquisição</p>
        </article>

        <article
          className={`glass-panel p-6 rounded-2xl border-l-4 ${
            totalReturn >= 0 ? 'border-brand-green' : 'border-brand-red'
          }`}
        >
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
            Resultado
          </h3>
          <p
            className={`text-3xl font-bold mt-2 tabular-nums flex items-center gap-2 ${
              totalReturn >= 0 ? 'text-brand-green' : 'text-brand-red'
            }`}
          >
            {totalReturn >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            {formatBRL(totalReturn)}
          </p>
          <p className={`text-xs mt-1 ${totalReturn >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
            {totalReturnPct.toFixed(2)}% desde entrada
          </p>
        </article>
      </section>

      {/* Holdings */}
      <section className="glass-panel p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-4">Holdings Atuais</h3>
        <div className="overflow-x-auto">
          <table className="w-full tabular-nums">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-white/10">
                <th className="pb-3">Ticker</th>
                <th className="pb-3">Nome</th>
                <th className="pb-3">Setor</th>
                <th className="pb-3 text-right">Qtd</th>
                <th className="pb-3 text-right">PM</th>
                <th className="pb-3 text-right">Cotação</th>
                <th className="pb-3 text-right">Valor</th>
                <th className="pb-3 text-right">P/L</th>
              </tr>
            </thead>
            <tbody>
              {currentHoldings.map((h) => {
                const value = h.qty * h.currentPrice;
                const cost = h.qty * h.avgPrice;
                const pnl = value - cost;
                const pnlPct = (pnl / cost) * 100;
                return (
                  <tr key={h.ticker} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 font-semibold">{h.ticker}</td>
                    <td className="py-3 text-gray-300">{h.name}</td>
                    <td className="py-3 text-gray-400 text-xs">{h.sector}</td>
                    <td className="py-3 text-right">{h.qty}</td>
                    <td className="py-3 text-right">{formatBRL(h.avgPrice)}</td>
                    <td className="py-3 text-right">{formatBRL(h.currentPrice)}</td>
                    <td className="py-3 text-right font-semibold">{formatBRL(value)}</td>
                    <td
                      className={`py-3 text-right font-semibold ${
                        pnl >= 0 ? 'text-brand-green' : 'text-brand-red'
                      }`}
                    >
                      {formatBRL(pnl)} ({pnlPct.toFixed(1)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/simulator"
          className="glass-panel p-6 rounded-2xl border-2 border-transparent hover:border-brand-green/50 transition-all group"
        >
          <TrendingUp className="h-8 w-8 text-brand-green mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold mb-1">Simular crescimento</h3>
          <p className="text-sm text-gray-400 mb-3">
            Projete seu patrimônio com R$ {Math.round(totalInvested / 100)} → R$ 1.500/mês
          </p>
          <span className="text-xs text-brand-green flex items-center gap-1">
            Abrir simulador <ArrowRight className="h-3 w-3" />
          </span>
        </Link>

        <Link
          href="/roadmap"
          className="glass-panel p-6 rounded-2xl border-2 border-transparent hover:border-brand-purple/50 transition-all group"
        >
          <BookOpen className="h-8 w-8 text-brand-purple mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold mb-1">Roadmap Educacional</h3>
          <p className="text-sm text-gray-400 mb-3">7 livros para virar investidor profissional</p>
          <span className="text-xs text-brand-purple flex items-center gap-1">
            Começar leitura <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </section>

      {/* Alerta contextual */}
      <section className="glass-panel p-6 rounded-2xl border-l-4 border-brand-yellow">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-brand-yellow mt-1" />
          <div>
            <h3 className="text-lg font-bold mb-2">Diagnóstico do prejuízo</h3>
            <p className="text-sm text-gray-300 mb-2">
              Sua carteira caiu <span className="text-brand-red font-bold">{totalReturnPct.toFixed(1)}%</span> por
              concentração em FIIs de papel/CRI no pior momento do ciclo de corte de Selic.
            </p>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li><strong>VGHF11</strong> em seca de dividendos (R$ 0,06, mínimo histórico)</li>
              <li><strong>VGIA11</strong> com calote confirmado da Cooperativa Languiru em CRA</li>
              <li><strong>MXRF11</strong> saudável (+20% YTD), prejuízo pequeno pelo preço de entrada</li>
            </ul>
            <p className="text-sm text-gray-400 mt-3">
              Recomendação: migrar gradualmente para{' '}
              <Link href="/simulator" className="text-brand-blue underline">
                nova alocação
              </Link>{' '}
              (Bogleheads 3-Fund com 30% renda fixa).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
