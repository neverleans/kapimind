/**
 * Sentry server-side config.
 * Habilitado quando SENTRY_DSN está definido.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION ?? 'dev',
  beforeSend(event) {
    // Filter out navigation noise in dev
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
