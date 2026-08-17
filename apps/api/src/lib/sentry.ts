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
    // Cast necessário pois tipos do @sentry/node são estritos
    dsn: process.env.SENTRY_DSN as string,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.APP_VERSION ?? 'dev',
  } as Parameters<typeof Sentry.init>[0]);
  initialized = true;
}

export function flushSentry(timeout = 2000): Promise<boolean> {
  if (!initialized) return Promise.resolve(true);
  return Sentry.flush(timeout);
}
