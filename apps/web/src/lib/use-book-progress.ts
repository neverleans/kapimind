/**
 * Hook que gerencia BookProgress via API.
 * Estado local + persistencia.
 */

import { useEffect, useState, useCallback } from 'react';

const USER_ID = 'default-user'; // single-user mode

export type LessonStatus = 'STARTED' | 'READ' | 'MASTERED';

export interface LessonProgress {
  lessonIdx: number;
  status: LessonStatus;
  notes?: string;
  updatedAt?: string;
}

export interface BookProgress {
  bookSlug: string;
  total: number;
  mastered: number;
  read: number;
  started: number;
  lessons: LessonProgress[];
}

export interface ProgressResponse {
  streak: number;
  overall: { total: number; mastered: number; read: number; progress: number };
  books: Array<{
    bookSlug: string;
    total: number;
    mastered: number;
    read: number;
    started: number;
  }>;
}

export function useBookProgress(bookSlug?: string) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [data, setData] = useState<BookProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = bookSlug
        ? `/api/books/${bookSlug}/progress?userId=${USER_ID}`
        : `/api/books/progress?userId=${USER_ID}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      if (bookSlug) setData(json);
      else setProgress(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar progresso');
    } finally {
      setLoading(false);
    }
  }, [bookSlug]);

  async function markLesson(bookSlug: string, lessonIdx: number, status: LessonStatus) {
    try {
      const res = await fetch('/api/books/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, bookSlug, lessonIdx, status }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  }

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { progress, data, loading, error, refetch: fetchProgress, markLesson };
}

export function getBookProgressBySlug(progress: ProgressResponse | null, slug: string) {
  if (!progress) return null;
  return progress.books.find((b) => b.bookSlug === slug) ?? null;
}
