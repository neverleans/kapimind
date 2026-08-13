import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let mockConfig: { get: (k: string) => string | undefined };

  beforeEach(() => {
    mockConfig = {
      get: (k: string) => {
        const map: Record<string, string> = {
          WHATSAPP_TOKEN: 'test-token',
          WHATSAPP_PHONE_ID: 'test-phone-id',
          WHATSAPP_TEMPLATE_NAME: 'suggestion_v1',
          WHATSAPP_VERIFY_TOKEN: 'test_token',
        };
        return map[k];
      },
    };
    service = new WhatsAppService(mockConfig as never);
  });

  it('isEnabled when token + phoneId present', () => {
    expect(service.isEnabled()).toBe(true);
  });

  it('isEnabled false when token missing', () => {
    const s = new WhatsAppService({ get: () => undefined } as never);
    expect(s.isEnabled()).toBe(false);
  });

  it('sendTemplate returns mock-disabled when not enabled', async () => {
    const s = new WhatsAppService({ get: () => undefined } as never);
    const result = await s.sendTemplate('5511999998888', 'x', [{ type: 'text', text: 'hi' }]);
    expect(result.status).toBe('failed');
    expect(result.messageId).toBe('mock-disabled');
  });

  it('sendTemplate posts to Facebook Graph API', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.123' }] }),
    });
    global.fetch = mockFetch as never;

    const result = await service.sendTemplate(
      '5511999998888',
      'suggestion_v1',
      [
        { type: 'text', text: 'MXRF11' },
        { type: 'text', text: 'HGLG11' },
      ],
      [
        { title: 'Sim, rebalancear', payload: 'SIM_REBALANCE:1' },
        { title: 'Agora nao', payload: 'NAO:1' },
      ],
    );

    expect(result.status).toBe('sent');
    expect(result.messageId).toBe('wamid.123');
    expect(mockFetch).toHaveBeenCalledOnce();

    // Verificar URL
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');

    const body = JSON.parse(init.body as string);
    expect(body.to).toBe('5511999998888');
    expect(body.type).toBe('template');
    expect(body.template.name).toBe('suggestion_v1');
    expect(body.template.components).toBeDefined();
  });

  it('sendTemplate handles API error', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    });
    global.fetch = mockFetch as never;

    const result = await service.sendTemplate('5511999998888', 'x', [{ type: 'text', text: 'hi' }]);
    expect(result.status).toBe('failed');
    expect(result.error).toContain('400');
  });

  it('verifyWebhook returns challenge on correct token', () => {
    const result = service.verifyWebhook('subscribe', 'test_token', 'CHALLENGE_123');
    expect(result).toBe('CHALLENGE_123');
  });

  it('verifyWebhook returns null on wrong token', () => {
    const result = service.verifyWebhook('subscribe', 'wrong_token', 'CHALLENGE_123');
    expect(result).toBeNull();
  });
});
