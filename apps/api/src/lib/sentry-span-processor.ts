/**
 * SentrySpanProcessor - adapter OpenTelemetry → Sentry.
 *
 * Implementacao simplificada que delega ao SDK do Sentry.
 * Em producao, use @sentry/opentelemetry-node.
 *
 * No MVP, retorna um processor vazio (no-op) — tracing funciona sem ele.
 */

import { type SpanProcessor, type ReadableSpan } from '@opentelemetry/sdk-trace-base';

export class SentrySpanProcessor implements SpanProcessor {
  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
  onStart(): void {
    // no-op
  }
  onEnd(_span: ReadableSpan): void {
    // TODO: encaminhar span para Sentry quando configurado
  }
  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
