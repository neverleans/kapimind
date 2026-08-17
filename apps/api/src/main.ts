import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { initSentry, flushSentry } from './lib/sentry';
import { AllExceptionsFilter } from './lib/all-exceptions.filter';
import { initTracing, shutdownTracing } from './lib/tracing';

async function bootstrap() {
  // Sentry + tracing devem subir antes de qualquer coisa
  initSentry();
  initTracing();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port, '0.0.0.0');

  Logger.log(`🚀 API running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`   Health: http://localhost:${port}/health`, 'Bootstrap');
  Logger.log(`   Ready: http://localhost:${port}/health/ready`, 'Bootstrap');

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    Logger.log(`Received ${signal}. Starting graceful shutdown...`, 'Bootstrap');
    await app.close();
    await flushSentry();
    await shutdownTracing();
    Logger.log('Shutdown complete. Bye!', 'Bootstrap');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  Logger.error('Bootstrap failed:', err.stack, 'Bootstrap');
  process.exit(1);
});
