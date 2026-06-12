# =============================================================================
# apps/api/Dockerfile
# Multi-stage production build for the Fastify API service
# Build context: repository root (.)
# Usage: docker build -f apps/api/Dockerfile -t midst-api .
# =============================================================================

# ── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:26-alpine AS base

RUN corepack enable
WORKDIR /app

# ── Stage 2: Dependencies ────────────────────────────────────────────────────
# Install all deps using only package.json files for optimal layer caching.
FROM base AS deps

# Root workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# All workspace package.json files (apps + packages)
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/orchestrator/package.json ./apps/orchestrator/
COPY packages/schema/package.json ./packages/schema/
COPY packages/core/package.json ./packages/core/
COPY packages/content-model/package.json ./packages/content-model/
COPY packages/design-system/package.json ./packages/design-system/

RUN pnpm install --frozen-lockfile

# ── Stage 3: Build ───────────────────────────────────────────────────────────
# Copy full source and build via Turborepo (handles dependency graph).
FROM base AS build

COPY --from=deps /app/ ./
COPY . .

RUN pnpm build

# ── Stage 4: Production dependencies ─────────────────────────────────────────
# Reinstall with --prod to strip devDependencies for a leaner image.
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

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy production node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/packages/schema/node_modules ./packages/schema/node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/packages/content-model/node_modules ./packages/content-model/node_modules

# Copy built artifacts
COPY --from=build --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=build --chown=nodejs:nodejs /app/packages/schema/dist ./packages/schema/dist
COPY --from=build --chown=nodejs:nodejs /app/packages/schema/package.json ./packages/schema/
COPY --from=build --chown=nodejs:nodejs /app/packages/core/dist ./packages/core/dist
COPY --from=build --chown=nodejs:nodejs /app/packages/core/package.json ./packages/core/
COPY --from=build --chown=nodejs:nodejs /app/packages/content-model/dist ./packages/content-model/dist
COPY --from=build --chown=nodejs:nodejs /app/packages/content-model/package.json ./packages/content-model/

# Root package.json + pnpm workspace config (needed for pnpm hoisted resolution)
COPY --from=build --chown=nodejs:nodejs /app/package.json ./
COPY --from=build --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./

# Copy API OpenAPI spec and migration files (may be needed at runtime)
COPY --from=build --chown=nodejs:nodejs /app/apps/api/openapi.yaml ./apps/api/
COPY --from=build --chown=nodejs:nodejs /app/apps/api/migrations ./apps/api/migrations

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/index.js"]
