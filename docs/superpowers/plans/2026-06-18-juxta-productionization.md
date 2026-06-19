# Juxta Productionization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Juxta a shippable open-source project: accessible + responsive, E2E-tested, Docker self-hostable, fully documented (AGPL-3.0), CI-gated, with the dead React scaffolding removed.

**Architecture:** This is Plan 3 of 3 (Foundation → UI parity → **Productionization**). The Svelte app is feature-complete on `main`. These tasks are largely independent workstreams (a11y, E2E, Docker, docs, CI, cutover) layered on the finished app; sequenced so a11y lands before the axe scan and the cutover lands last. No app behavior changes except accessibility refinements.

**Tech Stack:** SvelteKit (Svelte 5 runes) + Bun + adapter-node, Tailwind v4, bits-ui; Playwright + @axe-core/playwright for E2E/a11y; Docker (multi-stage Bun image); GitHub Actions.

## Global Constraints

- **Bun only** (`bun`, `bunx`); no npm/pnpm lockfiles. The diff-engine `bun test` suite (38 tests) must stay green throughout.
- **The gate per task:** `bun run check` → 0 errors (and, from Task 1 onward, **0 warnings**), `bun run build` → succeeds, `bun test` → 38 pass. E2E tasks add `bun run test:e2e`.
- **License:** AGPL-3.0 (verbatim canonical text). **Product name:** Juxta. Positioned as a self-hostable open-source alternative to text-compare.com.
- **No "Claude"/"Anthropic"/`Co-Authored-By`** in any commit message, PR body, or doc author field.
- **Preserve Tailwind classes / custom shades** when editing components for a11y — add attributes, don't restyle.
- **Accessibility target:** WCAG 2.1 AA. Axe scans must report 0 violations of impact `serious` or `critical`.
- **adapter-node output** is `build/`, run with `node build` or `bun ./build`; server honors `PORT`, `HOST`, `ORIGIN` env vars.
- **Current orphaned React files** (inert, removed in Task 8): `src/App.tsx`, `src/main.tsx`, `src/index.css`, root `index.html`, `src/utils/diff.ts`. React deps are already absent from `package.json`.

---

### Task 1: Accessibility & responsiveness pass

**Files:**
- Modify: `src/lib/components/EditorPane.svelte`
- Modify: `src/lib/components/TopNav.svelte`, `ControlBar.svelte`, `AdvancedBar.svelte`, `ShortcutsModal.svelte` (icon-only buttons / labels as needed)

**Interfaces:**
- Consumes: existing components.
- Produces: a build with `svelte-check` reporting **0 warnings** (currently 1: `a11y_label_has_associated_control` at `EditorPane.svelte`).

- [ ] **Step 1: Reproduce the current a11y warning**

Run: `bun run check`
Expected: `0 ERRORS 1 WARNINGS` — `a11y_label_has_associated_control` in `EditorPane.svelte`.

- [ ] **Step 2: Fix the EditorPane label association**

In `src/lib/components/EditorPane.svelte`, the stats/label markup uses a `<label>` not tied to a control. Either (a) give the `<textarea>` an `id={`${side}-textarea`}` (it already has this id) and point a real `<label for={`${side}-textarea`}>` at it, or (b) if the flagged `<label>` is decorative (a heading, not a form label), change it to a `<span>`/`<div>` or appropriate heading element. Pick whichever matches the element's actual role; do not alter Tailwind classes.

- [ ] **Step 3: Add accessible names to icon-only buttons**

Audit every icon-only `<button>` (no visible text) across `TopNav.svelte`, `ControlBar.svelte` (prev/next diff), `AdvancedBar.svelte` (search prev/next, clear), `EditorPane.svelte` (copy), `ShortcutsModal.svelte` (close). Each must have an accessible name — add `aria-label="..."` where there's no visible text (many already have `title`; add `aria-label` to match for screen readers). Keep existing `title` attributes.

- [ ] **Step 4: Verify 0 warnings**

Run: `bun run check`
Expected: `0 ERRORS 0 WARNINGS`.

- [ ] **Step 5: Verify build + tests still green**

