/**
 * Books controller - CRUD de progresso de leitura.
 */

import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BooksService } from './books.service';
import { LessonStatus } from '@prisma/client';
import { z } from 'zod';

const UpdateLessonSchema = z.object({
  userId: z.string().min(1),
  bookSlug: z.string().min(1),
  lessonIdx: z.coerce.number().int().nonnegative(),
  status: z.nativeEnum(LessonStatus),
  notes: z.string().max(500).optional(),
});

@Controller('books')
export class BooksController {
  constructor(private readonly service: BooksService) {}

  @Get('progress')
  async getAllProgress(@Query('userId') userId: string) {
    return this.service.getAllProgress(userId);
  }

  @Get(':bookSlug/progress')
  async getBookProgress(
    @Param('bookSlug') bookSlug: string,
    @Query('userId') userId: string,
  ) {
    return this.service.getProgress(userId, bookSlug);
  }

  @Get('streak')
  async getStreak(@Query('userId') userId: string) {
    return { streak: await this.service.getStreak(userId) };
  }

  @Post('progress')
  async updateLesson(@Body() body: unknown) {
    const data = UpdateLessonSchema.parse(body);
    return this.service.updateLessonStatus(
      data.userId,
      data.bookSlug,
      data.lessonIdx,
      data.status,
      data.notes,
    );
  }
}
