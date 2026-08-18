/**
 * Brapi health check — valida conexão real com a API brapi.dev.
 *
 * No MVP, este helper valida:
 * - API key presente (env var BRAPI_API_KEY)
 * - Endpoint `/api/available` ou similar responde 200
 * - Retorna estrutura esperada
 *
 * Para rodar: `tsx scripts/check-brapi.ts` (com backend rodando)
 * ou `npx vitest run src/lib/brapi-health.spec.ts`
 */

import { BrapiService } from './brapi.service';

export interface BrapiHealthResult {
  ok: boolean;
  reason?: string;
  apiKeyPresent: boolean;
  endpointReachable: boolean;
  latencyMs?: number;
}

export async function checkBrapiHealth(
  apiKey: string = process.env.BRAPI_API_KEY ?? '',
): Promise<BrapiHealthResult> {
  if (!apiKey) {
    return {
      ok: false,
      reason: 'BRAPI_API_KEY nao configurada',
      apiKeyPresent: false,
      endpointReachable: false,
    };
  }

  const start = Date.now();
  try {
    const svc = new BrapiService({ get: () => apiKey } as never);
    const quote = await svc.quote('PETR4');
    const latencyMs = Date.now() - start;
    if (quote && quote.symbol) {
      return {
        ok: true,
        apiKeyPresent: true,
        endpointReachable: true,
        latencyMs,
      };
    }
    return {
      ok: false,
      reason: 'Resposta sem symbol',
      apiKeyPresent: true,
      endpointReachable: false,
      latencyMs,
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'unknown',
      apiKeyPresent: true,
      endpointReachable: false,
      latencyMs: Date.now() - start,
    };
  }
}
