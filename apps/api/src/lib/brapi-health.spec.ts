import { describe, it, expect } from 'vitest';
import { checkBrapiHealth } from './brapi-health';

describe('brapi-health', () => {
  it('retorna erro quando BRAPI_API_KEY vazia', async () => {
    const result = await checkBrapiHealth('');
    expect(result.ok).toBe(false);
    expect(result.apiKeyPresent).toBe(false);
    expect(result.reason).toContain('BRAPI_API_KEY');
  });

  it('retorna shape correto mesmo com falha', async () => {
    const result = await checkBrapiHealth('invalid-key-test-12345');
    expect(result).toHaveProperty('ok');
    expect(result).toHaveProperty('apiKeyPresent');
    expect(result).toHaveProperty('endpointReachable');
    // apiKeyPresent deve ser true (passamos uma chave)
    expect(result.apiKeyPresent).toBe(true);
  });

  it('retorna latência mesmo em falha', async () => {
    const result = await checkBrapiHealth('fake-key-12345');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