Run: `bun run build && bun test`
Expected: build OK; 38 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/
git commit -m "a11y: associate editor label and add accessible names to icon buttons"
```

---

### Task 2: Playwright setup

**Files:**
- Modify: `package.json` (add `@playwright/test`, `test:e2e` script)
- Create: `playwright.config.ts`
- Create: `e2e/.gitkeep` (tests dir)
- Modify: `.gitignore` (add `test-results/`, `playwright-report/`, `/e2e/.auth`)

**Interfaces:**
- Consumes: the built app.
- Produces: `bun run test:e2e` runs Playwright against a preview server; `playwright.config.ts` exports a config with a `webServer` that builds + serves the app.

- [ ] **Step 1: Install Playwright**

Run:
```bash
bun add -d @playwright/test
bunx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun run build && bun run preview --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
```

- [ ] **Step 3: Add the `test:e2e` script to `package.json`**

Add to `scripts`: `"test:e2e": "playwright test"`.

- [ ] **Step 4: Update `.gitignore`**

Append: `test-results/`, `playwright-report/`, `/playwright/.cache/`.

- [ ] **Step 5: Add a trivial smoke test to verify the harness**

Create `e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('home page renders the Juxta brand', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Juxta').first()).toBeVisible();
});
```

- [ ] **Step 6: Run it**

Run: `bun run test:e2e`
Expected: 1 passed (Playwright builds, serves on 4173, loads page, finds "Juxta").

- [ ] **Step 7: Commit**

```bash
git add package.json playwright.config.ts e2e/ .gitignore bun.lock
git commit -m "test: set up Playwright e2e harness with preview webServer"
```

---

### Task 3: Playwright E2E — core flows

**Files:**
- Create: `e2e/diff.spec.ts`
- Create: `e2e/preferences.spec.ts`

**Interfaces:**
- Consumes: the running app (selectors: `#left-textarea`, `#right-textarea`, `[data-testid="diff-rows"]` is gone — use the real diff DOM: rows have `id="diff-row-{idx}"`; controls have ids `opt-split-mode`/`opt-unified-mode`, `search-diff-input`, `theme-toggler`, `load-sample-code`, `btn-next-diff`).
- Produces: passing E2E coverage of the primary flows.

- [ ] **Step 1: Write the diff-flow tests**

Create `e2e/diff.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('typing in both panes produces diff rows', async ({ page }) => {
  await page.goto('/');
  await page.locator('#left-textarea').fill('hello world\nsecond');
  await page.locator('#right-textarea').fill('hello there\nsecond');
  await expect(page.locator('[id^="diff-row-"]').first()).toBeVisible();
});

test('loading the code sample renders a diff and split/unified toggle works', async ({ page }) => {
  await page.goto('/');
  await page.locator('#load-sample-code').click();
  await expect(page.locator('[id^="diff-row-"]').first()).toBeVisible();
  await page.locator('#opt-unified-mode').click();
  await expect(page.locator('[id^="diff-row-"]').first()).toBeVisible();
  await page.locator('#opt-split-mode').click();
  await expect(page.locator('[id^="diff-row-"]').first()).toBeVisible();
});

test('search highlights matches and Enter navigates', async ({ page }) => {
  await page.goto('/');
  await page.locator('#load-sample-code').click();
  await page.locator('#search-diff-input').fill('user');
  await page.locator('#search-diff-input').press('Enter');
  await expect(page.locator('mark').first()).toBeVisible();
});
```

- [ ] **Step 2: Write the preferences/persistence tests**

Create `e2e/preferences.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('theme toggle persists across reload', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const wasDark = await html.evaluate((el) => el.classList.contains('dark'));
  await page.locator('#theme-toggler').click();
  await expect.poll(() => html.evaluate((el) => el.classList.contains('dark'))).toBe(!wasDark);
  await page.reload();
  await expect.poll(() => html.evaluate((el) => el.classList.contains('dark'))).toBe(!wasDark);
});

test('Alt+N jumps to the next diff', async ({ page }) => {
  await page.goto('/');
  await page.locator('#load-sample-code').click();
  await page.keyboard.press('Alt+n');
  await expect(page.locator('.ring-indigo-500\\/70, [class*="ring-indigo-500"]').first()).toBeVisible();
});
```

