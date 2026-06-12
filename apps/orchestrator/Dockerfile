# =============================================================================
# apps/orchestrator/Dockerfile
# Multi-stage production build for the Node.js worker/orchestrator service
# Build context: repository root (.)
# Usage: docker build -f apps/orchestrator/Dockerfile -t midst-orchestrator .
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

COPY --from=deps /app/ ./
COPY . .

RUN pnpm build

# ── Stage 4: Production dependencies ─────────────────────────────────────────
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/orchestrator/package.json ./apps/orchestrator/
COPY packages/schema/package.json ./packages/schema/
COPY packages/core/package.json ./packages/core/
COPY packages/content-model/package.json ./packages/content-model/
COPY packages/design-system/package.json ./packages/design-system/

RUN pnpm install --frozen-lockfile --prod

# ── Stage 5: Runner ──────────────────────────────────────────────────────────
FROM node:26-alpine AS runner

RUN apk add --no-cache dumb-init curl

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy production node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/apps/orchestrator/node_modules ./apps/orchestrator/node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/packages/schema/node_modules ./packages/schema/node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/packages/core/node_modules ./packages/core/node_modules

# Copy built artifacts
COPY --from=build --chown=nodejs:nodejs /app/apps/orchestrator/dist ./apps/orchestrator/dist
COPY --from=build --chown=nodejs:nodejs /app/apps/orchestrator/package.json ./apps/orchestrator/
COPY --from=build --chown=nodejs:nodejs /app/apps/orchestrator/agent-registry.json ./apps/orchestrator/
COPY --from=build --chown=nodejs:nodejs /app/packages/schema/dist ./packages/schema/dist
COPY --from=build --chown=nodejs:nodejs /app/packages/schema/package.json ./packages/schema/
COPY --from=build --chown=nodejs:nodejs /app/packages/core/dist ./packages/core/dist
COPY --from=build --chown=nodejs:nodejs /app/packages/core/package.json ./packages/core/

# Root workspace files
COPY --from=build --chown=nodejs:nodejs /app/package.json ./
COPY --from=build --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./

# Copy migration files (may be needed at runtime)
COPY --from=build --chown=nodejs:nodejs /app/apps/orchestrator/migrations ./apps/orchestrator/migrations

USER nodejs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/orchestrator/dist/index.js"]
