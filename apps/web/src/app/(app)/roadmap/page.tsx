'use client';

import { useBookProgress, getBookProgressBySlug } from '@/lib/use-book-progress';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock, ArrowRight, Flame, Loader2 } from 'lucide-react';
import { BOOKS, CATEGORY_LABELS, COLOR_CLASSES } from '@/lib/books';

export default function RoadmapPage() {
  const { progress, loading, error } = useBookProgress();

  const overallProgress = progress?.overall.progress ?? 0;
  const streak = progress?.streak ?? 0;

  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <BookOpen className="h-12 w-12 text-brand-purple" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">Roadmap Educacional</h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          7 livros clássicos de investimentos. 1 lição por noite durante 6 meses.
        </p>
      </header>

      {/* Streak + Overall progress */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="glass-panel p-6 rounded-2xl border-l-4 border-brand-yellow">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-1">Streak</h3>
              <p className="text-3xl font-bold flex items-center gap-2">
                <Flame className="h-7 w-7 text-brand-yellow" />
                {streak} {streak === 1 ? 'dia' : 'dias'}
              </p>
            </div>
            <div className="text-xs text-gray-500 text-right">
              {streak === 0 ? 'Comece hoje!' : 'Continue amanhã!'}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Loss aversion 2.4x: mantenha o streak para reter conhecimento.
          </p>
        </article>

        <article className="glass-panel p-6 rounded-2xl border-l-4 border-brand-green">
          <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-1">Progresso Geral</h3>
          <p className="text-3xl font-bold mb-2 tabular-nums">{overallProgress}%</p>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-green to-brand-blue transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {progress?.overall.read ?? 0} lidas / {progress?.overall.total ?? 0} total
          </p>
        </article>
      </section>

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-brand-red/30">
          <p className="text-sm text-red-300">⚠ {error}</p>
        </div>
      )}

      {/* Books Grid */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Livros</h2>
        {loading && !progress ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BOOKS.map((book) => {
              const colors = COLOR_CLASSES[book.color];
              const bookProgress = getBookProgressBySlug(progress, book.slug);
              const total = bookProgress?.total ?? book.lessons.length;
              const read = (bookProgress?.read ?? 0) + (bookProgress?.mastered ?? 0);
              const pct = total > 0 ? Math.round((read / total) * 100) : 0;

              return (
                <Link
                  key={book.slug}
                  href={`/roadmap/${book.slug}`}
                  className={`glass-panel p-6 rounded-2xl border-2 border-transparent hover:${colors.border} transition-all group`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} text-white`}>
                      Mês {book.month}
                    </div>
                    <div className={`text-xs uppercase tracking-wide ${colors.text}`}>
                      {CATEGORY_LABELS[book.category]}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-1">{book.author} · {book.year}</p>
                  <p className="text-sm text-gray-300 mb-4 line-clamp-3">{book.summary}</p>

                  {/* Progress bar per book */}
                  {total > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{read}/{total} lidas</span>
                        <span className="font-mono">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bg} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {book.lessons.length} lições
                    </span>
                    <span className={`flex items-center gap-1 ${colors.text} group-hover:translate-x-1 transition-transform`}>
                      Ler <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Reading rhythm */}
      <section className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand-green" />
          Ritmo de Leitura Recomendado
        </h2>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• Mês 1: leia 1 lição por dia dos livros de Mentalidade (Pai Rico + Mente Milionária)</li>
          <li>• Mês 2: O Investidor Inteligente (Graham) — leia 1 lição por dia</li>
          <li>• Mês 3: The Little Book of Valuation (Damodaran) — 1 lição/dia</li>
          <li>• Mês 4: Manual de Análise Técnica (Marcos Abe) — 1 lição/dia</li>
          <li>• Mês 5: Warren Buffett Accounting Book (Brodersen/Pysh) — 1 lição/dia</li>
          <li>• Mês 6: A Random Walk Down Wall Street (Malkiel) — 1 lição/dia</li>
        </ul>
      </section>
    </div>
  );
}
