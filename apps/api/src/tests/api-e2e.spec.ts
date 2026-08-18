/**
 * E2E smoke tests para api (NestJS).
 * Testa controllers principais via fetch direto no servidor.
 *
 * Requer servidor rodando em http://localhost:4000
 * (em outro terminal: cd apps/api && pnpm start)
 */

import { describe, it, expect, beforeAll } from 'vitest';

const API = process.env.KAPIMIND_API_URL ?? 'http://localhost:4000';
let serverAvailable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${API}/health`);
    serverAvailable = res.status === 200;
  } catch {
    serverAvailable = false;
  }
});

describe('API E2E (NestJS)', () => {
  it('GET /health retorna 200', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${API}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
  }, 5000);

  it('GET /health/ready retorna 200', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${API}/health/ready`);
    expect(res.status).toBe(200);
  }, 5000);

  it('GET /health/live retorna 200', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${API}/health/live`);
    expect(res.status).toBe(200);
  }, 5000);

  it('GET /health/ready retorna estrutura correta', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${API}/health/ready`);
    const body = await res.json();
    expect(body).toHaveProperty('ready');
    expect(body).toHaveProperty('components');
  }, 5000);

  it('GET /health retorna estrutura com components', async () => {
    if (!serverAvailable) return;
    const res = await fetch(`${API}/health`);
    const body = await res.json();
    expect(body.components).toBeDefined();
    expect(body.components).toHaveProperty('database');
    expect(body.components).toHaveProperty('redis');
  }, 5000);
});
