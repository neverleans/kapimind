/**
 * Logger Pino + OpenTelemetry para NestJS.
 * Substitui logger default por pino (10x mais rapido, structured JSON).
 *
 * Auto-gera correlation IDs via header `x-correlation-id` ou UUID por request.
 *
 * Referencia: https://getpino.io / https://github.com/iamolegga/nestjs-pino
 */

import { randomUUID } from 'crypto';
import { Logger as NestPinoLogger, Params as PinoParams } from 'nestjs-pino';
import type { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import { getContext } from './request-context';

/**
 * Logger Pino + OpenTelemetry para NestJS.
 * Substitui logger default por pino (10x mais rapido, structured JSON).
 *
 * Auto-gera correlation IDs via header `x-correlation-id` ou UUID por request.
 * Propaga context via AsyncLocalStorage (request-context.ts).
 *
 * Referencia: https://getpino.io / https://github.com/iamolegga/nestjs-pino
 */

export interface PinoConfig {
  level?: string;
  serviceName?: string;
  redactPaths?: string[];
}

export function buildPinoOptions(config: PinoConfig = {}): PinoParams {
  const {
    level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    serviceName = 'kapimind-api',
    redactPaths = ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
  } = config;

  return {
    pinoHttp: {
      level,
      transport:
        process.env.NODE_ENV === 'production'
          ? undefined
          : { target: 'pino-pretty', options: { singleLine: false, translateTime: 'SYS:HH:MM:ss' } },
      customProps: () => ({ service: serviceName, env: process.env.NODE_ENV ?? 'development' }),
      // correlation ID por request
      genReqId: (req: any, res: any) => {
        const headerId =
          (req.headers?.['x-correlation-id'] || req.headers?.['x-request-id']) as
            | string
            | undefined;
        const id = headerId ?? Math.random().toString(36).slice(2);
        if (res?.setHeader) res.setHeader('x-correlation-id', id);
        return id;
      },
      customLogLevel: (_req: any, res: any, err?: Error) => {
        if (err || res?.statusCode >= 500) return 'error';
        if (res?.statusCode >= 400) return 'warn';
        return 'info';
      },
      // Injeta contexto do AsyncLocalStorage
      mixin: () => {
        const ctx = getContext();
        return ctx ? { reqId: ctx.reqId, userId: ctx.userId } : {};
      },
      serializers: {
        req: (req: any) => ({
          method: req.method,
          url: req.url,
          remoteAddress: req.socket?.remoteAddress,
        }),
        res: (res: any) => ({
          statusCode: res.statusCode,
        }),
        err: (err: Error) => ({
          type: err.name,
          message: err.message,
          stack: err.stack,
        }),
      },
      redact: {
        paths: redactPaths,
        censor: '[REDACTED]',
      },
    },
  };
}

/**
 * Logger middleware para injetar context (request id).
 */
export function getRequestContext(host: ArgumentsHost): {
  reqId: string;
  url: string;
  method: string;
} {
  const http = host.switchToHttp();
  const req = http.getRequest<any>();
  return {
    reqId: (req.headers?.['x-correlation-id'] as string) ?? Math.random().toString(36).slice(2),
    url: req.url ?? '',
    method: req.method ?? 'GET',
  };
}

/**
 * Logger global para NestJS.
 */
export const kapimindPinoLogger = NestPinoLogger;
