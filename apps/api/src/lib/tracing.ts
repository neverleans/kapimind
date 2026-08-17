/**
 * Tracing OpenTelemetry para NestJS.
 * Encaminha spans para Sentry via OTLP (OpenTelemetry Protocol).
 *
 * Quando SENTRY_DSN nao configurado, tracing e no-op (sem overhead).
 *
 * Referencia: https://docs.sentry.io/platforms/javascript/tracing/
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { SentrySpanProcessor } from './sentry-span-processor';

let sdkInstance: NodeSDK | null = null;

export function initTracing(serviceName = 'kapimind-api'): void {
  if (!process.env.SENTRY_DSN) {
    // tracing desativado quando Sentry nao configurado
    return;
  }
  if (sdkInstance) {
    return;
  }

  sdkInstance = new NodeSDK({
    serviceName,
    spanProcessor: new SentrySpanProcessor(),
  });

  sdkInstance.start();
  console.log(`[OpenTelemetry] tracing inicializado para ${serviceName}`);
}

export async function shutdownTracing(): Promise<void> {
  if (sdkInstance) {
    await sdkInstance.shutdown();
    sdkInstance = null;
  }
}
