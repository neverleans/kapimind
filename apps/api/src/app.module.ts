import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './modules/health/health.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AiModule } from './modules/ai/ai.module';
import { MarketDataModule } from './modules/market-data/market-data.module';
import { BooksModule } from './modules/books/books.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { MacroModule } from './modules/macro/macro.module';
import { IrModule } from './modules/ir/ir.module';
import { AdminModule } from './admin/admin.module';
import { PrismaService } from './lib/prisma.service';
import { RedisService } from './lib/redis.service';
import { TelegramService } from './lib/telegram.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'long', ttl: 60_000, limit: 100 },
    ]),
    HealthModule,
    PortfolioModule,
    AlertsModule,
    AiModule,
    MarketDataModule,
    BooksModule,
    TelegramModule,
    MacroModule,
    IrModule,
    AdminModule,
  ],
  providers: [PrismaService, RedisService, TelegramService],
  exports: [PrismaService, RedisService, TelegramService],
})
export class AppModule {}
