# Pragma (Concrete State)

This document represents the current, functional reality of the `in-midst-my-life` monorepo.

## Monorepo Composition

The codebase is structured as a `pnpm` workspace with strict TypeScript boundaries:

### Applications (`apps/`)

1. **`web`**: Next.js 16 UI using TailwindCSS and React 19. Hosts the dashboard, interactive interview interface, narrative editor, and public CV sharing pages. Connects to the API WebSocket endpoint at `/v1/ws` for real-time typing indicators and presence via `useWebSocketMessaging` hook.
2. **`api`**: Fastify REST API serving JSON-LD narratives, profile updates, Hunter Protocol / Academic Domain endpoints. Also hosts two WebSocket endpoints: `/v1/ws` (raw `@fastify/websocket`, `user-typing` broadcast) and `/v1/graphql/ws` (`graphql-ws` protocol for GraphQL subscriptions like `interviewScoreUpdated`). Route registration is cached to prevent duplicate `@fastify/websocket` registration.
3. **`orchestrator`**: Node.js background worker using a task queue to execute long-running tasks, process GitHub webhooks, and coordinate LLM/agent interactions.

## Persistence & Infrastructure

- **PostgreSQL**: Stores candidate profiles, masks, epochs, and interview history.
- **Redis**: Powering the background task queue and API response caching.
- **Docker Compose**: Pre-configured dev services under `infra/docker-compose.yml`.

## Current Verification Status

- Full Vitest unit and integration test suite coverage: 297/305 API tests, 225/225 web tests.
- Linting enforced via ESLint 9 (flat config) and formatting via Prettier.
- WebSocket integration tested: 2-client broadcast verification at `/v1/ws`.
- TypeScript strict mode across all packages; `typescript.ignoreBuildErrors: true` in Next.js.