- [ ] **Step 3: Run the E2E suite**

Run: `bun run test:e2e`
Expected: all tests pass. If a selector misses (e.g. the active-nav ring class differs), inspect the actual rendered DOM and adjust the selector to the real markup — do not weaken assertions to trivially pass.

- [ ] **Step 4: Commit**

```bash
git add e2e/
git commit -m "test: e2e coverage for diff, views, search, theme, shortcuts"
```

---

### Task 4: Playwright axe accessibility scan

**Files:**
- Modify: `package.json` (add `@axe-core/playwright`)
- Create: `e2e/a11y.spec.ts`

**Interfaces:**
- Consumes: the running app.
- Produces: an axe scan asserting 0 serious/critical violations on key states.

- [ ] **Step 1: Install axe**

Run: `bun add -d @axe-core/playwright`

- [ ] **Step 2: Write the a11y scan**

Create `e2e/a11y.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const seriousOrCritical = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

test('empty state has no serious/critical a11y violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(seriousOrCritical(results.violations)).toEqual([]);
});

test('diff-loaded state has no serious/critical a11y violations', async ({ page }) => {
  await page.goto('/');
  await page.locator('#load-sample-code').click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(seriousOrCritical(results.violations)).toEqual([]);
});

test('shortcuts modal open has no serious/critical a11y violations', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-keyboard-guide').click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(seriousOrCritical(results.violations)).toEqual([]);
});
```

- [ ] **Step 3: Run and fix any serious/critical violations**

Run: `bun run test:e2e e2e/a11y.spec.ts`
Expected: pass. If axe reports serious/critical violations, fix them in the relevant component (e.g. missing landmark, contrast, name) — preserving Tailwind classes where possible; for contrast issues that require a shade change, note the change explicitly. Re-run until clean.

- [ ] **Step 4: Commit**

```bash
git add package.json e2e/a11y.spec.ts bun.lock
git commit -m "test: axe accessibility scans on key UI states"
```

---

### Task 5: Docker self-hosting

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `docker-compose.yml`

**Interfaces:**
- Consumes: `bun run build` → `build/` (adapter-node).
- Produces: a runnable image serving the app on `PORT` (default 3000).

- [ ] **Step 1: Create `.dockerignore`**

```
node_modules
build
.svelte-kit
.git
test-results
playwright-report
e2e
docs
*.md
.env*
```

- [ ] **Step 2: Create the multi-stage `Dockerfile`**

```dockerfile
# --- build stage ---
FROM oven/bun:1.3 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
RUN bun install --frozen-lockfile --production

# --- runtime stage ---
FROM oven/bun:1.3-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD bun -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "./build/index.js"]
```

- [ ] **Step 3: Create `docker-compose.yml`**

```yaml
services:
  juxta:
    build: .
    image: juxta:latest
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - HOST=0.0.0.0
      # - ORIGIN=https://diff.example.com  # set to your public URL behind a proxy
    restart: unless-stopped
```

- [ ] **Step 4: Build the image (best-effort)**

Run: `docker build -t juxta:latest .`
Expected: image builds; final stage `CMD ["bun", "./build/index.js"]`.
If Docker is unavailable in this environment, instead validate: the `build/index.js` entrypoint exists after `bun run build` (`ls build/index.js`), and the Dockerfile/compose are well-formed. **Record which path you took in the report** (built image vs config-validated) — CI (Task 7) will build the image regardless.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore docker-compose.yml
git commit -m "feat: Docker multi-stage build and compose for self-hosting"
```

---

### Task 6: Open-source documentation

**Files:**
- Create: `LICENSE`
- Modify: `README.md` (full rewrite)
- Create: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/PULL_REQUEST_TEMPLATE.md`
- Delete: `metadata.json`, `.env.example` (AI Studio / Gemini leftovers — neither is used by the Svelte app)

**Interfaces:**
- Consumes: nothing.
- Produces: a complete OSS doc set.

- [ ] **Step 1: Add the AGPL-3.0 license**

