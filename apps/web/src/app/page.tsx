import Link from 'next/link';
import { TrendingUp, BookOpen, Bell, FileText, BarChart3, Wallet, Calculator, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Wallet,
      title: 'Dashboard',
      description: 'Visão geral do patrimônio, holdings, dividend yield e evolução mensal.',
      href: '/dashboard',
    },
    {
      icon: BarChart3,
      title: 'Simulador',
      description: 'Projete seu futuro financeiro em 15 anos com Fase 1 (yield) e Fase 2 (blindagem).',
      href: '/simulator',
    },
    {
      icon: Calculator,
      title: 'Calculadoras',
      description: 'Renda alvo, aporte extra, meta mensal. Quick wins em < 30s.',
      href: '/calculators',
    },
    {
      icon: TrendingUp,
      title: 'Explorador FIIs',
      description: 'Ranking, busca e indicadores fundamentalistas dos principais FIIs da B3.',
      href: '/explorer',
    },
    {
      icon: Bell,
      title: 'Alertas 24/7',
      description: 'TradingView → Telegram com sugestões geradas por IA baseadas no seu roadmap.',
      href: '/alerts',
    },
    {
      icon: BookOpen,
      title: 'Roadmap Educacional',
      description: '7 livros clássicos de investments para dominar valuation, behavior e disciplina.',
      href: '/roadmap',
    },
    {
      icon: FileText,
      title: 'Auxiliar de IR',
      description: 'Calcule e exporte seus informes de IRPF com poucos cliques.',
      href: '/ir-helper',
    },
  ];

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero */}
        <header className="text-center space-y-6 py-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue via-brand-purple to-brand-green">
            <TrendingUp className="inline-block mr-3 h-12 w-12 md:h-16 md:w-16 text-brand-purple" />
            Investimentos
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Plataforma pessoal de investments: portfólio, simulador, alertas 24/7 e roadmap
            educacional.
          </p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Plano de aceleração: R$ 600 → R$ 1.500/mês em 18 meses, com filtros Buffett, valuation
            Damodaran e disciplina Graham.
          </p>
        </header>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-brand-purple/50 transition-all hover:scale-105 group"
              >
                <Icon className="h-8 w-8 text-brand-purple mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{feature.description}</p>
                <span className="text-xs text-brand-purple flex items-center gap-1">
                  Acessar <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            );
          })}
        </section>

        {/* CTA */}
        <section className="glass-panel p-8 rounded-2xl text-center space-y-4">
          <h2 className="text-2xl font-bold">Comece pelo Roadmap Educacional</h2>
          <p className="text-gray-400">
            7 livros · 12-15 lições cada · 1 capítulo por noite durante 6 meses.
          </p>
          <Link
            href="/roadmap"
            className="inline-block bg-brand-purple hover:bg-purple-600 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-purple-500/30"
          >
            Acessar Roadmap →
          </Link>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-500 py-6 border-t border-white/10">
          <p>
            v1.0.0 · Next.js 15 + NestJS 10 + PostgreSQL 17 + Anthropic IA · Plano em{' '}
            <a
              href="https://github.com/lucas/investimentos"
              className="hover:text-brand-blue"
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
