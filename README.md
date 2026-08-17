# Kapimind — Mente do seu Capital

Plataforma pessoal de investimentos com IA. Roadmap educacional, alertas 24/7, calculadoras, simulador, IR automático, VaR/CVaR, Monte Carlo, Suitability CVM 30, sentiment analysis.

**Tagline:** "Kapimind — a mente do seu capital."

## 🎯 Origem do Nome

`kapimind` = **kapi** (do Alemão/Sueco para "capital") + **mind** (inteligência, IA). Lê-se como "mente do capital". Ancoragem 100% em IA + Investimentos. Domínio `.com`, `.com.br`, npm package, GitHub org — todos livres (ago/2026).

## 🏗️ Stack

- **Frontend**: Next.js 15 (App Router, RSC) + TypeScript strict + Tailwind + shadcn + lucide-react
- **Backend**: NestJS 10 (Fastify adapter) + Prisma 6 + Zod + BullMQ + Telegraf + Anthropic SDK
- **DB**: PostgreSQL 17 (Neon em prod, Docker local em dev) com **PgBouncer** para connection pooling
- **Cache/Queue**: Upstash Redis (prod) / Redis local (dev)
- **Observability**: **Sentry** (errors + traces) + **Pino** structured logging + **OpenTelemetry** distributed tracing
- **Auth**: NextAuth (Credentials provider para single-user)
- **Hosting**: Vercel (web) + Railway (api)

## 📦 Estrutura

```
kapimind/
├── apps/
│   ├── web/         # Next.js 15 (frontend + Route Handlers + API proxies)
│   └── api/         # NestJS 10 (backend + workers + webhook)
├── packages/
│   └── shared/      # tipos compartilhados
├── legacy/          # arquivos HTML/JS antigos (referência)
├── docker-compose.yml  # Postgres + PgBouncer + Redis
└── DEPLOY.md       # guia de deploy Vercel + Railway
```

## � Setup Local

### 1. Pré-requisitos
- Node.js 20+
- pnpm 10+
- Docker (Postgres + PgBouncer + Redis)

### 2. Subir serviços
```bash
docker compose up -d
```

### 3. Configurar env
```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### 4. Instalar deps
```bash
pnpm install
```

### 5. Prisma setup
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 6. Dev (paralelo)
```bash
pnpm dev
```

Acessos:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **PgBouncer**: postgresql://localhost:6432 (em dev — use este em prod também)
- **Login dev**: `lucas@local` / `local`

## 🎨 Páginas Implementadas (todas com 200)

| Rota | O que faz |
|---|---|
| `/` | Marketing landing page |
| `/login` | Auth NextAuth (Credentials) |
| `/dashboard` | KPIs + tabela de holdings |
| `/portfolio` | CRUD de ativos |
| `/portfolio/strategy` | Backtest Permanent Portfolio |
| `/simulator` | Simulador multi-fase |
| `/simulator/montecarlo` | Monte Carlo GBM + fan chart |
| `/calculators` | 3 calculadoras didáticas |
| `/calculators/robos` | Comparativo Warren/Vérios/Magnetis + calculadora |
| `/explorer` | Listagem de FIIs |
| `/alerts` | Configuração TradingView + Telegram |
| `/roadmap` | 7 livros do plano educacional |
| `/roadmap/[slug]` | Detalhes do livro + progresso |
| `/f-score` | Piotroski F-Score por ticker |
| `/risk/var` | VaR/CVaR com método histórico |
| `/onboarding/suitability` | Questionário CVM 30 |
| `/sentiment` | Análise de sentimento PT-BR |
| `/ir-helper` | Lista de anos |
| `/ir-helper/[year]` | Resumo fiscal anual |

## 🔌 API Routes (todas validadas)

| Método | Rota | Função |
|---|---|---|
| GET | `/api/health` | Status completo (DB, Redis, Telegram) |
| GET | `/api/strategy` | Lista strategies |
| POST | `/api/strategy/[id]/backtest` | Roda backtest |
| GET | `/api/f-score/[ticker]` | F-Score |
| GET | `/api/risk/var` | VaR/CVaR |
| GET | `/api/simulator/montecarlo` | GBM + fan chart |
| POST | `/api/sentiment` | Score de sentimento |
| GET | `/api/portfolio/[id]/summary` | P&L agregado |
| GET | `/api/portfolio/[id]/holdings` | Lista holdings |
| GET | `/api/ir/[year]` | Resumo fiscal |
| GET | `/api/books/[slug]/progress` | Streak + progresso |

## �️ Fases Implementadas (8 sprints + 4 quick wins + 6 long-term)

### Fases originais
- [x] **Fase 1**: Bootstrap monorepo + auth
- [x] **Fase 2**: Migração das 3 páginas HTML legadas
- [x] **Fase 3**: Persistência de portfólio (Prisma + CRUD)
- [x] **Fase 4**: Stack Alertas (TradingView + BullMQ + Telegram + IA)
- [x] **Fase 5**: Roadmap Educacional (7 livros)
- [x] **Fase 6**: Auxiliar IR + export CSV
- [x] **Fase 7**: UX polish + calculadoras
- [x] **Fase 8**: Hardening (Sentry + health checks + graceful shutdown)

### Quick wins (Fase 9 polish)
- [x] **Sonner toast** (substitui toast customizado)
- [x] **Helmet + CSP** (security headers via código nativo)
- [x] **Focus visible global** (WCAG 2.4.7 AA)
- [x] **CVD-safe components** (ícones + texto em ganho/perda)

### Long-term features
- [x] **Cmd+K Command menu** (shadcn cmdk)
- [x] **Piotroski F-Score** (9 critérios, 0-9 score, banda)
- [x] **VaR/CVaR** (método histórico, 95/99%)
- [x] **Monte Carlo** (GBM puro, fan chart p5-p95)
- [x] **Suitability CVM 30** (questionário 4-pilares + SuitabilityGate)
- [x] **Sentiment FinBERT-PT-BR** (lib lexical pronta para HF Inference)
- [x] **PgBouncer + Prisma tuning** (índices + connection pooling)
- [x] **Pino logger + OpenTelemetry** (structured logs + traces)

## 🔐 Variáveis de Ambiente

### Obrigatórias
- `DATABASE_URL` — Postgres connection string (use `:6432` para PgBouncer em prod)
- `DIRECT_URL` — Postgres direct (Railway/Neon)
- `NEXTAUTH_SECRET` — min 32 chars
- `NEXTAUTH_URL` — http://localhost:3000 em dev
- `REDIS_URL` — Redis connection
- `BRAPI_API_KEY` — chave de brapi.dev (já está hardcoded de fallback)
- `TV_WEBHOOK_SECRET` — segredo HMAC para TradingView

### Opcionais
- `ANTHROPIC_API_KEY` — sem ela, sugestões caem em REVIEW fallback
- `TELEGRAM_BOT_TOKEN` — sem ele, bot desabilitado
- `TELEGRAM_CHAT_ID` — chat do usuário
- `SENTRY_DSN` — sem ela, telemetria desabilitada
- `LOG_LEVEL` — debug (dev) / info (prod)
- `APP_VERSION` — release tag do Sentry

## 🧪 Testes

```bash
# Todos (web + api)
pnpm -r test

