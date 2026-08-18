import { describe, it, expect, vi } from 'vitest';
import { isSentryEnabled } from './sentry-config';

describe('sentry-config', () => {
  it('isSentryEnabled false sem DSN', () => {
    vi.stubEnv('SENTRY_DSN', '');
    expect(isSentryEnabled()).toBe(false);
  });

  it('isSentryEnabled true com DSN', () => {
    vi.stubEnv('SENTRY_DSN', 'https://test@sentry.io/123');
    expect(isSentryEnabled()).toBe(true);
  });

  it('isSentryEnabled falsy com undefined', () => {
    vi.stubEnv('SENTRY_DSN', undefined);
    expect(isSentryEnabled()).toBe(false);
  });
});

// NOTA: tracesSampleRate / profilesSampleRate sao definidos em tempo de import
// baseado em process.env.NODE_ENV. Verificar manualmente ou com setup
// de env antes do import (config custom).
