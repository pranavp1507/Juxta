# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

DiffStudio (internal name "Text Compare") is a client-side, side-by-side text/code diff utility. It is a single-page React 19 + Vite + Tailwind v4 app generated from Google AI Studio. All diffing, tokenizing, syntax highlighting, and report export happen in the browser — there is no backend at runtime.

## Commands

```bash
npm install          # install dependencies
npm run dev          # Vite dev server on port 3000, host 0.0.0.0
npm run build        # production build to dist/
npm run preview      # preview the production build
npm run lint         # type-check only: tsc --noEmit (there is no ESLint)
```

There is no test framework configured. "Lint" is a TypeScript type-check.

## Architecture

Two files contain essentially all the logic:

- [src/utils/diff.ts](src/utils/diff.ts) — pure, dependency-free diff engine. The pipeline is:
  1. `diffLines(left, right)` — LCS line diff. Strips identical prefix/suffix first, then runs DP only on the differing middle. Hard cap: if `midLeft.length * midRight.length >= 12_250_000` (~3500×3500) it bails to a naive "all deletes then all inserts" fallback to avoid freezing the browser. Returns `DiffOp[]`.
  2. `alignDiff(ops, highlightMode)` — converts the linear op stream into side-by-side `AlignedDiffRow[]`. Consecutive delete+insert runs are paired into `modify` rows; for paired rows it runs `diffTokens` to produce inline word/char highlights (`leftWords`/`rightWords`).
  3. `diffTokens` / `tokenize` — intra-line LCS over word tokens (`word` mode) or characters (`char` mode).
  Row types are `equal | delete | insert | modify`. This is the data contract the UI renders against.

- [src/App.tsx](src/App.tsx) — the entire UI (~2600 lines, single default-export component). Key pieces:
  - **Syntax highlighting** is a self-contained regex tokenizer, `tokenizeLanguage(text, lang)`, supporting `ts | html | css | json | plain` with `auto` detection via `detectLanguage`. It is independent of the diff engine and applied only to `equal` rows; `modify` rows get a lighter inline token coloring.
  - **Diff computation** runs in a `useMemo` keyed on `committedTextLeft`, `committedTextRight`, and `highlightMode`, and also measures `parseTimeMs`.
  - **Commit/dirty model**: edits update `textLeft`/`textRight`; the diff renders from `committedText*`. When `autoCompare` is on they sync automatically; when off, `triggerCompare()` (Alt+Enter) commits manually and `isDirty` tracks divergence.
  - **Persistence**: every user preference (theme, compareMode, syncScroll, whitespace, line numbers, wrap, highlightMode, syntaxHighlighting, syntaxScheme, responsiveLayout, autoCompare, languageMode) is mirrored to `localStorage` under `text-compare-*` keys via individual `useEffect`s, and lazily initialized from there.
  - **Export**: `exportReport(format)` builds `html | txt | md | json` reports client-side and triggers a download.
  - **Keyboard shortcuts** are handled by a single `keydown` listener (all Alt-based): Alt+N/P jump next/prev diff, Alt+W wrap, Alt+L line numbers, Alt+M word/char mode, Alt+K shortcuts modal, Alt+E export HTML, Alt+C clear, Alt+Enter compare, Alt+X swap, Alt+F focus search.

- [src/main.tsx](src/main.tsx) — trivial React root mount under `StrictMode`.

## Conventions & gotchas

- The `@/*` path alias maps to the repo root (see [tsconfig.json](tsconfig.json) and [vite.config.ts](vite.config.ts)), but current code uses relative imports.
- **HMR / file-watching is conditionally disabled** in [vite.config.ts](vite.config.ts) via `DISABLE_HMR=true` (set by AI Studio to prevent flicker during agent edits). Don't re-enable watching there.
- `express`, `dotenv`, and `@google/genai` are listed as dependencies and `metadata.json` declares a server-side Gemini capability, but **no server or Gemini code currently exists** in the repo (`npm run clean` even removes a `server.js` that isn't checked in). Treat the app as fully client-side unless you are intentionally adding the server layer. `GEMINI_API_KEY`/`APP_URL` (see [.env.example](.env.example)) are injected by AI Studio at runtime.
- Tailwind v4 is wired through the `@tailwindcss/vite` plugin (no `tailwind.config.js`); styles live in [src/index.css](src/index.css) and inline class names.
- Some class names in App.tsx use non-standard Tailwind shades (e.g. `text-slate-550`, `text-amber-750`) — these are intentional custom values, not typos to "fix".

## Standard Workflow (skills + MCP servers)

Every non-trivial change to this project should run through the phased workflow below. It composes 8 capabilities; each phase names the tool to use and why. Skip a phase only when it's genuinely irrelevant (e.g. a one-line typo fix needs no brainstorm), and say so.

**Always-on:** Run in **caveman** mode (`/caveman` or `/caveman lite` for shared docs) so responses stay terse — full technical substance, no filler. Hold to **karpathy-guidelines** throughout: smallest surgical diff that works, surface assumptions before acting, and state verifiable success criteria up front.

### Phase 0 — Orient (start of every session)

- **octopoda**: `octopoda_get_goal`, `octopoda_get_context`, `octopoda_recall` (and `octopoda_recall_similar` on the task topic) to load prior goals and decisions for this project.
- **memory**: `read_graph` / `search_nodes` to pull persisted entities (architecture facts, past gotchas) from `.claude/project-context.jsonl`.
- **git**: `git_status` + `git_log` to see working state. ⚠️ This repo is **not yet a git repository** — run `git init` (or ask) before any git MCP step; the git MCP tools require an initialized repo.

### Phase 1 — Understand & design

- **superpowers `brainstorming`**: mandatory before any new feature, behavior change, or component. Pin down intent and requirements first.
- **sequential-thinking** (`sequentialthinking`): use for anything with non-obvious logic — diff-engine changes, alignment edge cases, performance trade-offs. Reason in explicit steps before writing code.

### Phase 2 — Explore the code

- **tree-sitter**: prefer over plain grep for this codebase — [src/App.tsx](src/App.tsx) is a ~2600-line single component. Use `register_project_tool` once, then `get_symbols`, `get_ast`, `find_usage`, `find_text` to locate the exact function/state/handler to touch.
- **karpathy-guidelines**: confirm the assumption ("this is the only place X is set") with `find_usage` instead of guessing.

### Phase 3 — Plan & record intent

- **superpowers `writing-plans`**: for multi-step work, write the plan before touching code.
- **octopoda** `octopoda_log_decision` + **memory** `create_entities`/`create_relations`: record the decision and any new architectural fact so the next session inherits it.

### Phase 4 — Implement

- **superpowers `test-driven-development`** where a test harness exists. ⚠️ This project has **no test runner** — when adding one isn't in scope, substitute a concrete manual verification step (load the app, check the diff output) and note it explicitly.
- **karpathy-guidelines**: minimal, reviewable diffs; no speculative abstraction.
- **git** (`git_branch`/`git_create_branch`, `git_add`, `git_diff_staged`): work on a branch, stage deliberately, inspect the staged diff before committing.

### Phase 5 — Verify & review

- **superpowers `verification-before-completion`**: run `npm run lint` (tsc type-check) and confirm output before claiming done — evidence, not assertion.
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
| Navigate the App.tsx monolith by AST | tree-sitter MCP |
| Per-session graph memory (`.claude/project-context.jsonl`) | memory MCP |
| Cross-session goals / decisions / recall | octopoda MCP |
| Branch, diff, commit | git MCP (needs `git init` first) |
