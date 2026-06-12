[![ORGAN-III: Ergon](https://img.shields.io/badge/ORGAN--III-Ergon-1b5e20?style=flat-square)](https://github.com/organvm-iii-ergon)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm Monorepo](https://img.shields.io/badge/pnpm-monorepo-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)

# in–midst–my–life

[![CI](https://github.com/organvm-iii-ergon/life-my--midst--in/actions/workflows/ci.yml/badge.svg)](https://github.com/organvm-iii-ergon/life-my--midst--in/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-pending-lightgrey)](https://github.com/organvm-iii-ergon/life-my--midst--in)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/organvm-iii-ergon/life-my--midst--in/blob/main/LICENSE)
[![Organ III](https://img.shields.io/badge/Organ-III%20Ergon-F59E0B)](https://github.com/organvm-iii-ergon)
[![Status](https://img.shields.io/badge/status-active-brightgreen)](https://github.com/organvm-iii-ergon/life-my--midst--in)
[![TypeScript](https://img.shields.io/badge/lang-TypeScript-informational)](https://github.com/organvm-iii-ergon/life-my--midst--in)

[![Next.js](https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=next.js)]()
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)]()
[![Fastify](https://img.shields.io/badge/Fastify-5-000?style=flat-square&logo=fastify)]()
[![Docker](https://img.shields.io/badge/Docker-4%20services-2496ED?style=flat-square&logo=docker)](infra/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-4169E1?style=flat-square&logo=postgresql)]()
[![Redis](https://img.shields.io/badge/Redis-cache-DC382D?style=flat-square&logo=redis)]()
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss)]()

> *The employer becomes the interviewee.*

A full-stack interactive CV/resume system that inverts the traditional hiring dynamic. Instead of the candidate submitting a static document and hoping for the best, the employer visits a link, answers questions about their role, team, and culture — and the system assembles a CV view curated specifically for what they are seeking. The candidate's complete professional identity is a structured, immutable ledger; what the employer sees is a dynamically filtered, role-specific snapshot assembled in real time.

This is not deception. It is **strategic curation** — the same person, presented through the professional lens most relevant to the opportunity.

---

## Table of Contents

- [Product Overview](#product-overview)
- [The Problem](#the-problem)
- [The Inverted Interview Paradigm](#the-inverted-interview-paradigm)
- [Technical Architecture](#technical-architecture)
- [The Mask System](#the-mask-system)
- [Role Families and Curation](#role-families-and-curation)
- [Temporal Epochs](#temporal-epochs)
- [Installation and Quick Start](#installation-and-quick-start)
- [Features](#features)
- [API Reference](#api-reference)
- [Repository Structure](#repository-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Cross-Organ Context](#cross-organ-context)
- [Related Work](#related-work)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Product Overview

**in–midst–my–life** reimagines the professional resume as an identity operating system. Rather than maintaining dozens of tailored PDFs or a single generic document that satisfies no one, the system maintains a single structured source of truth — a professional identity ledger — and derives audience-specific views on demand through a novel combination of mask-based filtering, role-family curation, and real-time compatibility analysis.

The system is a feature-complete monorepo comprising three applications (Next.js 16 frontend, Fastify REST API, Node.js orchestrator service), four shared packages (canonical Zod schemas, core business logic, narrative content model, and a design system), backed by PostgreSQL with pgvector for semantic search and Redis for caching and task queues.

**Key capabilities:**

- **Inverted Interview flow** — employers answer your questions; the system evaluates mutual fit
- **16 identity masks** across cognitive, expressive, and operational categories filter the same underlying truth for different professional audiences
- **10 role families** map arbitrary job titles to curated mask blends, so "UI Developer" and "React Lead" produce the same optimally-configured view
- **5-factor compatibility scoring** evaluates skill match, values alignment, growth fit, sustainability, and compensation against the candidate's stated preferences
- **8 temporal epochs** structure career narrative from Initiation through Legacy
- **W3C Verifiable Credentials** and DID resolution provide cryptographic proof of professional claims
- **Hunter Protocol** autonomously searches for, analyzes, and tailors applications to matching job opportunities
- **Multi-format export** to JSON-LD (semantic web), PDF (traditional resume), and Verifiable Credential packages

The project is **feature-complete** with 68+ commits across all roadmap phases, zero open issues, and comprehensive test coverage via Vitest with integration test support.

---

## The Problem

Traditional CVs are static, one-dimensional documents. They force professionals to flatten their multifaceted identity into a single narrative optimized for a single imagined reader. This creates several compounding problems:

1. **The tailoring trap.** Every new application demands a new version of the resume. The candidate maintains dozens of Word documents, each slightly different, each slightly stale, each representing a guess about what the reader wants.

2. **The identity compression problem.** A person who is simultaneously a systems architect, a creative writer, a technical lead, and a community organizer cannot represent all of these facets in a two-page PDF without each dimension receiving so little space that none is compelling.

3. **The static document in a dynamic world.** A resume is a snapshot frozen at the moment of export. It cannot adapt to the reader's context, cannot respond to questions, cannot present different facets to different audiences.

4. **The power asymmetry.** In the traditional flow, the candidate submits a document and waits. The employer holds all the evaluative power. The candidate has no mechanism to evaluate the employer's fit before investing time in the process.

5. **The verification gap.** Claims on a resume are assertions without proof. There is no standard mechanism for a reader to verify that a stated skill, credential, or experience is genuine.

**in–midst–my–life** addresses all five problems with a single architectural decision: the resume is not a document but a queryable system, and the query comes not from the candidate but from the employer.

---

## The Inverted Interview Paradigm

The core innovation is the inversion of the interview dynamic. When an employer or recruiter visits the candidate's link, they encounter not a static page but an interactive flow.

### Act I: The Interviewer Becomes Interviewee

The employer is greeted with a set of questions about their organization, role, and values:

- *"What does success look like in this role?"*
- *"Describe your company culture in three words."*
- *"What is the growth trajectory for this position?"*
- *"What mistakes have you made in hiring?"*
- *"What are your non-negotiables?"*

Their responses are analyzed in real time — tone, transparency, values alignment, growth markers — while the system simultaneously ingests the job requirements (skills, KPIs, compensation, seniority).

### Act II: Compatibility Analysis

The system evaluates mutual fit across five dimensions:

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| **Skill Match** | 30% | Technical skill overlap between the candidate's ledger and the role's requirements |
| **Values Alignment** | 25% | Congruence between the employer's stated culture and the candidate's preferences |
| **Growth Fit** | 20% | Whether the role's trajectory matches the candidate's career arc and current epoch |
| **Sustainability** | 15% | Work-life indicators, management style, red/green flag detection |
| **Compensation** | 10% | Market rate analysis against the candidate's stated range and the role's offer |

### Act III: Curated Presentation

Based on the compatibility analysis and the identified role family, the system selects an optimal mask blend and generates a curated professional profile — the same underlying truth, presented through the lens most relevant to this specific opportunity. The employer sees a compelling, contextually appropriate view. The candidate sees a compatibility score and detailed analysis of the employer's fit.

Both parties gain information. Neither wastes time on mismatches.

See [`docs/INVERTED-INTERVIEW.md`](docs/INVERTED-INTERVIEW.md) for the complete paradigm design, including the full question bank, analysis algorithms, and future extensions for real-time video/audio analysis.

---

## Technical Architecture

The system follows a modular monorepo architecture with hexagonal (ports and adapters) patterns in the backend, schema-first design across all packages, and a functional core / imperative shell separation.

```
┌──────────────────────────────────────────────────────────────────┐
│                     THE INVERTED INTERVIEW                       │
│   Employer visits link → answers questions → system assembles    │
│   role-curated CV from mask-filtered identity ledger             │
├─────────────────────────────┬────────────────────────────────────┤
│  Frontend (Next.js 16)      │  REST API (Fastify 5)             │
│    Dashboard & Mask Editor  │    Profile CRUD & Narrative Gen    │
│    Interview Flow UI        │    Multi-format Export (PDF/LD/VC) │
│    Compatibility Dashboard  │    Taxonomy & Auth (JWT + RBAC)    │
│    Timeline Visualization   │    API Versioning (URL + header)   │
├─────────────────────────────┼────────────────────────────────────┤
│  Orchestrator (Node.js)     │  Data Layer                       │
│    10 Agent Roles           │    PostgreSQL + pgvector           │
│    Redis-backed Task Queue  │    Redis (cache + queue)           │
│    Hunter Protocol Engine   │    21 Migration Files              │
│    GitHub Webhook Ingestion │    DID / VC Verification Store     │
└─────────────────────────────┴────────────────────────────────────┘
```

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5.3, Tailwind CSS, Framer Motion 11 |
| **Backend** | Fastify 5, Node.js 22+, TypeScript strict mode, GraphQL subscriptions |
| **Data** | PostgreSQL + pgvector (semantic search), Redis (cache/queue), Zod schemas, JSON-LD |
| **Verification** | W3C DIDs (web, key, jwk, pkh methods), Verifiable Credentials, selective disclosure |
| **Infrastructure** | Docker Compose, Helm charts, GitHub Actions (6 workflows: CI/CD, deploy, performance, release, security, test) |
| **Quality** | ESLint 9 (flat config), Vitest 4, Playwright (E2E), Prettier, Husky + lint-staged, commitlint, 75%+ coverage thresholds |
| **Build** | pnpm workspaces, Turborepo (dependency-graph-aware builds) |

### Schema-First Design

All data models are defined in `packages/schema/` using Zod, forming the single source of truth for the entire system. Consuming packages and applications import types and validators from this canonical location:

- `identity.ts` — Identity and personal thesis
- `profile.ts` — Complete user profile
- `mask.ts` — Identity masks (16 types across 3 ontological categories)
- `epoch.ts` — Temporal periods (8 lifecycle stages)
- `stage.ts` — Career stages
- `narrative.ts` — Narrative block structure with weighting
- `verification.ts` — DID/VC related schemas

### Hexagonal Architecture

The API (`apps/api`) follows hexagonal architecture strictly:

- **Validation layer** (`src/validation/`) — Input validators defining request contracts
- **Service layer** (`src/services/`) — Core business logic with no framework dependencies
- **Route layer** (`src/routes/`) — Thin Fastify route handlers for orchestration
- **Repository layer** (`src/db/`) — Repository pattern abstracting PostgreSQL access

This separation ensures that core business logic can be tested in isolation without spinning up HTTP servers or database connections.

### Database Schema

The system uses 21 sequential migration files building up the complete data model:

| Migration | Domain |
|-----------|--------|
| 001–006 | Profiles, masks, epochs, stages, CV entities, credentials graph, timeline, backups |
| 007–010 | Narratives, agent tokens, hunter protocol tables, performance indexes, rate limits |
| 011–016 | Subscriptions, artifacts, cloud integrations, DID registry, pgvector semantic search, settings |
| 017–021 | Identity core, interview sessions, SBT tokens, marketplace, admin config seeds |

---

## The Mask System

Masks are not personalities and not personas. They are **professional lenses** — structured filters that reshape the same underlying identity data for different audiences without altering the source of truth.

### Mask Taxonomy

| Category | Masks | What They Filter |
|----------|-------|-----------------|
| **Cognitive** (how you think) | Analyst, Synthesist, Observer, Strategist, Speculator, Interpreter | Emphasize analytical depth, pattern recognition, strategic reasoning |
| **Expressive** (how you create) | Artisan, Architect, Narrator, Provoker, Mediator | Emphasize creative output, system design, storytelling, communication |
| **Operational** (how you execute) | Executor, Steward, Integrator, Custodian, Calibrator | Emphasize delivery, governance, cross-functional coordination, quality |

Each mask carries theatrical metadata (nomen, role vector, tone register, visibility scope, motto) and produces a distinct narrative voice when applied to the same underlying CV data. The core matching logic lives in `packages/core/maskMatching.ts`, where given a set of contexts (tags, audience signals), the system ranks available masks and selects the optimal blend.

### Mask Resonance

When an employer completes the Inverted Interview, the system performs **mask resonance analysis** — determining which masks naturally align with the employer's stated values, culture, and role requirements. This is not a binary match but a weighted resonance score, allowing the system to blend multiple masks for the most compelling and authentic presentation.

---

## Role Families and Curation

Job titles are noisy and inconsistent. "Frontend Developer," "UI Engineer," "React Lead," and "Client-Side Architect" all describe substantially overlapping roles, yet a naive keyword-matching system would treat them as distinct.

The system resolves this through **role family mapping**: a taxonomy of 10 role families, each with a curated mask blend that produces the optimal professional presentation.

| Role Family | Primary Masks | Example Titles |
|-------------|--------------|----------------|
| Frontend Engineering | Architect, Artisan, Integrator | UI Developer, React Lead, Frontend Engineer |
| Backend Engineering | Architect, Analyst, Steward | API Developer, Platform Engineer, Backend Lead |
| Engineering Management | Steward, Strategist, Mediator | Tech Lead, Engineering Manager, VP Engineering |
| DevOps / SRE | Custodian, Architect, Executor | SRE, Infrastructure Engineer, Platform Ops |
| Product Design | Artisan, Observer, Narrator | UX Designer, Product Designer, Design Lead |
| Data Engineering | Analyst, Architect, Custodian | Data Engineer, ML Engineer, Analytics Lead |
| Security | Custodian, Analyst, Strategist | Security Engineer, AppSec Lead |
| Product Management | Strategist, Mediator, Narrator | Product Manager, Technical PM |
| Technical Writing | Narrator, Interpreter, Synthesist | Technical Writer, Documentation Engineer |
| Research | Analyst, Speculator, Synthesist | Research Engineer, Applied Scientist |

The full 10-family taxonomy with mask weights is defined in [`packages/content-model/src/role-families.ts`](packages/content-model/src/role-families.ts).

---

## Temporal Epochs

Professional identity is not static; it evolves through temporal arcs. The system models career progression through 8 epochs, each representing a distinct phase of professional development:

```
Initiation → Expansion → Consolidation → Divergence →
  Mastery → Reinvention → Transmission → Legacy
```

Each epoch carries its own narrative voice, its own emphasis in the CV presentation, and its own relationship to the mask system. An entry tagged with the "Expansion" epoch will be presented differently than one tagged "Mastery" — not because the facts change, but because the framing and emphasis shift to match the professional maturity of that period.

The epoch model enables temporal navigation: an employer can explore not just what the candidate has done, but how their professional identity has evolved over time.

---

## Installation and Quick Start

### Prerequisites

- **Node.js 22+** (LTS recommended)
- **pnpm** (monorepo package manager)
- **Docker + Docker Compose** (for PostgreSQL and Redis)

### Install and Run

```bash
# Clone the repository
git clone https://github.com/organvm-iii-ergon/life-my--midst--in.git
cd life-my--midst--in

# Install all dependencies (monorepo-aware)
pnpm install

# Start PostgreSQL + Redis via Docker Compose
scripts/dev-up.sh

# Run database migrations
pnpm --filter api migrate

# Seed demo data
pnpm --filter api seed

# Start all services in development mode
# web (:3000), api (:3001), orchestrator (:3002)
pnpm dev
```

### Verify

```bash
# Health check
curl http://localhost:3001/health
# → { "status": "ok" }

# List all identity masks
curl http://localhost:3001/v1/taxonomy/masks
# → [ { "id": "analyst", "category": "cognitive", ... }, ... ]

# List temporal epochs
curl http://localhost:3001/v1/taxonomy/epochs
# → [ { "id": "initiation", ... }, ... ]
```

### Environment Configuration

```bash
# .env.local (or export directly)
DATABASE_URL=postgresql://user:pass@localhost:5432/midst_dev
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

For integration testing, use separate databases to avoid touching development data:

```bash
INTEGRATION_POSTGRES_URL=postgresql://user:pass@localhost:5432/midst_test
INTEGRATION_REDIS_URL=redis://localhost:6379/1
```

---

## Features

### Inverted Interview Engine

The core interactive flow where employers answer candidate-defined questions. Includes real-time tone analysis, values alignment detection, green/red flag identification, and compatibility scoring. The full question bank is customizable per mask. Built with the `CompatibilityAnalyzer` class in `packages/content-model/src/compatibility.ts`.

### Hunter Protocol

An autonomous job search system that finds matching opportunities, analyzes skill gaps, tailors resumes per role family, and generates cover letters. Operates through the orchestrator service with Redis-backed task queuing and persistent tracking of application history and outcomes.

### Multi-Format Export

- **JSON-LD** — Semantic web consumption, compatible with schema.org vocabulary
- **PDF** — Styled resume PDFs with mask-specific narrative injection and cover letter generation
- **Verifiable Credentials** — W3C standard cryptographic proof of professional claims, with selective disclosure

### Narrative Engine

Transforms raw CV data into mask-filtered narrative blocks with LLM-scored importance weighting. Each narrative block carries metadata about which masks it serves, which epochs it belongs to, and how it should be weighted in different presentation contexts. Includes coherence checking to verify that mask transitions produce logically consistent narratives.

### DID/VC Verification

Decentralized identifiers (supporting web, key, jwk, and pkh methods) provide cryptographic identity anchoring. Verifiable Credentials are issuable per mask and per epoch, enabling selective disclosure — an employer can verify specific professional claims without accessing the entire identity ledger.

### Real-Time Compatibility Dashboard

A live visualization of the 5-factor compatibility analysis, showing how the employer's responses map to the candidate's preferences and which masks resonate most strongly with the stated role and culture. Built as a React component at `apps/web/src/components/CompatibilityDashboard.tsx`.

---

## API Reference

The API uses hybrid URL + header versioning (per ADR-017). All endpoints are documented in the [OpenAPI specification](apps/api/openapi.yaml).

| Group | Endpoints | Description |
|-------|-----------|-------------|
| **Health** | `GET /health`, `GET /ready`, `GET /metrics` | Service health, readiness, and Prometheus metrics |
| **Taxonomy** | `GET /v1/taxonomy/masks`, `/epochs`, `/stages` | List identity masks, temporal epochs, career stages |
| **Profiles** | `GET /v1/profiles/:id`, `POST .../narrative`, `POST .../masks/select` | Profile retrieval, narrative generation, mask selection |
| **Export** | `GET .../export/jsonld`, `.../vc`, `.../pdf` | Multi-format professional profile export |
| **Hunter** | `POST /v1/hunter/find-jobs`, `/analyze-gap`, `/tailor-resume`, `/write-cover-letter` | Autonomous job search operations |
| **Auth** | `POST /v1/auth/login`, `/auth/revoke` | JWT authentication with role-based access control |
| **Admin** | Various | Taxonomy mutations, scoring weight configuration, feature flags |

Authentication uses JWT bearer tokens with permission claims for fine-grained access control. Rate limiting is enforced at the API layer with configurable thresholds per endpoint group.

---

## Repository Structure

```
life-my--midst--in/
├── apps/
│   ├── web/                    Next.js 16 dashboard (:3000)
│   │   └── src/components/     React components (CompatibilityDashboard, MaskEditor, etc.)
│   ├── api/                    Fastify REST API (:3001)
│   │   ├── migrations/         21 SQL migration files
│   │   ├── seeds/              Demo data (profiles, masks, epochs, CV entities)
│   │   ├── src/services/       Business logic (hexagonal core)
│   │   ├── src/routes/         Route handlers (thin orchestration)
│   │   ├── src/validation/     Request validators
│   │   └── openapi.yaml        Full API specification
│   └── orchestrator/           Node.js worker service (:3002)
│       └── src/                Task queue, webhook ingestion, agent execution
├── packages/
│   ├── schema/                 Zod schemas & TypeScript types (canonical data model)
│   ├── core/                   Business logic (mask matching, crypto, DIDs, job handling)
│   ├── content-model/          Narrative generation, JSON-LD, role families, compatibility
│   └── design-system/          Shared UI primitives and styling
├── docs/
│   ├── INVERTED-INTERVIEW.md   The north-star paradigm design
│   ├── seed.yaml               Repository constraints ("genome")
│   ├── CONTRIBUTING.md         Contribution guidelines
│   ├── CHANGELOG.md            Release history
│   ├── MANIFEST.md             Complete file catalog
│   ├── DEFINITIONS.md          Unified terminology glossary
│   ├── adr/                    15 Architecture Decision Records
│   └── archived/               64 historical design documents
├── infra/                      Docker Compose, Helm charts, Dockerfiles
├── scripts/                    Dev utilities (dev-up.sh, dev-shell.sh)
├── config/                     Tool configs (Lighthouse CI)
├── .github/
│   ├── workflows/              6 GitHub Actions workflows (CI/CD, deploy, perf, release, security, test)
│   ├── ISSUE_TEMPLATE/         Bug report and feature request templates
│   └── PULL_REQUEST_TEMPLATE.md
├── CLAUDE.md                   AI development guidance (comprehensive)
└── LICENSE                     MIT
```

---

## Development

### Build and Typecheck

```bash
# Build all packages (Turborepo respects dependency graph)
pnpm build

# TypeScript strict mode validation
pnpm typecheck

# Lint entire monorepo (ESLint 9 flat config)
pnpm lint
```

### Testing

```bash
# Unit tests (all packages and apps)
pnpm test

# Watch mode (auto-rerun on changes)
pnpm test:watch

# Integration tests (requires INTEGRATION_* env vars)
pnpm integration

# Coverage report (CI mode)
CI=true pnpm test
```

### Database Operations

```bash
# Start services
scripts/dev-up.sh

# Interactive database shell
scripts/dev-shell.sh

# Run migrations (idempotent)
pnpm --filter api migrate

# Seed demo data
pnpm --filter api seed
```

### Code Quality Standards

- **TypeScript strict mode** enforced globally — no implicit any, no unused locals, no implicit returns
- **75%+ coverage** thresholds for statements, branches, functions, and lines
- **Max 1,200 LOC** per file, **max 200 LOC** per function, **max cyclomatic complexity of 10**
- **Conventional commits** enforced via commitlint (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert)
- **Pre-commit hooks** via Husky: ESLint fix + Prettier format on staged `.ts`/`.tsx` files

---

## Deployment

The system supports multiple deployment targets with one-click options:

- **Vercel (Activated)** — Production Endpoint: [https://life-my-midst-nn3m5m54g-iviivi.vercel.app](https://life-my-midst-nn3m5m54g-iviivi.vercel.app)
- **Railway** — Template-based deployment with managed PostgreSQL
- **Render** — Blueprint deployment with auto-scaling
- **Docker Compose** — Self-hosted with full infrastructure control
- **Helm** — Kubernetes deployment with configurable replicas and resource limits

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and [`docs/SELF-HOSTING.md`](docs/SELF-HOSTING.md) for complete deployment guides. Infrastructure definitions live in `infra/` with Docker Compose, Helm charts, and platform-specific configuration files.

---

## Cross-Organ Context

This repository is part of **ORGAN-III (Ergon)** — the Commerce organ of the [ORGANVM system](https://github.com/organvm-iii-ergon), which coordinates creative, institutional, and commercial projects across eight specialized organs.

### Relationship to ORGAN-I (Theoria)

The mask system's ontological taxonomy (cognitive / expressive / operational categories), the epoch model's temporal structuring, and the Inverted Interview's philosophical framing of identity-as-ledger all draw from theoretical work developed in [ORGAN-I (Theoria)](https://github.com/organvm-i-theoria). Specifically:

- The **recursive identity model** — the idea that professional identity is not a fixed entity but a recursive, self-referential structure that produces different views depending on the observer — originates from ORGAN-I's epistemological research in [recursive-engine](https://github.com/organvm-i-theoria/recursive-engine--generative-entity).
- The **mask taxonomy** draws on ORGAN-I's ontological frameworks for categorizing modes of knowing and acting.

### Relationship to ORGAN-IV (Taxis)

The orchestrator service's multi-agent architecture and task queue patterns align with governance and routing patterns developed in [ORGAN-IV (Taxis)](https://github.com/organvm-iv-taxis). The [agentic-titan](https://github.com/organvm-iv-taxis/agentic-titan) project in particular provides orchestration patterns that inform the Hunter Protocol's autonomous job search workflow and the orchestrator's 10-agent role system.

### ORGAN-III Context

Within ORGAN-III (Ergon), this project represents the most architecturally sophisticated product — a full-stack SaaS application demonstrating the organ's capacity for building commercially viable software that embodies the theoretical and artistic principles of the broader ORGANVM system. It sits alongside other ORGAN-III projects focused on data products, browser tooling, and commercial utilities.

---

## Related Work

- **[docs/INVERTED-INTERVIEW.md](docs/INVERTED-INTERVIEW.md)** — The complete paradigm design document, including the full question bank, compatibility analysis algorithms, and future extensions
- **[CLAUDE.md](CLAUDE.md)** — Comprehensive development guidance, architecture patterns, and module boundaries
- **[docs/MANIFEST.md](docs/MANIFEST.md)** — Complete project file catalog
- **[docs/DEFINITIONS.md](docs/DEFINITIONS.md)** — Unified terminology glossary (masks, epochs, stages, role families)
- **[docs/DECISION-LOG.md](docs/DECISION-LOG.md)** — 15 Architecture Decision Records documenting key technical choices
- **[docs/seed.yaml](docs/seed.yaml)** — Repository constraints ("genome") defining code quality standards
- **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** — Contribution guidelines
- **[docs/SECURITY.md](docs/SECURITY.md)** — Security checklist and secrets management

Historical design documents (64 files from the project's evolution from concept to implementation) are preserved in [`docs/archived/`](docs/archived/).

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) before submitting a pull request.

**In brief:**

- TypeScript strict mode, no `any` types
- 75%+ test coverage, Prettier formatting, ESLint rules
- Max 1,200 LOC per file, max 200 LOC per function
- Feature branch workflow with PR review
- Conventional commit messages (enforced by commitlint)

Please also read the [Code of Conduct](docs/CODE_OF_CONDUCT.md) and [Security Policy](.github/SECURITY.md).

---

## License

[MIT](LICENSE)

---

## Author

**[@4444j99](https://github.com/4444j99)**

Part of the [ORGANVM](https://github.com/meta-organvm) system — eight organs coordinating theory, art, commerce, orchestration, public process, community, and communication.

<!-- SYSTEM-NAV-START -->

---

<sub>[Case Study](https://4444j99.github.io/portfolio/projects/life-my-midst-in/) · [Portfolio](https://4444j99.github.io/portfolio/) · [System Directory](https://4444j99.github.io/portfolio/directory/) · [ORGAN III · Ergon](https://organvm-iii-ergon.github.io/) · Part of the <a href="https://4444j99.github.io/portfolio/directory/">ORGANVM eight-organ system</a></sub>

<!-- SYSTEM-NAV-END -->
