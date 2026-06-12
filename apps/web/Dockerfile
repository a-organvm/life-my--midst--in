# =============================================================================
# apps/web/Dockerfile
# Multi-stage production build for the Next.js 15 frontend
# Build context: repository root (.)
# Usage: docker build -f apps/web/Dockerfile -t midst-web .
#
# Requires `output: 'standalone'` in next.config.js
# =============================================================================

# ── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:26-alpine AS base

RUN corepack enable
WORKDIR /app

# ── Stage 2: Dependencies ────────────────────────────────────────────────────
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/orchestrator/package.json ./apps/orchestrator/
COPY packages/schema/package.json ./packages/schema/
COPY packages/core/package.json ./packages/core/
COPY packages/content-model/package.json ./packages/content-model/
COPY packages/design-system/package.json ./packages/design-system/

RUN pnpm install --frozen-lockfile

# ── Stage 3: Build ───────────────────────────────────────────────────────────
FROM base AS build

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/ ./
COPY . .

# Build the full monorepo via Turborepo; Next.js standalone output lands in
# apps/web/.next/standalone (includes server.js + bundled node_modules)
RUN pnpm build

# ── Stage 4: Runner ──────────────────────────────────────────────────────────
FROM node:26-alpine AS runner

RUN apk add --no-cache dumb-init curl

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output includes its own node_modules and server entrypoint.
# Copy the standalone bundle (contains the full server + dependencies).
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Static assets are NOT included in standalone and must be copied separately.
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy public assets (favicon, images, etc.)
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]
