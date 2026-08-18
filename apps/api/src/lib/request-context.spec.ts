import { describe, it, expect } from 'vitest';
import { runWith, getContext, getOrCreateContext } from './request-context';

describe('request-context (AsyncLocalStorage)', () => {
  it('retorna undefined fora de runWith', () => {
    expect(getContext()).toBeUndefined();
  });

  it('propaga context dentro de runWith', () => {
    runWith({ reqId: 'abc-123' }, () => {
      expect(getContext()?.reqId).toBe('abc-123');
    });
  });

  it('propaga context em async/await', async () => {
    await runWith({ reqId: 'async-456' }, async () => {
      await Promise.resolve();
      expect(getContext()?.reqId).toBe('async-456');
    });
  });

  it('isola contexts entre calls paralelas', async () => {
    const [r1, r2] = await Promise.all([
      runWith({ reqId: 'A' }, async () => {
        await new Promise((res) => setTimeout(res, 5));
        return getContext()?.reqId;
      }),
      runWith({ reqId: 'B' }, async () => {
        await new Promise((res) => setTimeout(res, 5));
        return getContext()?.reqId;
      }),
    ]);
    expect(r1).toBe('A');
    expect(r2).toBe('B');
  });

  it('getOrCreateContext retorna fallback se nao houver', () => {
    expect(getOrCreateContext().reqId).toBe('unknown');
    expect(getOrCreateContext('custom').reqId).toBe('custom');
  });

  it('limpa context depois de runWith', () => {
    runWith({ reqId: 'tmp' }, () => {
      /* nada */
    });
    expect(getContext()).toBeUndefined();
  });
});
