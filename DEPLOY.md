# =============================================================================
# Plataforma de Investimentos — Guia de Deploy
# =============================================================================

Este guia leva você do zero até produção em ~30 minutos.

## 📋 Checklist Pré-Deploy

Antes de começar, crie contas em:
- [ ] **GitHub** (https://github.com) — para hospedar o código
- [ ] **Vercel** (https://vercel.com) — para hospedar o frontend Next.js
- [ ] **Railway** (https://railway.app) — para hospedar o backend NestJS + Postgres + Redis
- [ ] **Neon** (https://neon.tech) — opcional, alternativa Postgres
- [ ] **Upstash** (https://upstash.com) — opcional, Redis serverless
- [ ] **Sentry** (https://sentry.io) — opcional, telemetria
- [ ] **Anthropic** (https://console.anthropic.com) — opcional, IA
- [ ] **Telegram** (https://t.me/BotFather) — opcional, bot

---

## 1. 📦 Subir código para GitHub

```bash
cd INVESTIMENTOS
git add .
git commit -m "feat: MVP inicial"
git remote add origin https://github.com/seu-usuario/investimentos.git
git push -u origin main
```

---

## 2. 🚂 Railway (Backend + Postgres + Redis)

### 2.1 Criar projeto
1. Acesse https://railway.app/new
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório `investimentos`
4. Railway vai detectar monorepo

### 2.2 Configurar root directory
1. Clique no serviço criado
2. Settings → **Root Directory** = `apps/api`
3. **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter api prisma:generate && pnpm --filter api build`
4. **Start Command**: `cd ../.. && pnpm --filter api start`

### 2.3 Adicionar Postgres
1. No projeto, clique em **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway fornece `DATABASE_URL` automaticamente
3. Adicione `DIRECT_URL` manualmente (mesmo valor de `DATABASE_URL`)

### 2.4 Adicionar Redis
1. **"+ New"** → **"Database"** → **"Redis"**
2. Railway injeta `REDIS_URL` automaticamente

### 2.5 Environment Variables (manuais)
```
API_PORT                  = 4000
NODE_ENV                  = production
NEXTAUTH_SECRET           = <openssl rand -hex 32>
BRAPI_API_KEY             = sua_chave_brapi
TV_WEBHOOK_SECRET         = algum_secreto_forte
ANTHROPIC_API_KEY         = sk-ant-... (opcional)
ANTHROPIC_MODEL           = claude-haiku-4-5-20251001
TELEGRAM_BOT_TOKEN        = ... (opcional)
TELEGRAM_CHAT_ID          = ... (opcional)
SENTRY_DSN                = https://...@sentry.io/... (opcional)
APP_VERSION               = <git sha ou tag>
CORS_ALLOWED_ORIGINS      = https://seudominio.vercel.app
```

### 2.6 Health check
- Settings → **Health Check Path** = `/health/ready`
- Settings → **Health Check Timeout** = 30s

### 2.7 Domínio
- Settings → Networking → **Generate Domain** (ex: `api.investimentos.up.railway.app`)
- Anote esta URL para configurar no Vercel (próximo passo).

### 2.8 Migration do Prisma
Railway tem 3 opções:
- **Opção A** (manual): rode via Railway CLI:
  ```bash
  railway run "cd apps/api && npx prisma migrate deploy"
  ```
- **Opção B** (start command): edite o start command para:
  ```
  cd ../.. && pnpm --filter api prisma:migrate && pnpm --filter api start
  ```
  ⚠️ Pode falhar se migrations forem concurrent.
- **Opção C** (separação): crie um 2º serviço "migrate" que roda uma vez.

**Recomendação**: Opção A para controle manual.

---

## 3. ▲ Vercel (Frontend)

### 3.1 Importar projeto
1. Acesse https://vercel.com/new
2. Importe o repositório `investimentos` do GitHub
3. Vercel detecta Next.js automaticamente

### 3.2 Configurar
- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter web build`
- **Install Command**: `cd ../.. && pnpm install --frozen-lockfile`
- **Output Directory**: `.next` (default)

### 3.3 Environment Variables
```
DATABASE_URL              = (pegar do Railway)
DIRECT_URL                = (pegar do Railway)
NEXTAUTH_SECRET           = mesmo do Railway
NEXTAUTH_URL              = https://seudominio.vercel.app
NEXT_PUBLIC_API_URL       = https://api.investimentos.up.railway.app
APP_VERSION               = $GITHUB_SHA
```

### 3.4 Domínio
- Settings → Domains → **Add** (ex: `investimentos.lucas.app`)
- Anote o domínio final para configurar `NEXTAUTH_URL`.

### 3.5 Deploy
- Vercel auto-deploys em cada push para `main`.

---

## 4. 🤖 Telegram (Opcional)

### 4.1 Criar bot
1. Fale com [@BotFather](https://t.me/BotFather) no Telegram
2. `/newbot` → siga instruções
3. Copie o token para `TELEGRAM_BOT_TOKEN`

### 4.2 Configurar chat ID
1. Inicie conversa com seu bot
2. Acesse `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Copie `chat.id` para `TELEGRAM_CHAT_ID`

### 4.3 Conectar TradingView
- No TradingView, no alert, cole: `https://api.investimentos.up.railway.app/webhook/tv`
- Header: `TradingView-Signature: sha256=<HMAC_HEX_DO_BODY>`

---

## 5. 📊 Sentry (Opcional)

### 5.1 Frontend
1. Crie projeto Sentry para `investimentos-web`
2. Copie DSN
3. Adicione `SENTRY_DSN` no Vercel

### 5.2 Backend
1. Crie projeto Sentry para `investimentos-api`
2. Copie DSN
3. Adicione `SENTRY_DSN` no Railway

---

## 6. ✅ Verificação Pós-Deploy

### 6.1 Smoke tests
- `https://seudominio.vercel.app` → home page carrega
- `https://seudominio.vercel.app/login` → login funciona (`lucas@local` / `local`)
- `https://api.investimentos.up.railway.app/health` → `{ status: "ok", ... }`
- `https://api.investimentos.up.railway.app/health/ready` → `{ ready: true }`

### 6.2 Webhook de teste
```bash
curl -X POST https://api.investimentos.up.railway.app/webhook/tv \
  -H "Content-Type: application/json" \
  -H "TradingView-Signature: sha256=HMAC_HEX" \
  -d '{
    "ticker": "MXRF11",
    "action": "BUY",
    "price": 9.50,
    "strategy": "test",
    "interval": "1d"
  }'
```
Esperado: `202 Accepted`.

### 6.3 CORS
Se browser reclamar de CORS, adicione o domínio Vercel em `CORS_ALLOWED_ORIGINS` no Railway.

---

## 7. 💰 Custos Estimados

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Hobby | **Grátis** (até 100GB bandwidth) |
| Railway | Trial | **$5 crédito grátis/mês** |
| Railway Postgres | Hobby | ~$5/mês (256MB) |
| Railway Redis | Hobby | ~$3/mês (256MB) |
| Sentry | Developer | **Grátis** (5k events/mês) |
| Anthropic | Pay-as-you-go | ~$0.10/alerta |
| TradingView Pro | Mensal | ~R$ 90/mês |
| Brapi | Free tier | **Grátis** (50k req/mês) |
| Telegram Bot | - | **Grátis** |

**Total ~R$ 100-150/mês** se usar tudo.

---

## 8. 🐛 Troubleshooting

### "NEXTAUTH_URL mismatch"
Erro de CSRF. Verifique que `NEXTAUTH_URL` na Vercel bate com o domínio real.

### "Failed to connect to redis"
Verifique que `REDIS_URL` no Railway está acessível do serviço. Railway inject automaticamente.

### "Prisma migration failed"
- Rode `npx prisma migrate deploy` via Railway CLI
- Ou commite migrations novas e deixe o build command rodar

### "Timeout on brapi"
brapi.co pode estar fora. Worker brapi-sync loga warning e usa última cotação conhecida.

### "Telegram bot not responding"
Verifique que `TELEGRAM_BOT_TOKEN` está correto e bot foi `/start`-ado.

---

## 9. 🔄 Próximos Passos

Após deploy:
1. Configure domínio custom (ex: `investimentos.lucas.app` na Cloudflare)
2. Adicione Sentry nos 2 projetos (web + api)
3. Configure CI do GitHub Actions para rodar typecheck + test em PRs
4. Adicione monitoramento (UptimeRobot ou Better Stack)
5. Documente runbooks (como adicionar nova feature, deploy, rollback)
