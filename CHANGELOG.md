# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Complete rewrite from React to SvelteKit.** Migrated the app from a React 19 + Vite + npm single-file component to SvelteKit + Svelte 5 (runes) + Bun, with full 1:1 feature parity. The diff engine, syntax tokenizer, language detection, and report generators were ported to pure, framework-agnostic TypeScript modules.
- Rebranded the project to **Juxta** (a self-hostable, open-source alternative to text-compare.com).
- `localStorage` preference keys renamed from `text-compare-*` to `juxta-*`.

### Added
- Unit test suite (`bun test`) covering the diff engine, tokenizer, language detection, text helpers, and export generators.
- End-to-end test suite (Playwright) for the core flows, plus automated accessibility scans (axe-core) on key UI states in both light and dark themes.
- Accessibility pass toward WCAG 2.1 AA — accessible names on icon-only controls, associated form labels, AA-contrast colours, and keyboard-focusable scroll regions.
- Docker self-hosting: multi-stage `Dockerfile` (Bun) + `docker-compose.yml` with healthcheck and `PORT`/`HOST`/`ORIGIN` configuration.
- Open-source project documentation: AGPL-3.0 `LICENSE`, `README`, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, and GitHub issue/PR templates.
- GitHub Actions CI gating type-check, unit tests, build, end-to-end tests, and the Docker image build.

### Removed
- The original React/Vite scaffolding and Google AI Studio leftovers.

[Unreleased]: https://github.com/pranavp1507/Juxta/commits/main
