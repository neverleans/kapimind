/**
 * Loader e tipos dos 7 livros do Roadmap Educacional.
 * Sincronizado com apps/api/prisma/seeds/books.json.
 */

import booksData from './books.json';

export type BookCategory = 'mentalidade' | 'valor' | 'valuation' | 'analise-tecnica' | 'macro';
export type BookColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple';

export interface BookLesson {
  title: string;
  key: string;
  application: string;
}

export interface Book {
  slug: string;
  title: string;
  author: string;
  year: number;
  category: BookCategory;
  month: number;
  color: BookColor;
  summary: string;
  lessons: BookLesson[];
  criticisms: string[];
}

export const BOOKS: Book[] = (booksData as { books: Book[] }).books;

export function getBook(slug: string): Book | undefined {
  return BOOKS.find((b) => b.slug === slug);
}

export const CATEGORY_LABELS: Record<BookCategory, string> = {
  mentalidade: 'Mentalidade',
  valor: 'Value Investing',
  valuation: 'Valuation',
  'analise-tecnica': 'Análise Técnica',
  macro: 'Macro & Mercado',
};

export const COLOR_CLASSES: Record<BookColor, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-brand-blue', text: 'text-brand-blue', border: 'border-brand-blue' },
  green: { bg: 'bg-brand-green', text: 'text-brand-green', border: 'border-brand-green' },
  yellow: { bg: 'bg-brand-yellow', text: 'text-brand-yellow', border: 'border-brand-yellow' },
  red: { bg: 'bg-brand-red', text: 'text-brand-red', border: 'border-brand-red' },
  purple: { bg: 'bg-brand-purple', text: 'text-brand-purple', border: 'border-brand-purple' },
};
