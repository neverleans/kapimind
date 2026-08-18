import { describe, it, expect } from 'vitest';
import { AnthropicService } from './anthropic.service';

describe('AnthropicService', () => {
  it('cria sem token (no-op)', () => {
    const svc = new AnthropicService({ get: () => undefined } as never);
    expect(svc).toBeDefined();
  });

  it('cria com token dummy', () => {
    const svc = new AnthropicService({
      get: (k: string) => (k === 'ANTHROPIC_API_KEY' ? 'test-key' : undefined),
    } as never);
    expect(svc).toBeDefined();
  });
});
