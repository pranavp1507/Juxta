# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Juxta** is a self-hostable, open-source side-by-side text/code diff tool. Stack: SvelteKit 2 + Svelte 5 (runes) + Bun + `@sveltejs/adapter-node` + Tailwind v4. All diffing, tokenizing, syntax highlighting, and report export run in the browser — there is no runtime backend. Self-hosting is via Docker (multi-stage image, `docker compose up`).

## Commands

```bash
bun install          # install dependencies
bun run dev          # Vite dev server on port 3000, host 0.0.0.0
bun run build        # production build to build/ (adapter-node; serve with node build/)
bun run preview      # preview the production build
bun run check        # svelte-check + TS type-check (0 errors = clean)
bun test             # Bun unit test runner (38 tests across diff/export/state)
bun run test:e2e     # Playwright E2E + axe accessibility scans (12 tests)
```

## Architecture

### Pure logic — `src/lib/diff/` and `src/lib/export/`

- **`src/lib/diff/engine.ts`** — dependency-free diff engine (ported from the original React prototype). Pipeline:
  1. `diffLines(left, right)` — LCS line diff. Strips identical prefix/suffix, runs DP on the differing middle. Hard cap: if `midLeft.length * midRight.length >= 12_250_000` (~3500×3500) bails to a naive delete-then-insert fallback. Returns `DiffOp[]`.
  2. `alignDiff(ops, highlightMode)` — converts the op stream to side-by-side `AlignedDiffRow[]`. Consecutive delete+insert runs are paired as `modify` rows; `diffTokens` produces inline word/char highlights (`leftWords`/`rightWords`).
  3. `diffTokens` / `tokenize` — intra-line LCS over word tokens or characters.
  Row types: `equal | delete | insert | modify`.
- **`src/lib/diff/tokenizer.ts`** — pure regex syntax tokenizer (`tokenizeLanguage(text, lang)`), supporting `ts | html | css | json | plain`. No JSX, no DOM — safe anywhere.
- **`src/lib/diff/detect.ts`** — `detectLanguage(text)` heuristic (returns `Lang`).
- **`src/lib/export/`** — `exportReport(format, rows, stats)` builds `html | txt | md | json` reports client-side and triggers a download via `download.ts`.

### UI — `src/lib/components/` and `src/routes/`

- Components: `TopNav`, `ControlBar`, `AdvancedBar`, `EditorPane`, `SplitView`, `UnifiedView`, `DiffLine`, `StatusFooter`, `EmptyState`, `ShortcutsModal`. shadcn-style primitives (bits-ui) live in `src/lib/components/ui/`.
- `src/routes/+page.svelte` — main page: wires settings store → diff derived → UI components. Keyboard shortcuts are delegated to `src/lib/actions/shortcuts.ts` (all Alt-based: Alt+N/P jump diffs, Alt+W wrap, Alt+L line numbers, Alt+M word/char, Alt+K shortcuts modal, Alt+E export, Alt+C clear, Alt+Enter compare, Alt+X swap, Alt+F search).

### State — `src/lib/state/`

- `settings.svelte.ts` — Svelte 5 `$state`-backed singleton. Every user preference (theme, compareMode, syncScroll, showWhitespace, showLineNumbers, lineWrap, highlightMode, syntaxHighlighting, syntaxScheme, autoCompare, languageMode) is persisted to `localStorage` under `juxta-*` keys (e.g. `juxta-theme`, `juxta-compareMode`).
- `persisted.ts` — pure serialization helpers, unit-testable without the Svelte compiler.

## Conventions & gotchas

- **Bun is the runtime** — use `bun` / `bun run` for all scripts; `bun test` for unit tests; `node build/` to run the production server.
- **SvelteKit adapter-node** — production output is `build/index.js`; configure `PORT`, `HOST`, and `ORIGIN` env vars for self-hosting (see `docker-compose.yml`).
- Tailwind v4 is wired through `@tailwindcss/vite` (no `tailwind.config.js`); styles live in `src/app.css` and inline class names.
- **`$lib` alias** maps to `src/lib/`; `src/lib/diff/engine` is the canonical diff import (not `src/utils/diff` — that React-era file is gone).
- Unit tests live alongside their modules (`*.test.ts`) and are discovered automatically by `bun test`.
- E2E tests in `e2e/` use Playwright + `@axe-core/playwright` for accessibility gates. Run with `bun run test:e2e`.
- Docker: `Dockerfile` uses a multi-stage build; `docker-compose.yml` wires up PORT/ORIGIN. `docker compose up` is the recommended self-host path.