Create `LICENSE` containing the **verbatim canonical GNU AGPL-3.0 text** (the full license, header "GNU AFFERO GENERAL PUBLIC LICENSE / Version 3, 19 November 2007"). Do not paraphrase or truncate.

- [ ] **Step 2: Rewrite `README.md`**

Replace the AI-Studio README with Juxta content covering, in order:
- Title + one-line description ("Juxta — a fast, self-hostable, open-source side-by-side text & code diff tool. An open alternative to text-compare.com.")
- Badges line (license AGPL-3.0).
- Features (the §5 parity list: split/unified, syntax highlighting, word/char diff, search, export, themes, shortcuts, etc.).
- **Self-host quickstart**: `docker run -p 3000:3000 juxta:latest` and a `docker compose up -d` snippet; note `PORT`/`ORIGIN`.
- **Local development**: `bun install`, `bun run dev`, `bun run build`, `bun test`, `bun run test:e2e`, `bun run check`.
- Tech stack (SvelteKit + Svelte 5 + Bun + Tailwind v4).
- License: AGPL-3.0.
No "Claude"/"Anthropic"/AI-authorship references.

- [ ] **Step 3: Write `CONTRIBUTING.md`**

Cover: prerequisites (Bun), setup (`bun install`), dev loop, the gate (`bun run check`, `bun test`, `bun run test:e2e`, `bun run build` must pass), branch + Conventional Commits convention, PR process, code style (Svelte 5 runes, preserve Tailwind classes), and that all checks run in CI.

- [ ] **Step 4: Write `CODE_OF_CONDUCT.md`**

Use the Contributor Covenant v2.1 text, with a contact method placeholder line `<INSERT CONTACT METHOD>` for the maintainer to fill.

- [ ] **Step 5: Write `SECURITY.md`**

Supported versions + how to report a vulnerability privately (GitHub Security Advisories link form `https://github.com/pranavp1507/Juxta/security/advisories/new`) + expected response window. Note the app is fully client-side (no server data handling) as relevant context.

- [ ] **Step 6: Write `CHANGELOG.md`**

Keep-a-Changelog format with an `## [Unreleased]` section summarizing the Svelte rewrite (migrated from React to SvelteKit/Bun; added tests, Docker, a11y, CI).

- [ ] **Step 7: Add `.github` templates**

`bug_report.md` (repro steps / expected / actual / browser), `feature_request.md` (problem / proposed solution / alternatives), `PULL_REQUEST_TEMPLATE.md` (summary / checklist: check+test+e2e+build pass, no AI attribution).

- [ ] **Step 8: Delete AI-Studio leftovers**

```bash
git rm metadata.json .env.example
```

- [ ] **Step 9: Verify nothing referenced the deleted files**

Run: `bun run check && bun run build`
Expected: 0 errors; build OK (neither file is imported by the app).

- [ ] **Step 10: Commit**

```bash
git add LICENSE README.md CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md CHANGELOG.md .github/
git commit -m "docs: AGPL-3.0 license, README, contributing, and OSS templates"
```

---

### Task 7: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the `bun` scripts + Playwright + Docker.
- Produces: a CI workflow gating PRs.

- [ ] **Step 1: Create the workflow**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1.3'
      - run: bun install --frozen-lockfile
      - run: bun run check
      - run: bun test
      - run: bun run build
      - run: bunx playwright install --with-deps chromium
      - run: bun run test:e2e
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: false
          tags: juxta:ci
```

- [ ] **Step 2: Validate the YAML**

Run: `bunx --yes js-yaml .github/workflows/ci.yml >/dev/null && echo "valid yaml"` (or any available YAML linter). Expected: valid.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: GitHub Actions for check, test, build, e2e, docker"
```

---

### Task 8: Cutover — remove dead React scaffolding

