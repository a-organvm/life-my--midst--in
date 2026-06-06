# Pragma (Concrete State)

This document represents the current, functional reality of the `in-midst-my-life` monorepo.

## Monorepo Composition
The codebase is structured as a `pnpm` workspace with strict TypeScript boundaries:

### Applications (`apps/`)
1. **`web`**: Next.js 16 UI using TailwindCSS and React 19. It hosts the dashboard, the interactive interview interface, the narrative editor, and public CV sharing pages.
2. **`api`**: Fastify REST API serving JSON-LD narratives, profile updates, and hosting the Hunter Protocol / Academic Domain endpoints.
3. **`orchestrator`**: Node.js background worker using a task queue to execute long-running tasks, process GitHub webhooks, and coordinate LLM/agent interactions.

### Packages (`packages/`)
1. **`schema`**: Zod schema definitions (`profile.ts`, `mask.ts`, `academic.ts`, etc.). The single source of truth for validation and TypeScript types.
2. **`core`**: Contains business logic, including mask-matching algorithms, 5-factor scoring, and cryptographic primitives.
3. **`content-model`**: Handles rendering profiles, mapping narrative weights, and exporting semantic JSON-LD structures.
4. **`design-system`**: A shared library of React component primitives styled with CSS.

## Persistence & Infrastructure
- **PostgreSQL**: Stores candidate profiles, masks, epochs, and interview history.
- **Redis**: Powering the background task queue and API response caching.
- **Docker Compose**: Pre-configured dev services under `infra/docker-compose.yml`.

## Current Verification Status
- Full Vitest unit and integration test suite coverage.
- Linting enforced via ESLint 9 and formatting via Prettier.
