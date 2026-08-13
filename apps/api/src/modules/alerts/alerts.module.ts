/**
 * AlertasModule — webhook do TradingView + WhatsApp Cloud API.
 * No MVP, entregamos apenas o webhook do WhatsApp (TradingView já tem de Fase 4).
 */

import { Module } from '@nestjs/common';
import { WhatsAppService } from '@/lib/whatsapp.service';
import { WhatsAppWebhookController } from '@/webhooks/whatsapp-webhook.controller';
import { SuggestionController } from './suggestion.controller';
import { PrismaService } from '@/lib/prisma.service';

@Module({
  controllers: [WhatsAppWebhookController, SuggestionController],
  providers: [WhatsAppService, PrismaService],
  exports: [WhatsAppService],
})
export class AlertsModule {}
