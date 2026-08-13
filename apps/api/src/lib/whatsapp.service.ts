/**
 * WhatsAppService — client TypeScript para WhatsApp Cloud API (Meta).
 * Fetch puro (sem SDK). Endpoint: https://graph.facebook.com/v21.0
 *
 * Templates Utility precisam ser pré-aprovados via Meta Business Manager.
 * Quick Reply buttons no payload para SIM/NÃO.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TemplateComponent {
  type: 'body' | 'buttons' | 'header';
  parameters?: Array<{ type: string; text: string }>;
  buttons?: Array<{
    type: 'quick_reply' | 'url' | 'phone_number';
    title: string;
    payload?: string;
    url?: string;
  }>;
}

export interface WhatsAppSendResult {
  messageId: string;
  status: 'sent' | 'failed';
  error?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly baseUrl = 'https://graph.facebook.com/v21.0';
  private token: string | null = null;
  private phoneId: string | null = null;
  private templateName: string | null = null;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('WHATSAPP_TOKEN') ?? null;
    this.phoneId = this.config.get<string>('WHATSAPP_PHONE_ID') ?? null;
    this.templateName = this.config.get<string>('WHATSAPP_TEMPLATE_NAME') ?? 'suggestion_v1';
  }

  isEnabled(): boolean {
    return !!this.token && !!this.phoneId;
  }

  async sendTemplate(
    to: string,
    templateName: string,
    parameters: Array<{ type: string; text: string }>,
    quickReplyButtons?: Array<{ title: string; payload: string }>,
  ): Promise<WhatsAppSendResult> {
    if (!this.isEnabled()) {
      this.logger.warn(`WhatsApp not configured; would send to ${to}: template ${templateName}`);
      return { messageId: 'mock-disabled', status: 'failed', error: 'WhatsApp not configured' };
    }

    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'pt_BR' },
        components: [
          {
            type: 'body',
            parameters,
          },
          ...(quickReplyButtons && quickReplyButtons.length > 0
            ? [
                {
                  type: 'buttons',
                  buttons: quickReplyButtons.map((btn) => ({
                    type: 'quick_reply',
                    title: btn.title.slice(0, 20), // WhatsApp max 20 chars
                    payload: btn.payload,
                  })),
                },
              ]
            : []),
        ],
      },
    };

    try {
      const res = await fetch(
        `${this.baseUrl}/${this.phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`WhatsApp send failed: ${res.status} ${errText}`);
        return { messageId: '', status: 'failed', error: `${res.status} ${errText}` };
      }

      const data = (await res.json()) as { messages?: Array<{ id: string }> };
      const messageId = data.messages?.[0]?.id ?? 'unknown';
      this.logger.log(`WhatsApp message sent to ${to}: ${messageId}`);
      return { messageId, status: 'sent' };
    } catch (err) {
      this.logger.error('WhatsApp send exception:', err);
      return {
        messageId: '',
        status: 'failed',
        error: err instanceof Error ? err.message : 'unknown',
      };
    }
  }

  /**
   * Verificação de webhook (Meta challenge).
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const expectedToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN') ?? 'test_token';
    if (mode === 'subscribe' && token === expectedToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Helper: enviar sugestão de rebalanceamento.
   */
  async sendSuggestion(
    to: string,
    suggestion: {
      fromTicker: string;
      toTicker: string;
      score: number;
      reason: string;
      suggestionId: string;
    },
  ): Promise<WhatsAppSendResult> {
    return this.sendTemplate(
      to,
      this.templateName ?? 'suggestion_v1',
      [
        { type: 'text', text: suggestion.fromTicker },
        { type: 'text', text: suggestion.toTicker },
        { type: 'text', text: String(suggestion.score) },
        { type: 'text', text: suggestion.reason.slice(0, 200) },
      ],
      [
        { title: 'Sim, rebalancear', payload: `SIM_REBALANCE:${suggestion.suggestionId}` },
        { title: 'Agora nao', payload: `NAO:${suggestion.suggestionId}` },
        { title: 'Lembrar 7 dias', payload: `SNOOZE_7:${suggestion.suggestionId}` },
      ],
    );
  }
}
