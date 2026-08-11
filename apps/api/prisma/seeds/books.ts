/**
 * Loader do seed de livros.
 * Importa do JSON e valida shape basico.
 */

import seedData from './books.json';

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
  category: 'mentalidade' | 'valor' | 'valuation' | 'analise-tecnica' | 'macro';
  month: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  summary: string;
  lessons: BookLesson[];
  criticisms: string[];
}

const validated = (seedData as { books: Book[] }).books;

if (!validated || validated.length !== 7) {
  throw new Error(
    `Seed books.json deve ter 7 livros, encontrou ${validated?.length ?? 0}.`,
  );
}

export const books: Book[] = validated;
