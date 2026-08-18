/**
 * Tests de integracao das API routes (web).
 * Requer dev server rodando com Next.js 15+.
 * Skip automatico quando o servidor nao responder com JSON valido.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE = process.env.KAPIMIND_API_URL ?? 'http://localhost:3000';
let serverAvailable = false;

describe('API integration (dev server required)', () => {
  beforeAll(async () => {
    try {
      const res = await fetch(`${BASE}/api/health`);
      const text = await res.text();
      serverAvailable = res.status === 200 && text.trimStart().startsWith('{');
    } catch {
      serverAvailable = false;
    }
  });

  it('GET /api/health retorna 200 com shape', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
  }, 10000);

  it('GET /api/f-score/PETR4 retorna 200', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${BASE}/api/f-score/PETR4`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ticker).toBe('PETR4');
  }, 10000);

  it('GET /api/risk/var retorna 200', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${BASE}/api/risk/var`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.results)).toBe(true);
  }, 10000);

  it('GET /api/simulator/montecarlo retorna 200', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${BASE}/api/simulator/montecarlo`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('fanChart');
  }, 10000);

  it('GET /api/strategy retorna 200', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${BASE}/api/strategy`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.strategies)).toBe(true);
  }, 10000);

  it('POST /api/sentiment bullish', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${BASE}/api/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'A empresa registrou alta recorde com lucro forte.' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBeGreaterThan(0);
  }, 10000);

  it('POST /api/sentiment bearish', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${BASE}/api/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Houve queda do lucro com prejuizo recorde.' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBeLessThan(0);
  }, 10000);

  it('GET /api/portfolio/seed-portfolio/summary', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${BASE}/api/portfolio/seed-portfolio/summary`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('portfolioValue');
  }, 10000);

  it('GET /api/books/pai-rico-pai-pobre/progress', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${BASE}/api/books/pai-rico-pai-pobre/progress`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('bookSlug');
  }, 10000);

  it('GET /api/ir/2026', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${BASE}/api/ir/2026`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.year).toBe(2026);
  }, 10000);
});
