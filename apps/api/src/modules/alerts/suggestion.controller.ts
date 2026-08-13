import { Body, Controller, Post } from '@nestjs/common';
import { WhatsAppService } from '@/lib/whatsapp.service';
import { PrismaService } from '@/lib/prisma.service';

interface SuggestionPayload {
  userId: string;
  ticker: string;
  chatId?: string;
}

@Controller('alerts')
export class SuggestionController {
  constructor(
    private readonly whatsapp: WhatsAppService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('suggestion')
  async sendSuggestion(@Body() body: SuggestionPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) return { ok: false, error: 'user_not_found' };

    const chatId = body.chatId ?? user.telegramChatId;
    if (!chatId) {
      return { ok: false, error: 'no_telegram_chat_id' };
    }

    const result = await this.whatsapp.sendSuggestion(chatId, {
      fromTicker: body.ticker,
      toTicker: 'HGLG11', // mock
      score: 32,
      reason: 'VGHF11 em seca de dividendos 3 meses; P/VP em 0,63 indica stress.',
      suggestionId: 'mock-' + Date.now(),
    });

    return { ok: result.status === 'sent', messageId: result.messageId };
  }
}
