# Kapimind — Mente do seu Capital

Plataforma pessoal de investimentos com IA. Roadmap educacional, alertas 24/7, calculadoras, simulador, IR automático. Atualmente single-user (Lucas); projetada para escalar multi-tenant no futuro.

**Tagline:** "Kapimind — a mente do seu capital."

## 🎯 Origem do Nome

`kapimind` = **kapi** (do Alemão/Sueco para "capital") + **mind** (inteligência, IA). Lê-se como "mente do capital". Ancoragem 100% em IA + Investimentos. Domínio `.com`, `.com.br`, npm package, GitHub org — todos livres (ago/2026).

## 🏗️ Stack

- **Frontend**: Next.js 15 (App Router, RSC) + TypeScript strict + Tailwind + shadcn + lucide-react
- **Backend**: NestJS 10 (Fastify adapter) + Prisma 6 + Zod + BullMQ + Telegraf + Anthropic SDK
- **DB**: PostgreSQL 17 (Neon em prod, Docker local em dev)
- **Cache/Queue**: Upstash Redis (prod) / Redis local (dev)
- **Observability**: Sentry (errors + traces)
- **Auth**: NextAuth (Credentials provider para single-user)
- **Hosting**: Vercel (web) + Railway (api)

## 📦 Estrutura

```
INVESTIMENTOS/
├── apps/
│   ├── web/         # Next.js 15 (frontend + Route Handlers)
│   └── api/         # NestJS 10 (backend + workers + webhook)
├── packages/
│   └── shared/      # tipos compartilhados
├── legacy/          # arquivos HTML/JS antigos (referência)
└── docker-compose.yml
```

## 🚀 Setup Local

### 1. Pré-requisitos
- Node.js 20+
- pnpm 10+
- Docker (Postgres + Redis)

### 2. Subir Postgres + Redis
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
- **Login dev**: `lucas@local` / `local`

## 🛣️ Roadmap de Fases

- [x] **Fase 1**: Bootstrap monorepo + auth
- [x] **Fase 2**: Migração das 3 páginas HTML legadas
- [x] **Fase 3**: Persistência de portfólio (Prisma + CRUD)
- [x] **Fase 4**: Stack Alertas (TradingView + BullMQ + Telegram + IA)
- [x] **Fase 5**: Roadmap Educacional (7 livros)
- [x] **Fase 6**: Auxiliar IR + export CSV
- [x] **Fase 7**: UX polish + calculadoras
- [x] **Fase 8**: Hardening (Sentry + health checks + graceful shutdown)
- [ ] **Tarefa 15**: Deploy (Vercel + Railway + Neon + Upstash + CI)

Plano de arquitetura completo em `C:\Users\Lucas\.claude\plans\magical-jingling-garden.md`.

## 🔐 Variáveis de Ambiente

### Obrigatórias
- `DATABASE_URL` — Postgres connection string
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
- `APP_VERSION` — release tag do Sentry

## 🧪 Testes

```bash
# Todos (web + api)
pnpm -r test

# Apenas web
pnpm --filter web test

# Typecheck
pnpm -r typecheck
```

Builds cobertos (20 tests):
- `simulator.spec.ts` — 13 tests (cobre Fase 1/2, payback, snowball, formato)
- `calculators.spec.ts` — 7 tests (renda alvo, aporte extra, meta)

## 📚 Documentação das Funcionalidades

### 1. Dashboard (`/dashboard`)
- KPIs: património, investido, resultado
- Tabela de holdings (real, via API)
- Ações rápidas: simulador, roadmap

### 2. Portfólio (`/portfolio`)
- CRUD completo: adicionar, remover, atualizar
- Validação Zod (ticker, type, quantity, price)
- Summary automático (P&L, dividend yield)

### 3. Simulador (`/simulator`)
- 2 fases: Yield (mês 1-60) + Blindagem (mês 61+)
- 4 sliders: aporte, inflação, despesas, dividend growth
- Charts Recharts: line + donut
- Projeções: payback + bola de neve

### 4. Calculadoras (`/calculators`)
- Meta de aporte (com Shine pattern)
- Quanto preciso para renda X?
- Impacto de aporte extra

### 5. Roadmap (`/roadmap`)
- 7 livros do plano educacional
- Cada lição: conceito-chave + aplicação prática
- Progresso persistido (BookProgress table)
- Streak diário para consistência

### 6. Alertas (`/alerts`)
- Pipeline completo: TradingView webhook → BullMQ → Anthropic SDK → Telegraf
- HMAC validation
- Cron diário 03:00 BRT (rebalancer)
- Comandos do bot: `/start`, `/status`, `/pause`, `/resume`

### 7. Auxiliar IR (`/ir-helper/[year]`)
- Resumo anual: compras, vendas, dividendos, IR devido
- Meses com isenção de R$ 20k
- Modal para adicionar transação
- Export CSV

### 8. Admin (`/admin/*`)
- Visualização de alertas e recomendações
- Trigger manual do cron diário
- Snapshot do portfólio

## 🔒 Segurança

- **HMAC SHA256** em webhook TradingView (timing-safe)
- **Throttler** global: 10 req/s, 100 req/min
- **CORS** via Next.js headers
- **Security headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **API key brapi** apenas no servidor (não vaza para o cliente)
- **Sentry** captura apenas 500s (não enche espaço com 4xx)
- **single-user mode** via NextAuth credentials provider

## 🚀 Deploy

Ver `apps/api/src/main.ts` e `docker-compose.yml` para setup de produção.

### Frontend (Vercel)
- Conectar repo, framework Next.js
- Adicionar env vars (DATABASE_URL, NEXTAUTH_SECRET, etc)
- Build command: `pnpm build --filter web`
- Output: `.next/`

### Backend (Railway)
- Worker no mesmo projeto
- Postgres add-on (Neon)
- Redis add-on (Upstash)
- Env vars completas
- Health check: `/health/ready`

### Endpoints úteis
- `GET /health` — status completo (DB, Redis, Telegram)
- `GET /health/ready` — readiness probe (K8s/Railway)
- `GET /health/live` — liveness probe

## 📝 Notas

- Webhook `claude-haiku-4-5-20251001` é o modelo mais barato e rápido da Anthropic. Para testes, deixe `ANTHROPIC_API_KEY` vazio — o sistema cai em REVIEW fallback.
- Brapi.co tem rate limit. Worker brapi-sync roda a cada 15min para todos os holdings.
- BullMQ queues são fire-and-forget; erros são logados e capturados pelo Sentry.
- Frontend usa fallback mock se backend cair (graceful degradation).

## 📜 Licença

MIT — código aberto. Use à vontade.

## 🤝 Contribuições

Single-user (Lucas). Roadmap pessoal.