**Files:**
- Delete: `src/App.tsx`, `src/main.tsx`, `src/index.css`, `index.html`, `src/utils/diff.ts` (and the now-empty `src/utils/` dir)
- Modify: `CLAUDE.md` (describe the Svelte/Bun stack)
- Modify: `filestructure.txt` (regenerate or remove — it's a stale tree listing)

**Interfaces:**
- Consumes: nothing.
- Produces: a repo with no React remnants; app still builds/tests/serves.

- [ ] **Step 1: Confirm nothing imports the orphans**

Run: `grep -rEn "App\.tsx|main\.tsx|utils/diff|index\.css" src e2e --include='*.ts' --include='*.svelte' || echo "no references"`
Expected: `no references` (the Svelte app imports `$lib/diff/engine`, not `src/utils/diff`). If any reference appears, STOP and report it — do not delete a referenced file.

- [ ] **Step 2: Delete the React files**

```bash
git rm src/App.tsx src/main.tsx src/index.css index.html src/utils/diff.ts
```

- [ ] **Step 3: Update `CLAUDE.md`**

Replace the "What this is" + architecture sections to describe the current stack: SvelteKit + Svelte 5 runes + Bun + adapter-node + Tailwind v4; pure logic in `src/lib/diff` (engine/tokenizer/detect) + `src/lib/export`; components in `src/lib/components`; settings store in `src/lib/state`; tests via `bun test` (unit) + Playwright (`bun run test:e2e`); Docker self-host. Remove references to React/Vite-React, `App.tsx`, `@google/genai`/`express`/Gemini, and the `text-compare-*` localStorage keys (now `juxta-*`). Keep the "Standard Workflow (skills + MCP servers)" section.

- [ ] **Step 4: Regenerate or remove `filestructure.txt`**

If keeping it, regenerate to the current tree; otherwise `git rm filestructure.txt`. (It is a stale listing of the old React layout.)

- [ ] **Step 5: Full verification after deletion**

Run: `bun run check && bun test && bun run build && bun run test:e2e`
Expected: 0 errors/0 warnings; 38 unit tests pass; build OK; E2E green. (Proves the deletions broke nothing.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove dead React scaffolding; update docs to Svelte stack"
```

---

## Self-Review

**1. Spec coverage (design spec §6/§7/§8/§9/§10):**
- §6 Responsiveness & accessibility (WCAG 2.1 AA) → Task 1 (fixes) + Task 4 (axe gate). Responsiveness was built in Plan 2 (responsiveLayout); Task 1 covers a11y refinement. ✓
- §7 Testing: `bun test` (done in Plans 1-2) + Playwright E2E + axe → Tasks 2, 3, 4. ✓
- §8 Docker & self-hosting → Task 5 (Dockerfile + compose + healthcheck + PORT/HOST/ORIGIN) + README quickstart (Task 6). ✓
- §9 OSS docs & CI → Task 6 (LICENSE/README/CONTRIBUTING/CoC/SECURITY/CHANGELOG/templates) + Task 7 (Actions). ✓
- §10 step 5 Cutover (remove React/Vite/old files, finalize README, update CLAUDE.md) → Task 8 (+ README in Task 6). React deps already absent from package.json. ✓
- §11 out-of-scope items remain out of scope. ✓

**2. Placeholder scan:** No TBD/TODO. Config files + test code are complete; doc tasks specify exact required content/sections; LICENSE/CoC reference verbatim canonical texts (standard documents, not invented). The only intentional fill-in is the CoC contact placeholder (`<INSERT CONTACT METHOD>`) — a maintainer decision, explicitly flagged.

**3. Type/selector consistency:** E2E selectors reference real element IDs created in Plan 2 (`#left-textarea`/`#right-textarea` from EditorPane `{side}-textarea`; `#opt-split-mode`/`#opt-unified-mode`, `#search-diff-input`, `#theme-toggler`, `#load-sample-code`, `#btn-keyboard-guide`, `#btn-next-diff`; rows `id="diff-row-{idx}"`). Task 3 Step 3 instructs verifying selectors against real DOM and adjusting (not weakening) if a class/id differs. Docker entrypoint `build/index.js` matches adapter-node output. CI uses the same `bun run` scripts defined in Tasks 2/earlier.

**4. Ordering:** a11y (1) before axe (4); Playwright setup (2) before E2E (3)/axe (4); cutover (8) last so deletions are verified against the full suite incl. E2E. Docker (5), docs (6), CI (7) are independent and could run in any order / in parallel under subagent execution.
