import { TrendingUp, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const topFIIs = [
  { ticker: 'HGLG11', name: 'Cshg Logística', segment: 'Logística', price: 158.2, dy: 9.05, pvp: 0.88, recommendation: 'COMPRAR' },
  { ticker: 'BTLG11', name: 'BTG Pactual Logística', segment: 'Logística', price: 102.5, dy: 9.45, pvp: 0.94, recommendation: 'COMPRAR' },
  { ticker: 'XPML11', name: 'XP Malls', segment: 'Shoppings', price: 105.4, dy: 10.36, pvp: 0.97, recommendation: 'COMPRAR' },
  { ticker: 'KNCR11', name: 'Kinea Rendimentos', segment: 'Recebíveis', price: 102.8, dy: 10.5, pvp: 1.03, recommendation: 'MANTER' },
  { ticker: 'MXRF11', name: 'Maxi Renda', segment: 'Recebíveis', price: 9.44, dy: 12.66, pvp: 1.02, recommendation: 'MANTER' },
  { ticker: 'VISC11', name: 'Vinci Shopping Centers', segment: 'Shoppings', price: 109.3, dy: 9.95, pvp: 0.95, recommendation: 'MANTER' },
];

const recColors = {
  COMPRAR: 'bg-brand-green',
  MANTER: 'bg-brand-yellow',
  VENDER: 'bg-brand-red',
};

export default function ExplorerPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-brand-purple" />
        <div>
          <h1 className="text-3xl font-bold">Explorador FIIs</h1>
          <p className="text-sm text-gray-400">Top FIIs para 2026 (curado pelo plano Bogleheads)</p>
        </div>
      </header>

      {/* Search */}
      <section className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar FII por ticker ou nome (em breve: integração brapi)"
            disabled
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:border-brand-purple disabled:opacity-50"
          />
        </div>
      </section>

      {/* Ranking */}
      <section className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Curadoria 2026</h2>
        <p className="text-sm text-gray-400 mb-4">
          Apenas FIIs que passaram nos 4 filtros de Buffett (gestão vigilante, perspectiva de longo
          prazo, negócio estável, preço atrativo) + DY &gt; 8%.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full tabular-nums">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-white/10">
                <th className="pb-3">Ticker</th>
                <th className="pb-3">Nome</th>
                <th className="pb-3">Segmento</th>
                <th className="pb-3 text-right">Cotação</th>
                <th className="pb-3 text-right">DY 12m</th>
                <th className="pb-3 text-right">P/VP</th>
                <th className="pb-3 text-center">Recomendação</th>
              </tr>
            </thead>
            <tbody>
              {topFIIs.map((f) => (
                <tr key={f.ticker} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 font-semibold">{f.ticker}</td>
                  <td className="py-3 text-gray-300">{f.name}</td>
                  <td className="py-3 text-gray-400 text-xs">{f.segment}</td>
                  <td className="py-3 text-right">R$ {f.price.toFixed(2)}</td>
                  <td className="py-3 text-right text-brand-green">{f.dy.toFixed(2)}%</td>
                  <td className={`py-3 text-right ${f.pvp < 1 ? 'text-brand-green' : 'text-brand-yellow'}`}>
                    {f.pvp.toFixed(2)}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${recColors[f.recommendation as keyof typeof recColors]} text-white`}>
                      {f.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="glass-panel p-6 rounded-2xl text-center space-y-3">
        <p className="text-sm text-gray-400">
          Ranking dinâmico via <code>brapi.dev</code> + ranking com filtros Buffett (ROE &gt; 8%, D/E
          &lt; 0.5, P/VP &lt; 1.5) — FASE 3.
        </p>
        <Link
          href="/simulator"
          className="inline-flex items-center gap-2 text-sm text-brand-purple hover:text-white"
        >
          Simular compra destes FIIs <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
