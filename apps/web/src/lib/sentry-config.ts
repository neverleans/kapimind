/**
 * Configuracao Sentry consolidada para Kapimind.
 * Documenta os tracesSampleRate, profilesSampleRate, replaySampleRate.
 *
 * Valores:
 * - dev: 1.0 (tudo, performance barato)
 * - prod: 0.1-0.2 (10-20% sampling, suficiente para SLO)
 * - alerts: 5xx > 0.5/s ou p95 > 1s
 */

export const SENTRY_CONFIG = {
  web: {
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // 100% on errors
    replaysSessionSampleRate: 0.1, // 10% sessions
  },
  api: {
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  },
  // SLOs
  slos: {
    apiAvailability: '99.9%', // ~43min downtime/mês
    p95Latency: '< 800ms',
    errorRate: '< 0.5% 5xx',
  },
};

/**
 * Helper para checar se Sentry esta ativo.
 */
export function isSentryEnabled(): boolean {
  return !!process.env.SENTRY_DSN;
}
