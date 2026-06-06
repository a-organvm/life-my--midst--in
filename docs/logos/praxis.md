# Praxis (Remediation Plan)

This document outlines the evolutionary pathways and technical remediation targets for the `in-midst-my-life` system.

## Technical Debt Remediation
1. **Husky / Git Hook Integration**: Standardize git commit-msg and pre-commit hooks to consistently use `pnpm` workspace contexts, ensuring no developer environment issues occur when staging files.
2. **Build Warning Mitigation**: Adjust the `outputs` keys in `turbo.json` for task suites like `test` to properly track test results, silencing warning messages.
3. **Database Performance Tuning**: Continually audit indexes on tables like `masks` and `epochs` to ensure optimal performance as ledger data grows.

## Core Features & Evolutions
1. **Dynamic Interview Questions**: Introduce interactive, LLM-driven follow-up questions during the Inverted Interview to dynamically clarify employer preferences before score calculation.
2. **Semantic Integrations**: Fully implement OpenAlex/ORCID citation matching for the Academic Domain to automatically pull publication metrics.
3. **Decentralized Credentials**: Upgrade DIDs and Verifiable Credentials (VCs) to use standard web-DID registries, allowing third-party verification of career milestones.
4. **Enhanced Privacy Engine**: Allow cell-level redaction on masks so candidates can selectively hide specific clients, projects, or metrics based on employer domain.
