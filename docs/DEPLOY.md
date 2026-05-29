# Deployment Guide

**Status:** Database provisioned on Neon. API verified working. Ready for hosting platform deployment.

---

## Quick Start: Neon + Render (Recommended)

### Prerequisites
- Neon database already provisioned (`damp-mouse-79328625`, 44 tables, seeded)
- GitHub repo: `organvm-iii-ergon/life-my--midst--in`

### Step 1: Deploy to Render

1. Go to https://render.com and sign in with GitHub
2. Click "New" > "Blueprint" and select `organvm-iii-ergon/life-my--midst--in`
3. The `infra/render.yaml` blueprint will provision: web, api, orchestrator, redis, database
4. **Override DATABASE_URL** on the API service to use Neon instead of Render's Postgres:
   ```
   postgresql://neondb_owner:npg_L6jQf8lbiIVn@ep-dark-cherry-ah3f7vpu-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Add these environment variables on the API service:
   ```
   JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   PROFILE_KEY_ENC_KEY=<generate: same command>
   ```

### Step 2: Run Migrations (already done)

Migrations were applied on 2026-02-16. If you need to re-run:
```bash
cd apps/api
DATABASE_URL="<neon-connection-string>" pnpm migrate
DATABASE_URL="<neon-connection-string>" pnpm seed
```

### Step 3: Verify

- `GET /health` → `{"status":"ok"}`
- `GET /ready` → `{"status":"ready"}`
- `GET /demo/profile` → Full demo profile (no auth required)
- `GET /v1/taxonomy/masks` → 16 masks from database

---

## Alternative: Vercel (Web Only) + Render (API Only)

### Web on Vercel
1. Import `organvm-iii-ergon/life-my--midst--in` on Vercel
2. Set root directory to `apps/web`
3. Set `NEXT_PUBLIC_API_URL` to the Render API URL
4. Framework: Next.js (auto-detected)

### API on Render
1. Create a new Web Service on Render
2. Connect to `organvm-iii-ergon/life-my--midst--in`
3. Build command: `pnpm install && pnpm --filter @in-midst-my-life/api build`
4. Start command: `pnpm --filter @in-midst-my-life/api start`
5. Health check: `/health`
6. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `PROFILE_KEY_ENC_KEY`

---

## Environment Variables Reference

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | Yes (prod) | — | Neon connection string |
| `JWT_SECRET` | Yes (prod) | dev fallback | 32+ char random hex |
| `PROFILE_KEY_ENC_KEY` | No | ephemeral | 32+ char random hex for encryption at rest |
| `NODE_ENV` | No | development | Set `production` for deploy |
| `PORT` | No | 3001 | API port |
| `REDIS_URL` | No | — | Required for orchestrator, not API |
| `STRIPE_SECRET_KEY` | No | mock | Uses mock billing without it |
| `ALLOWED_ORIGINS` | No | localhost | Comma-separated CORS origins |

---

## Database State (2026-02-16)

- **Provider:** Neon (serverless Postgres 17 with pgvector)
- **Project:** `in-midst-my-life` (`damp-mouse-79328625`)
- **Region:** aws-us-east-1
- **Tables:** 44 (profiles, masks, epochs, stages, CV entities, credentials, DID registry, interview sessions, marketplace, SBT tokens, settings, billing, artifacts, etc.)
- **Seed data:** 2 profiles, 16 masks, 8 epochs, 8 stages, 12 settings, 1 task

---

## What Works Without External Services

The API has mock fallbacks for all external services:
- **Stripe:** Returns mock responses when `STRIPE_SECRET_KEY` is unset or `sk_test_mock`
- **OpenAI:** Search embeddings use mock when `OPENAI_API_KEY` is unset
- **Sentry:** Disabled when `SENTRY_DSN` is unset
- **Redis:** API works without Redis (orchestrator needs it)

This means you can deploy a fully functional beta with just `DATABASE_URL` and `JWT_SECRET`.
