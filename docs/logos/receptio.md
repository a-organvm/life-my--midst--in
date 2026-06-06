# Receptio (Reception)

This document describes how the `in-midst-my-life` application is received, run, and integrated into the developer and host environment.

## Developer Onboarding
The system is designed for ease of integration with standard web tools:
- **Environment Hydration**: System configuration relies on standard `.env` and `.env.local` files, with optional 1Password CLI script integration under `scripts/secrets.env.op.sh`.
- **Database Provisioning**: Simply running `scripts/dev-up.sh` spins up fully-configured Postgres and Redis containers. Seed data is populated using standard package scripts (`pnpm --filter @in-midst-my-life/api seed`).
- **Extending the System**: New identity masks can be defined directly by editing the schema structures in `packages/schema/src/mask.ts`, compiling the project, and writing corresponding narrative selectors.

## Swarm and Ecosystem Role
As part of the wider Organvm ecosystem, the repository:
- Consumes governance configurations from `ORGAN-IV`.
- Produces signals for the `community-hub` and `social-automation` workflows.
- Exposes structured REST and GraphQL interfaces for CV rendering and alignment analysis.
