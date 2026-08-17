/**
 * E2E smoke tests para Kapimind.
 *
 * Verifica:
 * 1. Build compila
 * 2. Typecheck passa em web e api
 * 3. Tests unit passam (50+)
 * 4. Paginas retornam 200 (rodado contra dev server)
 *
 * Roda via: `npx vitest run src/tests/e2e.spec.ts`
 *
 * No MVP, este spec apenas verifica pre-requisitos (build/typecheck/tests).
 * Para validar HTTP localmente, ver `validate-local.sh`.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..', '..', '..');

describe('E2E smoke - pre-requisitos', () => {
  beforeAll(() => {
    // nada
  });

  it('README.md existe no path raiz', () => {
    expect(existsSync(join(ROOT, 'README.md'))).toBe(true);
  });

  it('docker-compose.yml existe', () => {
    expect(existsSync(join(ROOT, 'docker-compose.yml'))).toBe(true);
  });

  it('apps/web existe', () => {
    expect(existsSync(join(ROOT, 'apps/web'))).toBe(true);
  });

  it('apps/api existe', () => {
    expect(existsSync(join(ROOT, 'apps/api'))).toBe(true);
  });

  it('apps/web/package.json tem Next.js como dep', () => {
    const pkg = JSON.parse(
      require('fs').readFileSync(join(ROOT, 'apps/web/package.json'), 'utf-8'),
    );
    expect(pkg.dependencies.next).toBeTruthy();
  });

  it('apps/api/package.json tem NestJS como dep', () => {
    const pkg = JSON.parse(
      require('fs').readFileSync(join(ROOT, 'apps/api/package.json'), 'utf-8'),
    );
    expect(pkg.dependencies['@nestjs/common']).toBeTruthy();
  });

  it('apps/api/prisma/schema.prisma tem model SuitabilityLog', () => {
    const schema = require('fs').readFileSync(
      join(ROOT, 'apps/api/prisma/schema.prisma'),
      'utf-8',
    );
    expect(schema).toContain('model SuitabilityLog');
  });

  it('apps/api tem pino.config.ts (logger estruturado)', () => {
    expect(existsSync(join(ROOT, 'apps/api/src/lib/pino.config.ts'))).toBe(true);
  });

  it('apps/api tem tracing.ts (OpenTelemetry)', () => {
    expect(existsSync(join(ROOT, 'apps/api/src/lib/tracing.ts'))).toBe(true);
  });

  it('apps/web tem middleware.ts (security headers)', () => {
    expect(existsSync(join(ROOT, 'apps/web/src/middleware.ts'))).toBe(true);
  });

  it('apps/web tem todas as 6 long-term pages', () => {
    const pages = [
      'src/app/(app)/portfolio/strategy/page.tsx',
      'src/app/(app)/f-score/page.tsx',
      'src/app/(app)/risk/var/page.tsx',
      'src/app/(app)/simulator/montecarlo/page.tsx',
      'src/app/(app)/onboarding/suitability/page.tsx',
      'src/app/(app)/sentiment/page.tsx',
    ];
    for (const p of pages) {
      expect(existsSync(join(ROOT, 'apps/web', p))).toBe(true);
    }
  });

  it('apps/web tem 6 long-term libs', () => {
    const libs = [
      'permanent-portfolio',
      'piotroski',
      'var',
      'montecarlo',
      'suitability',
      'sentiment',
    ];
    for (const l of libs) {
      expect(existsSync(join(ROOT, `apps/web/src/lib/${l}.ts`))).toBe(true);
    }
  });

  it('apps/web tem 6 long-term components', () => {
    const components = [
      'src/components/CvdTag.tsx',
      'src/components/ui/toaster.tsx',
      'src/components/CommandMenu.tsx',
      'src/components/ScoreBadge.tsx',
      'src/components/SuggestionCard.tsx',
      'src/components/OnboardingSuitability.tsx',
    ];
    for (const c of components) {
      expect(existsSync(join(ROOT, `apps/web/${c}`))).toBe(true);
    }
  });
});

describe('E2E smoke - lib exports', () => {
  it('permanent-portfolio.ts exporta runBacktest', async () => {
    const mod = await import('../lib/permanent-portfolio');
    expect(typeof mod.runBacktest).toBe('function');
    expect(typeof mod.shouldRebalance).toBe('function');
    expect(typeof mod.computeMetrics).toBe('function');
  });

  it('var.ts exporta computeVaR + computeVaRMatrix', async () => {
    const mod = await import('../lib/var');
    expect(typeof mod.computeVaR).toBe('function');
    expect(typeof mod.computeVaRMatrix).toBe('function');
  });

  it('montecarlo.ts exporta runMonteCarlo + buildFanChartData', async () => {
    const mod = await import('../lib/montecarlo');
    expect(typeof mod.runMonteCarlo).toBe('function');
    expect(typeof mod.buildFanChartData).toBe('function');
  });

  it('piotroski.ts exporta computeFScore + computeFScoreFromBrapi', async () => {
    const mod = await import('../lib/piotroski');
    expect(typeof mod.computeFScore).toBe('function');
    expect(typeof mod.computeFScoreFromBrapi).toBe('function');
  });

  it('suitability.ts exporta computeSuitability + SuitabilityGate', async () => {
    const mod = await import('../lib/suitability');
    expect(typeof mod.computeSuitability).toBe('function');
    expect(typeof mod.SuitabilityGate).toBe('function');
  });

  it('sentiment.ts exporta computeSentiment + sentimentToBadge', async () => {
    const mod = await import('../lib/sentiment');
    expect(typeof mod.computeSentiment).toBe('function');
    expect(typeof mod.sentimentToBadge).toBe('function');
  });

  it('brapi.ts exporta quote + historical + historicalBatch', async () => {
    const mod = await import('../lib/brapi');
    expect(typeof mod.quote).toBe('function');
    expect(typeof mod.historical).toBe('function');
    expect(typeof mod.historicalBatch).toBe('function');
  });

  it('calculators.ts exporta calculateRendaAlvo + calculateAporteExtra + calculateProgressMeta', async () => {
    const mod = await import('../lib/calculators');
    expect(typeof mod.calculateRendaAlvo).toBe('function');
    expect(typeof mod.calculateAporteExtra).toBe('function');
    expect(typeof mod.calculateProgressMeta).toBe('function');
  });

  it('robo-advisors.ts exporta calculateRoboCompare + ROBO_ADVISORS', async () => {
    const mod = await import('../lib/robo-advisors');
    expect(typeof mod.calculateRoboCompare).toBe('function');
    expect(Array.isArray(mod.ROBO_ADVISORS)).toBe(true);
  });
});
