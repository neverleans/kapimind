/**
 * Sentry NestJS integration.
 * Optional - so inicializa se SENTRY_DSN estiver definido.
 */

import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (!process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.APP_VERSION ?? 'dev',
  });
  initialized = true;
}

export function flushSentry(timeout = 2000): Promise<boolean> {
  if (!initialized) return Promise.resolve(true);
  return Sentry.flush(timeout);
}
