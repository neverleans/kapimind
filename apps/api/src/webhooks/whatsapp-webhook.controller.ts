/**
 * Webhook controller para WhatsApp Cloud API.
 * Recebe incoming messages (Quick Reply responses) e delega para AlertsService.
 *
 * Meta webhook format:
 * {
 *   "object": "whatsapp_business_account",
 *   "entry": [{
 *     "changes": [{
 *       "value": {
 *         "messages": [{
 *           "from": "5511987654321",
 *           "type": "button",
 *           "button": { "text": "Sim, rebalancear", "payload": "SIM_REBALANCE:abc123" }
 *         }]
 *       }
 *     }]
 *   }]
 * }
 */

import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { WhatsAppService } from '@/lib/whatsapp.service';

interface WhatsAppWebhookPayload {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          type?: string;
          button?: { text?: string; payload?: string };
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
}

@Controller('webhook/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(private readonly whatsapp: WhatsAppService) {}

  // GET: verification challenge do Meta
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const result = this.whatsapp.verifyWebhook(mode, token, challenge);
    if (result) {
      return result;
    }
    this.logger.warn(`WhatsApp webhook verification failed: mode=${mode}`);
    return '0';
  }

  // POST: incoming messages
  @Post()
  async handleIncoming(@Body() payload: WhatsAppWebhookPayload): Promise<{ status: string }> {
    this.logger.log(`WhatsApp webhook received: ${payload?.object ?? 'unknown'}`);

    const messages = payload?.entry?.[0]?.changes?.[0]?.value?.messages ?? [];
    for (const msg of messages) {
      if (msg.type === 'button' && msg.button?.payload) {
        await this.handleButtonReply(msg.from ?? 'unknown', msg.button.payload, msg.button.text);
      } else if (msg.type === 'text' && msg.text?.body) {
        await this.handleTextMessage(msg.from ?? 'unknown', msg.text.body);
      }
    }

    // Meta exige 200 OK rápido
    return { status: 'ok' };
  }

  private async handleButtonReply(from: string, payload: string, text?: string) {
    this.logger.log(`Button reply from ${from}: ${payload} (${text ?? '?'})`);
    // Payload format: SIM_REBALANCE:{suggestionId} | NAO:{suggestionId} | SNOOZE_7:{suggestionId}
    const [action, suggestionId] = payload.split(':');
    if (!action || !suggestionId) return;

    // Em produção: persistir em DB (RespostaSugestao table)
    // Aqui só loga
    this.logger.log(`Adaptive suggestion ${suggestionId} → ${action} from ${from}`);
  }

  private async handleTextMessage(from: string, body: string) {
    this.logger.log(`Text message from ${from}: ${body}`);
  }
}
