'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { getBook, BOOKS, CATEGORY_LABELS, COLOR_CLASSES } from '@/lib/books';
import { useBookProgress, LessonStatus, BookProgress } from '@/lib/use-book-progress';
import { useState } from 'react';

interface Book {
  slug: string;
  title: string;
  author: string;
  year: number;
  category: 'mentalidade' | 'valor' | 'valuation' | 'analise-tecnica' | 'macro';
  month: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  summary: string;
  lessons: Array<{ title: string; key: string; application: string }>;
  criticisms: string[];
}

interface ColorSet {
  bg: string;
  text: string;
  border: string;
}

export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('');

  // Resolve params
  params.then((p) => setSlug(p.slug));

  const book = slug ? getBook(slug) : undefined;
  if (!slug) return null;
  if (!book) notFound();

  const colors = COLOR_CLASSES[book.color];
  const bookIndex = BOOKS.findIndex((b) => b.slug === book.slug);
  const prevBook = bookIndex > 0 ? BOOKS[bookIndex - 1] : null;
  const nextBook = bookIndex < BOOKS.length - 1 ? BOOKS[bookIndex + 1] : null;

  return (
    <BookContent
      book={book}
      colors={colors}
      prevBook={prevBook}
      nextBook={nextBook}
    />
  );
}

function BookContent({
  book,
  colors,
  prevBook,
  nextBook,
}: {
  book: Book;
  colors: ColorSet;
  prevBook: Book | null;
  nextBook: Book | null;
}) {
  const { progress } = useBookProgress();
  const bookProgress = progress?.books.find((b) => b.bookSlug === book.slug) ?? null;
  const total = bookProgress?.total ?? book.lessons.length;
  const read = (bookProgress?.read ?? 0) + (bookProgress?.mastered ?? 0);
  const pct = total > 0 ? Math.round((read / total) * 100) : 0;

  // Buscar progresso detalhado (com lições) deste livro específico
  const { data: detailed, markLesson: markDetail } = useBookProgress(book.slug);

  function getStatus(lessonIdx: number): LessonStatus {
    const lessons = (detailed?.lessons ?? []) as Array<{ lessonIdx: number; status: LessonStatus }>;
    const lesson = lessons.find((l) => l.lessonIdx === lessonIdx);
    return lesson?.status ?? 'STARTED';
  }

  async function cycleStatus(lessonIdx: number) {
    const current = getStatus(lessonIdx);
    const next: LessonStatus = current === 'STARTED' ? 'READ' : current === 'READ' ? 'MASTERED' : 'STARTED';
    await markDetail(book.slug, lessonIdx, next);
  }

  return (
    <article className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/roadmap" className="hover:text-white">
          Roadmap
        </Link>
        <span>/</span>
        <span className="text-white">{book.title}</span>
      </nav>

      <header className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} text-white`}>
            Mês {book.month}
          </div>
          <div className={`text-xs uppercase tracking-wide ${colors.text}`}>
            {CATEGORY_LABELS[book.category]}
          </div>
          <div className="text-xs text-gray-500">{book.author} · {book.year}</div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold">{book.title}</h1>
        <p className="text-xl text-gray-300">{book.summary}</p>

        {/* Inline progress */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400 tabular-nums">
            {read}/{total} lidas ({pct}%)
          </div>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-md">
            <div
              className={`h-full ${colors.bg} transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <section className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-brand-purple" />
          O que você vai aprender
        </h2>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• {book.lessons.length} lições práticas (1 por noite)</li>
          <li>• Aplicação contextualizada para o seu caso (R$ 600/mês, holdings atuais)</li>
          <li>• Críticas ao livro (para não virar guru cego)</li>
          <li>• Conexão com outros livros do roadmap</li>
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Lições</h2>
        <p className="text-sm text-gray-400">
          Clique no círculo à esquerda para marcar <strong>STARTED</strong> → <strong>READ</strong> →{' '}
          <strong>MASTERED</strong>.
        </p>

        <div className="space-y-4">
          {book.lessons.map((lesson, idx) => {
            const status = getStatus(idx);
            const StatusIcon =
              status === 'MASTERED'
                ? CheckCircle2
                : status === 'READ'
                  ? CheckCircle2
                  : Circle;
            const statusColor =
              status === 'MASTERED'
                ? 'text-brand-green'
                : status === 'READ'
                  ? 'text-brand-yellow'
                  : 'text-gray-500';

            return (
              <article key={idx} className={`glass-panel p-6 rounded-2xl border-l-4 ${colors.border}`}>
                <div className="flex items-start gap-3 mb-3">
                  <button
                    onClick={() => cycleStatus(idx)}
                    className={`flex-shrink-0 mt-1 hover:scale-110 transition-transform ${statusColor}`}
                    title={`Status atual: ${status}. Clique para avançar para ${status === 'MASTERED' ? 'STARTED' : status === 'READ' ? 'MASTERED' : 'READ'}`}
                  >
                    <StatusIcon className="h-7 w-7" />
                  </button>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{lesson.title}</h3>
                    <span className={`text-xs ${statusColor} font-mono uppercase tracking-wider`}>
                      {status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-brand-blue">Conceito-chave:</span>
                    <p className="text-gray-300 mt-1">{lesson.key}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-brand-green">Como aplicar HOJE:</span>
                    <p className="text-gray-300 mt-1">{lesson.application}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="glass-panel p-6 rounded-2xl border-l-4 border-brand-yellow">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-brand-yellow" />
          Críticas ao livro
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Para não virar guru cego, conheça as fragilidades do livro.
        </p>
        <ul className="space-y-2 text-sm text-gray-300">
          {book.criticisms.map((c, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-brand-yellow">⚠</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <nav className="flex items-center justify-between border-t border-white/10 pt-8">
        {prevBook ? (
          <Link href={`/roadmap/${prevBook.slug}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <div>
              <div className="text-xs text-gray-500">Anterior</div>
              <div className="font-semibold">{prevBook.title}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextBook ? (
          <Link href={`/roadmap/${nextBook.slug}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white text-right">
            <div>
              <div className="text-xs text-gray-500">Próximo</div>
              <div className="font-semibold">{nextBook.title}</div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link href="/roadmap" className="flex items-center gap-2 text-sm text-brand-purple hover:text-white">
            <div className="text-right">
              <div className="text-xs text-gray-500">Fim do roadmap!</div>
              <div className="font-semibold">Voltar ao início</div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </article>
  );
}