## Standard Workflow (skills + MCP servers)

Every non-trivial change to this project should run through the phased workflow below. It composes 8 capabilities; each phase names the tool to use and why. Skip a phase only when it's genuinely irrelevant (e.g. a one-line typo fix needs no brainstorm), and say so.

**Always-on:** Run in **caveman** mode (`/caveman` or `/caveman lite` for shared docs) so responses stay terse — full technical substance, no filler. Hold to **karpathy-guidelines** throughout: smallest surgical diff that works, surface assumptions before acting, and state verifiable success criteria up front.

### Phase 0 — Orient (start of every session)

- **octopoda**: `octopoda_get_goal`, `octopoda_get_context`, `octopoda_recall` (and `octopoda_recall_similar` on the task topic) to load prior goals and decisions for this project.
- **memory**: `read_graph` / `search_nodes` to pull persisted entities (architecture facts, past gotchas) from `.claude/project-context.jsonl`.
- **git**: `git_status` + `git_log` to see working state. The repo's default branch is `main`; work on a feature branch.

### Phase 1 — Understand & design

- **superpowers `brainstorming`**: mandatory before any new feature, behavior change, or component. Pin down intent and requirements first.
- **sequential-thinking** (`sequentialthinking`): use for anything with non-obvious logic — diff-engine changes, alignment edge cases, performance trade-offs. Reason in explicit steps before writing code.

### Phase 2 — Explore the code

- **tree-sitter**: prefer over plain grep for navigating the code — the app is split across `src/lib/diff/` (engine/tokenizer/detect), `src/lib/components/` (Svelte components), and `src/routes/+page.svelte` (composition). Use `register_project_tool` once, then `get_symbols`, `get_ast`, `find_usage`, `find_text` to locate the exact function/state/handler to touch.
- **karpathy-guidelines**: confirm the assumption ("this is the only place X is set") with `find_usage` instead of guessing.

### Phase 3 — Plan & record intent

- **superpowers `writing-plans`**: for multi-step work, write the plan before touching code.
- **octopoda** `octopoda_log_decision` + **memory** `create_entities`/`create_relations`: record the decision and any new architectural fact so the next session inherits it.

### Phase 4 — Implement

- **superpowers `test-driven-development`** where a test harness exists. This project has `bun test` (unit) and `bun run test:e2e` (Playwright) — write/update tests for logic changes; for UI-only tweaks, a manual verification step (load the app, check the diff output) is acceptable if noted explicitly.
- **karpathy-guidelines**: minimal, reviewable diffs; no speculative abstraction.
- **git** (`git_branch`/`git_create_branch`, `git_add`, `git_diff_staged`): work on a branch, stage deliberately, inspect the staged diff before committing.

### Phase 5 — Verify & review

- **superpowers `verification-before-completion`**: run `bun run check` (svelte-check + TS) and `bun test` and confirm output before claiming done — evidence, not assertion.
- **superpowers `requesting-code-review`** for substantial changes; **caveman-review** (`/caveman-review`) for terse one-line PR-style notes.
- **sequential-thinking**: use `systematic-debugging` (superpowers) + step reasoning if verification surfaces a failure — diagnose before patching.

### Phase 6 — Persist & close

- **git** `git_commit` with a **caveman-commit** (`/caveman-commit`) message — Conventional Commits, ≤50-char subject, why over what.
- **memory** `add_observations` + **octopoda** `octopoda_remember` / `octopoda_update_progress`: store what was learned and advance the goal so Phase 0 of the next session starts informed.

### Quick reference

| Need | Use |
| --- | --- |
| Terse output / commits / reviews | caveman, caveman-commit, caveman-review |
| Coding discipline (surgical, assumption-checked) | andrej-karpathy-skills `karpathy-guidelines` |
| Process (brainstorm → plan → TDD → verify → review) | superpowers skills |
| Step-by-step reasoning on hard logic | sequential-thinking MCP |
| Navigate Svelte components by AST | tree-sitter MCP |
| Per-session graph memory (`.claude/project-context.jsonl`) | memory MCP |
| Cross-session goals / decisions / recall | octopoda MCP |
| Branch, diff, commit | git MCP |
