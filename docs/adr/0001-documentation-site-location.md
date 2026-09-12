# ADR 0001: Documentation Site Location

## Context

Milestone M8 requires building a documentation site (using VitePress) that publishes the protocol specification, architecture guide, API references, and quickstart documentation.
The repository already contains foundational governance and specification documents directly under `docs/` (`docs/spec-schema.md`, `docs/spec-protocol.md`, `docs/architecture.md`, `docs/coding-standards.md`, `docs/AGENTS.md`, etc.).
If VitePress was configured with `docs/` as its root, internal contributor files (such as `AGENTS.md` and `quality-checklist.md`) would be ingested into VitePress routing, while VitePress's configuration (`.vitepress/`) and theme files would mix with repository root engineering guidelines.

## Decision

We establish the VitePress documentation site in `site/` (as a monorepo workspace package `site`).
The site will:
1. Source the canonical protocol specifications (`docs/spec-schema.md` and `docs/spec-protocol.md`) into the public documentation structure.
2. Provide curated guide pages: Quickstart, Architecture, Security & Consent, MCP Client Integration, and React Integration.
3. Contain the VitePress configuration, theme, and static assets in `site/.vitepress/`.
4. Include build scripts to build and preview the docs site (`pnpm --filter site build`, `pnpm --filter site preview`).

## Consequences

- **Clean separation:** Contributor-only engineering specifications in `docs/` remain untouched and separate from the public documentation portal.
- **Canonical specs preserved:** `spec-schema.md` and `spec-protocol.md` continue to be the ground truth for both humans and AI agents reading the repository.
- **Monorepo ergonomics:** The documentation site is independently buildable and verifiable as part of monorepo CI without polluting other packages.
