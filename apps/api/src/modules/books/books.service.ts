/**
 * Books service - CRUD de progresso de leitura.
 * Streak: dias consecutivos com atividade.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma.service';
import { LessonStatus } from '@prisma/client';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string, bookSlug: string) {
    const lessons = await this.prisma.bookProgress.findMany({
      where: { userId, bookSlug },
      orderBy: { lessonIdx: 'asc' },
    });
    return {
      bookSlug,
      total: lessons.length,
      mastered: lessons.filter((l) => l.status === 'MASTERED').length,
      read: lessons.filter((l) => l.status === 'READ').length,
      started: lessons.filter((l) => l.status === 'STARTED').length,
      lessons: lessons.map((l) => ({
        lessonIdx: l.lessonIdx,
        status: l.status,
        notes: l.notes,
        updatedAt: l.updatedAt,
      })),
    };
  }
  async getStreak(userId: string): Promise<number> {
    const allProgress = await this.prisma.bookProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (allProgress.length === 0) return 0;

    // Group by date (YYYY-MM-DD)
    const dateSet = new Set<string>();
    for (const p of allProgress) {
      const date = p.updatedAt.toISOString().slice(0, 10);
      dateSet.add(date);
    }

    // Count consecutive days from today
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if (dateSet.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async getAllProgress(userId: string) {
    const allProgress = await this.prisma.bookProgress.findMany({
      where: { userId },
      orderBy: [{ bookSlug: 'asc' }, { lessonIdx: 'asc' }],
    });

    const streak = await this.getStreak(userId);

    // Group by bookSlug
    const byBook = new Map<string, typeof allProgress>();
    for (const p of allProgress) {
      const list = byBook.get(p.bookSlug) ?? [];
      list.push(p);
      byBook.set(p.bookSlug, list);
    }

    const books = Array.from(byBook.entries()).map(([slug, lessons]) => ({
      bookSlug: slug,
      total: lessons.length,
      mastered: lessons.filter((l) => l.status === 'MASTERED').length,
      read: lessons.filter((l) => l.status === 'READ').length,
      started: lessons.filter((l) => l.status === 'STARTED').length,
    }));

    const totalLessons = allProgress.length;
    const totalMastered = allProgress.filter((l) => l.status === 'MASTERED').length;
    const totalRead = allProgress.filter((l) => l.status === 'READ').length;

    return {
      streak,
      overall: {
        total: totalLessons,
        mastered: totalMastered,
        read: totalRead,
        progress: totalLessons > 0 ? Math.round((totalRead / totalLessons) * 100) : 0,
      },
      books,
    };
  }

  async updateLessonStatus(
    userId: string,
    bookSlug: string,
    lessonIdx: number,
    status: LessonStatus,
    notes?: string,
  ) {
    const result = await this.prisma.bookProgress.upsert({
      where: {
        userId_bookSlug_lessonIdx: { userId, bookSlug, lessonIdx },
      },
      update: { status, notes, updatedAt: new Date() },
      create: {
        userId,
        bookSlug,
        lessonIdx,
        status,
        notes,
      },
    });

    this.logger.log(`Progress ${bookSlug}/${lessonIdx} → ${status} for ${userId}`);
    return result;
  }
}
