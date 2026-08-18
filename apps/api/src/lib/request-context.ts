/**
 * AsyncLocalStorage para correlation IDs.
 *
 * Propaga context (reqId, userId, etc.) entre async boundaries
 * sem precisar passar manualmente por cada funcao.
 *
 * Uso:
 *   await runWith({ reqId: 'abc-123' }, async () => {
 *     getContext().reqId; // 'abc-123'
 *   });
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  reqId: string;
  url?: string;
  method?: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWith<T>(context: RequestContext, fn: () => Promise<T> | T): Promise<T> | T {
  return storage.run(context, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

export function getOrCreateContext(fallback = 'unknown'): RequestContext {
  return storage.getStore() ?? { reqId: fallback };
}
