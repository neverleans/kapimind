/**
 * Security headers para Kapimind.
 * Aplicado globalmente em todas as rotas via middleware.
 * Não usa @fastify/helmet (incompatível com pino) — feito à mão.
 *
 * Headers:
 * - X-Frame-Options: SAMEORIGIN (clickjacking)
 * - X-Content-Type-Options: nosniff (MIME sniffing)
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Permissions-Policy: desabilita camera, mic, geolocation (não usamos)
 * - X-XSS-Protection: 1; mode=block (legacy IE/Edge)
 * - Strict-Transport-Security: max-age=31536000; includeSubDomains (HTTPS only)
 * - Content-Security-Policy: restritiva mas funcional para Next.js
 * - Cross-Origin-Opener-Policy: same-origin
 * - Cross-Origin-Resource-Policy: same-origin
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP strict — permite:
 * - Scripts: self + inline (Next.js + React precisam)
 * - Styles: self + inline + unsafe-inline (Tailwind + shadcn precisam)
 * - Imagens: self + data: (placeholders) + blob:
 * - Fonts: self + data:
 * - Connect: self + API
 * - Frame: self (embeds)
 * - Workers: self
 * - Object: none
 * - Base-URI: self
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.brapi.dev https://brapi.dev https://graph.facebook.com https://api.telegram.org https://api.anthropic.com",
  "frame-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

export function securityHeadersMiddleware(req: NextRequest): NextResponse {
  const res = NextResponse.next();

  // Security
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  );
  res.headers.set('X-XSS-Protection', '1; mode=block');

  // HSTS — só em produção (HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
  }

  // CORS — restritivo para APIs internas; amplo para web
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // CSP — desabilitar em dev para evitar problemas com HMR
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Content-Security-Policy', CSP);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (metadata)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
};
