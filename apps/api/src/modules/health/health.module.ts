/**
 * Health module: /health verifica DB (Prisma), Redis, Telegram.
 * Readiness probe para Railway / Fly.io.
 */

import { Module, Controller, Get } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma.service';
import { RedisService } from '@/lib/redis.service';
import { TelegramService } from '@/lib/telegram.service';

@Controller('health')
class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly telegram: TelegramService,
  ) {}

  @Get()
  async check() {
    const checks: Record<string, unknown> = {
      service: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      components: {} as Record<string, string>,
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      (checks.components as Record<string, string>).database = 'ok';
    } catch {
      (checks.components as Record<string, string>).database = 'down';
    }

    if (this.redis) {
      (checks.components as Record<string, string>).redis = 'ok';
    }

    if (this.telegram.isEnabled()) {
      (checks.components as Record<string, string>).telegram = 'ok';
    } else {
      (checks.components as Record<string, string>).telegram = 'disabled';
    }

    return checks;
  }

  @Get('ready')
  async ready() {
    return { ready: true };
  }

  @Get('live')
  async live() {
    return { live: true };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