# Apenas web
pnpm --filter web test

# Apenas api (vitest)
cd apps/api && npx vitest run

# Typecheck
pnpm -r typecheck
```

**Cobertura**: **50+ testes vitest** passando em 10 specs:
- `simulator.spec.ts` — 13 tests
- `calculators.spec.ts` — 7 tests
- `brapi.spec.ts` — 5 tests
- `permanent-portfolio.spec.ts` — 14 tests
- `piotroski.spec.ts` — 6 tests
- `var.spec.ts` — 12 tests
- `montecarlo.spec.ts` — 12 tests
- `suitability.spec.ts` — 10 tests
- `sentiment.spec.ts` — 10 tests
- `robo-advisors.spec.ts` — 4 tests
- `components.spec.tsx` — 7 tests

## 🔒 Segurança & Operacional

- **HMAC SHA256** em webhook TradingView (timing-safe)
- **Throttler** global: 10 req/s, 100 req/min
- **CORS** via Next.js middleware (CSP, X-Frame-Options, HSTS em prod)
- **PgBouncer** em modo transaction pool (max 100 conn, default pool 20)
- **Pino logger** com redact de headers sensíveis e correlation IDs
- **OpenTelemetry tracing** com Sentry exporter (no-op sem SENTRY_DSN)
- **API key brapi** apenas no servidor (não vaza para o cliente)
- **Sentry** captura 500s (não enche espaço com 4xx)
- **single-user mode** via NextAuth credentials provider
- **graceful shutdown** (SIGTERM/SIGINT) com flush de Sentry + tracing

## 🚀 Deploy

Ver `DEPLOY.md` para detalhes completos. Resumo:

### Frontend (Vercel)
- Conectar repo, framework Next.js
- Adicionar env vars
- Build: `pnpm build --filter web`
- Output: `.next/`

### Backend (Railway)
- Worker no mesmo projeto
- Postgres add-on (Neon)
- Redis add-on (Upstash)
- Health check: `/health/ready`
- DATABASE_URL aponta para `pgbouncer:6432` (connection pooling)

### Comandos úteis
```bash
# Validar tudo local
pnpm -r typecheck
pnpm -r test
curl http://localhost:3000/api/health
curl http://localhost:3000/api/risk/var
```

## 📝 Notas

- Webhook `claude-haiku-4-5-20251001` é o modelo mais barato e rápido da Anthropic. Para testes, deixe `ANTHROPIC_API_KEY` vazio — o sistema cai em REVIEW fallback.
- Brapi.co tem rate limit. Worker brapi-sync roda a cada 15min para todos os holdings.
- BullMQ queues são fire-and-forget; erros são logados via Pino e capturados pelo Sentry.
- Frontend usa fallback mock se backend cair (graceful degradation).
- Em prod, sempre use PgBouncer (porta 6432) entre app e Postgres para evitar connection storm.
- OpenTelemetry tracing funciona sem Sentry configurado (no-op). Para tracing completo, configure `SENTRY_DSN` e a feature "Tracing" no Sentry.

## 📜 Licença

MIT — código aberto. Use à vontade.

## 🤝 Contribuições

Single-user (Lucas). Roadmap pessoal.
