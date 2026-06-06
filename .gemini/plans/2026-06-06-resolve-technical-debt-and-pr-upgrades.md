# Plan: Resolve Technical Debt and PR Upgrades (2026-06-06)

This plan details the steps to address outstanding pull requests, upgrade dependencies (Vite, Vitest, and Turbo), fix resulting build/tooling configuration issues, and verify overall codebase health.

## Objectives
1. **Resolve Dependabot PR #127**: Switched to the PR branch which upgrades `turbo` to `2.9.14`, `vite` to `7.3.5`, `vitest` to `4.1.0`, and other dependencies.
2. **Fix Turbo Configuration**: Renamed `pipeline` to `tasks` in `turbo.json` to resolve Turbo 2.x breaking validation rules.
3. **Verify Upgrades & Code Quality**:
   - Run `pnpm install` (done).
   - Fix any build/typecheck/lint/test errors resulting from the upgrades.
   - Run the full test suite (`pnpm test` and `pnpm lint`).
4. **Merge Dependabot PR #127**: Merge the upgrades branch back into `master`.
5. **Establish Logos Documentation Layer**: Ensure compliance with narrative record in `docs/logos/` (Telos, Pragma, Praxis, Receptio) as mandated by the `GEMINI.md` system context rules.

## Detailed Tasks

### Task 1: Fix `turbo.json`
- Update the root `turbo.json` file to rename the `"pipeline"` key to `"tasks"`.

### Task 2: Validate Builds and Tests
- Run `pnpm lint` and `pnpm typecheck` to verify code quality.
- Run `pnpm test` to ensure vitest 4.1.0 works as expected.

### Task 3: Merge PR #127 into master
- Checkout `master`.
- Merge the branch `dependabot/npm_and_yarn/npm_and_yarn-c7c6457cad`.
- Push changes to origin (since we are ahead/resolving PR).

### Task 4: Conform to Logos Documentation Layer
- Create `docs/logos/telos.md`, `docs/logos/pragma.md`, `docs/logos/praxis.md`, `docs/logos/receptio.md` if they are missing, detailing the project design and state.
- Ensure the `GEMINI.md` Logos vacuum constraint is fully resolved.
