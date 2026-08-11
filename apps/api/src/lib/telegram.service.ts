/**
 * TelegramService - bot Telegraf.
 * Envia mensagens + comandos basicos (/start, /status, /pause, /resume).
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured; bot disabled');
      return;
    }

    this.bot = new Telegraf(token);

    this.bot.start((ctx) =>
      ctx.reply(
        'Investimentos Bot ativo!\n\n' +
          'Comandos:\n' +
          '/status — resumo do portfolio\n' +
          '/pause — parar alertas\n' +
          '/resume — retomar alertas\n\n' +
          'Acesse a plataforma: https://investimentos.lucas.app',
      ),
    );

    this.bot.command('status', (ctx) => ctx.reply('Status: ATIVO. Aguarde integração com portfolio na Fase 4.'));

    this.bot.command('pause', (ctx) => ctx.reply('Alertas pausados. Use /resume para retomar.'));

    this.bot.command('resume', (ctx) => ctx.reply('Alertas retomados.'));

    this.bot.launch().catch((err) => this.logger.error('Telegram launch failed:', err));
    this.logger.log('Telegram bot launched');
  }

  async onModuleDestroy() {
    if (this.bot) {
      await this.bot.stop();
      this.logger.log('Telegram bot stopped');
    }
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.bot) {
      this.logger.warn(`Telegram not initialized; would send to ${chatId}: ${message}`);
      return;
    }
    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (err) {
      this.logger.error(`Telegram send failed: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  isEnabled(): boolean {
    return this.bot !== null;
  }
}
