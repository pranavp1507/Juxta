# Juxta Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the SvelteKit + Bun skeleton and port the pure diff/export logic out of the old React app into tested `src/lib/` modules, ending with a minimal page that renders a real diff in the browser.

**Architecture:** This is Plan 1 of 3 (Foundation → UI parity → Productionization). It establishes the new stack and the pure, framework-agnostic logic layer. No UI parity yet — just a smoke page proving the engine renders. The old React files (`src/App.tsx`, `src/main.tsx`, root `index.html`, `src/index.css`) stay in place, inert, until the Plan 3 cutover; SvelteKit does not reference them.

**Tech Stack:** SvelteKit (Svelte 5 runes), Bun (runtime + package manager + test runner), `@sveltejs/adapter-node`, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn-svelte/bits-ui (initialized here, used in Plan 2), Playwright (configured in Plan 3).

## Global Constraints

- **Runtime/pkg manager:** Bun only. All scripts run via `bun`/`bunx`. Do not introduce `npm`/`pnpm` lockfiles.
- **Adapter:** `@sveltejs/adapter-node`.
- **Svelte:** v5 with runes (`$state`/`$derived`/`$effect`).
- **Tailwind:** v4 via `@tailwindcss/vite` (no `tailwind.config.js` unless a plugin requires it).
- **Diff engine logic:** ported **verbatim** — identical algorithm, including the identical-prefix/suffix stripping and the `nMid * mMid < 12_250_000` safety-cap fallback to naive delete-then-insert. No behavioral changes.
- **Naming:** project name is **Juxta**; package name `juxta`. No "Claude"/"Anthropic"/`Co-Authored-By` trailers in any commit message.
- **Pure logic only in `src/lib/diff` and `src/lib/export`:** no Svelte/DOM imports in these modules except the single `download()` helper in `export/index.ts`.
- **Baseline source of truth:** the original implementations live in the git baseline commit and current working tree at `src/utils/diff.ts` and `src/App.tsx`. "Port verbatim" means copy that exact logic.

---

### Task 1: Scaffold SvelteKit + Bun skeleton

**Files:**

- Modify: `package.json` (replace React/Vite stack with SvelteKit/Bun)
- Create: `svelte.config.js`
- Modify: `vite.config.ts` (SvelteKit + Tailwind plugins)
- Modify: `tsconfig.json` (extend generated SvelteKit config)
- Create: `src/app.html`
- Create: `src/app.css`
- Create: `src/routes/+layout.svelte`
- Create: `src/routes/+page.svelte` (placeholder)
- Modify: `.gitignore` (add `.svelte-kit/`)

**Interfaces:**

- Consumes: nothing.
- Produces: a buildable SvelteKit app. `bun run dev` serves a placeholder page; `bun run build` produces a Node server in `build/`; `bun run check` runs `svelte-check`.

- [ ] **Step 1: Replace `package.json`**

```json
{
  "name": "juxta",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node build",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "test": "bun test",
    "lint": "svelte-check --tsconfig ./tsconfig.json"
  },
  "devDependencies": {
    "@sveltejs/adapter-node": "^5.2.0",
    "@sveltejs/kit": "^2.8.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "@tailwindcss/vite": "^4.1.14",
    "svelte": "^5.1.0",
    "svelte-check": "^4.0.0",
    "tailwindcss": "^4.1.14",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create `svelte.config.js`**

```js
import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  },
};

export default config;
```

- [ ] **Step 3: Replace `vite.config.ts`**

```ts
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
});
```

- [ ] **Step 4: Replace `tsconfig.json`**

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

- [ ] **Step 5: Create `src/app.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 6: Create `src/app.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 7: Create `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

{@render children()}
```

- [ ] **Step 8: Create `src/routes/+page.svelte` placeholder**

```svelte
<h1 class="p-8 text-2xl font-bold">Juxta</h1>
```

- [ ] **Step 9: Add `.svelte-kit/` to `.gitignore`**

Append a line `.svelte-kit/` to `.gitignore`.

- [ ] **Step 10: Install and initialize shadcn-svelte / bits-ui**

Run:

```bash
bun install
bunx svelte-kit sync
bun add -d bits-ui
```

(Component generation via `shadcn-svelte` CLI happens in Plan 2; installing `bits-ui` now verifies the dependency resolves against the chosen Svelte 5 + Tailwind v4 versions — this is the spec's compatibility-risk checkpoint.)

- [ ] **Step 11: Verify build and dev server**

Run: `bun run check && bun run build`
Expected: `svelte-check` reports 0 errors; build completes and creates `build/index.js`.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: scaffold SvelteKit + Bun skeleton with Tailwind v4 and adapter-node"
```

---

### Task 2: Port diff types + word/token diff

**Files:**

- Create: `src/lib/diff/engine.ts`
- Test: `src/lib/diff/engine.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `type DiffWord = { type: 'equal' | 'delete' | 'insert'; value: string }`
  - `interface AlignedDiffRow { type: 'equal'|'delete'|'insert'|'modify'; leftLineNum?: number; rightLineNum?: number; leftContent?: string; rightContent?: string; leftWords?: DiffWord[]; rightWords?: DiffWord[] }`
  - `type DiffOp` (union of equal/delete/insert as in baseline)
  - `function tokenize(line: string): string[]`
  - `function diffTokens(tokensLeft: string[], tokensRight: string[]): DiffWord[]`

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from "bun:test";
import { tokenize, diffTokens } from "./engine";

test("tokenize splits words, whitespace, and punctuation", () => {
  expect(tokenize("foo = bar()")).toEqual([
    "foo",
    " ",
    "=",
    " ",
    "bar",
    "(",
    ")",
  ]);
});

test("tokenize returns empty array for empty string", () => {
  expect(tokenize("")).toEqual([]);
});

test("diffTokens marks inserts and deletes against equal tokens", () => {
  const result = diffTokens(["a", " ", "b"], ["a", " ", "c"]);
  expect(result).toEqual([
    { type: "equal", value: "a" },
    { type: "equal", value: " " },
    { type: "delete", value: "b" },
    { type: "insert", value: "c" },
  ]);
});

test("diffTokens with empty left is all inserts", () => {
  expect(diffTokens([], ["x", "y"])).toEqual([
    { type: "insert", value: "x" },
    { type: "insert", value: "y" },
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/diff/engine.test.ts`
Expected: FAIL — `Cannot find module './engine'`.

- [ ] **Step 3: Port the implementation**

Copy the `DiffWord`, `AlignedDiffRow`, `DiffOp` declarations and the `tokenize` and `diffTokens` functions **verbatim** from baseline `src/utils/diff.ts` (lines 1–71) into `src/lib/diff/engine.ts`. No logic changes.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/diff/engine.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/diff/engine.ts src/lib/diff/engine.test.ts
git commit -m "feat: port diff types and word-level token diff"
```

---

### Task 3: Port line diff (`diffLines`)

**Files:**

- Modify: `src/lib/diff/engine.ts`
- Modify: `src/lib/diff/engine.test.ts`

**Interfaces:**

- Consumes: `DiffOp` (Task 2).
- Produces: `function diffLines(linesLeft: string[], linesRight: string[]): DiffOp[]`.

- [ ] **Step 1: Write the failing test**

```ts
import { diffLines } from "./engine";

test("diffLines returns all-equal ops for identical input", () => {
  const ops = diffLines(["a", "b"], ["a", "b"]);
  expect(ops.map((o) => o.type)).toEqual(["equal", "equal"]);
});

test("diffLines detects a single changed middle line via prefix/suffix strip", () => {
  const ops = diffLines(["a", "X", "c"], ["a", "Y", "c"]);
  expect(ops.map((o) => o.type)).toEqual([
    "equal",
    "delete",
    "insert",
    "equal",
  ]);
});

test("diffLines preserves original line indices", () => {
  const ops = diffLines(["a", "b"], ["a", "c"]);
  const insert = ops.find((o) => o.type === "insert");
  expect(insert).toMatchObject({ type: "insert", rightIdx: 1 });
});

test("diffLines falls back to deletes-then-inserts above the safety cap", () => {
  const left = Array.from({ length: 3501 }, (_, i) => `L${i}`);
  const right = Array.from({ length: 3501 }, (_, i) => `R${i}`);
  const ops = diffLines(left, right);
  const types = ops.map((o) => o.type);
  expect(types.filter((t) => t === "delete").length).toBe(3501);
  expect(types.filter((t) => t === "insert").length).toBe(3501);
  // all deletes precede all inserts
  expect(types.indexOf("insert")).toBeGreaterThan(types.lastIndexOf("delete"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/diff/engine.test.ts`
Expected: FAIL — `diffLines is not a function`.

- [ ] **Step 3: Port the implementation**

Append the `diffLines` function **verbatim** from baseline `src/utils/diff.ts` (lines 73–190) to `src/lib/diff/engine.ts`. No logic changes (keep the `12250000` cap exactly).

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/diff/engine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/diff/engine.ts src/lib/diff/engine.test.ts
git commit -m "feat: port LCS line diff with prefix/suffix strip and safety cap"
```

---

### Task 4: Port row alignment (`alignDiff`)

**Files:**

- Modify: `src/lib/diff/engine.ts`
- Modify: `src/lib/diff/engine.test.ts`

**Interfaces:**

- Consumes: `DiffOp`, `AlignedDiffRow`, `tokenize`, `diffTokens` (Tasks 2–3).
- Produces: `function alignDiff(ops: DiffOp[], highlightMode?: 'word' | 'char'): AlignedDiffRow[]`.

- [ ] **Step 1: Write the failing test**

```ts
import { diffLines, alignDiff } from "./engine";

test("alignDiff pairs a delete+insert into a modify row with inline words", () => {
  const rows = alignDiff(diffLines(["hello world"], ["hello there"]), "word");
  expect(rows).toHaveLength(1);
  expect(rows[0].type).toBe("modify");
  expect(
    rows[0].leftWords?.some((w) => w.type === "delete" && w.value === "world"),
  ).toBe(true);
  expect(
    rows[0].rightWords?.some((w) => w.type === "insert" && w.value === "there"),
  ).toBe(true);
});

test("alignDiff emits standalone delete and insert rows when unpaired", () => {
  const rows = alignDiff(diffLines(["a"], ["a", "b"]));
  expect(rows.map((r) => r.type)).toEqual(["equal", "insert"]);
});

test("alignDiff char mode diffs by character", () => {
  const rows = alignDiff(diffLines(["cat"], ["car"]), "char");
  expect(rows[0].type).toBe("modify");
  expect(
    rows[0].rightWords?.some((w) => w.type === "insert" && w.value === "r"),
  ).toBe(true);
});

test("alignDiff sets 1-based line numbers", () => {
  const rows = alignDiff(diffLines(["a", "b"], ["a", "b"]));
  expect(rows[0]).toMatchObject({ leftLineNum: 1, rightLineNum: 1 });
  expect(rows[1]).toMatchObject({ leftLineNum: 2, rightLineNum: 2 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/diff/engine.test.ts`
Expected: FAIL — `alignDiff is not a function`.

- [ ] **Step 3: Port the implementation**

Append the `alignDiff` function **verbatim** from baseline `src/utils/diff.ts` (lines 192–283) to `src/lib/diff/engine.ts`. No logic changes.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/diff/engine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/diff/engine.ts src/lib/diff/engine.test.ts
git commit -m "feat: port side-by-side row alignment with inline word/char highlights"
```

---

### Task 5: Port syntax tokenizer (extract from App.tsx)

**Files:**

- Create: `src/lib/diff/tokenizer.ts`
- Test: `src/lib/diff/tokenizer.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `type SegmentType = 'comment'|'string'|'keyword'|'number'|'punctuation'|'function'|'tag'|'attribute'|'property'|'value'|'selector'|'plain'`
  - `type Lang = 'ts' | 'html' | 'css' | 'json' | 'plain'`
  - `function tokenizeLanguage(text: string, lang: Lang): { text: string; type: SegmentType }[]`

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from "bun:test";
import { tokenizeLanguage } from "./tokenizer";

test("plain returns a single plain segment", () => {
  expect(tokenizeLanguage("hello", "plain")).toEqual([
    { text: "hello", type: "plain" },
  ]);
});

test("ts highlights keywords", () => {
  const segs = tokenizeLanguage("const x = 1", "ts");
  expect(segs.some((s) => s.type === "keyword" && s.text === "const")).toBe(
    true,
  );
  expect(segs.some((s) => s.type === "number" && s.text === "1")).toBe(true);
});

test("json marks keys as keyword and strings as string", () => {
  const segs = tokenizeLanguage('{"a": "b"}', "json");
  expect(segs.some((s) => s.type === "keyword" && s.text === '"a"')).toBe(true);
  expect(segs.some((s) => s.type === "string" && s.text === '"b"')).toBe(true);
});

test("css marks selectors and properties", () => {
  const segs = tokenizeLanguage(".x { color: red; }", "css");
  expect(segs.some((s) => s.type === "selector")).toBe(true);
  expect(segs.some((s) => s.type === "property" && s.text === "color")).toBe(
    true,
  );
});

test("html marks tags and attributes", () => {
  const segs = tokenizeLanguage('<a href="x">', "html");
  expect(segs.some((s) => s.type === "tag" && s.text === "a")).toBe(true);
  expect(segs.some((s) => s.type === "attribute" && s.text === "href")).toBe(
    true,
  );
});

test("concatenated segment text reconstructs the original input", () => {
  const input = "const y = foo(1);";
  expect(
    tokenizeLanguage(input, "ts")
      .map((s) => s.text)
      .join(""),
  ).toBe(input);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/diff/tokenizer.test.ts`
Expected: FAIL — `Cannot find module './tokenizer'`.

- [ ] **Step 3: Extract the implementation**

Copy the `tokenizeLanguage` function **verbatim** from baseline `src/App.tsx` (lines 29–154) into `src/lib/diff/tokenizer.ts`. It is already pure (returns segment arrays, no JSX). Export `tokenizeLanguage`, the `SegmentType` union (the inline `type` literal used in the segment arrays), and the `Lang` type. Do NOT copy `renderSegmentWithSearch` (that is JSX and belongs to a Plan 2 component).

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/diff/tokenizer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/diff/tokenizer.ts src/lib/diff/tokenizer.test.ts
git commit -m "feat: extract syntax tokenizer into pure lib module"
```

---

### Task 6: Port language detection (extract from App.tsx)

**Files:**

- Create: `src/lib/diff/detect.ts`
- Test: `src/lib/diff/detect.test.ts`

**Interfaces:**

- Consumes: `Lang` (Task 5).
- Produces: `function detectLanguage(text: string): Lang`.

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from "bun:test";
import { detectLanguage } from "./detect";

test("empty string detects plain", () => {
  expect(detectLanguage("   ")).toBe("plain");
});

test("valid object detects json", () => {
  expect(detectLanguage('{"a": 1}')).toBe("json");
});

test("markup detects html", () => {
  expect(detectLanguage("<!DOCTYPE html><html></html>")).toBe("html");
});

test("rule block detects css", () => {
  expect(detectLanguage(".btn { color: red; }")).toBe("css");
});

test("code keywords detect ts", () => {
  expect(detectLanguage("const x = 1;")).toBe("ts");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/diff/detect.test.ts`
Expected: FAIL — `Cannot find module './detect'`.

- [ ] **Step 3: Extract the implementation**

Copy the `detectLanguage` function **verbatim** from baseline `src/App.tsx` (lines 407–435) into `src/lib/diff/detect.ts`, importing `Lang` from `./tokenizer`. No logic changes.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/diff/detect.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/diff/detect.ts src/lib/diff/detect.test.ts
git commit -m "feat: extract language detection into pure lib module"
```

---

### Task 7: Port export report generators (extract from App.tsx)

**Files:**

- Create: `src/lib/export/index.ts`
- Test: `src/lib/export/index.test.ts`

**Interfaces:**

- Consumes: `AlignedDiffRow` (Task 2).
- Produces:
  - `interface DiffStats { similarityPercentage: number; additions: number; deletions: number; modifications: number }`
  - `interface ReportOptions { showLineNumbers?: boolean; theme?: 'light' | 'dark' }`
  - `function buildTxtReport(rows: AlignedDiffRow[], stats: DiffStats): string`
  - `function buildMdReport(rows: AlignedDiffRow[], stats: DiffStats): string`
  - `function buildJsonReport(rows: AlignedDiffRow[], stats: DiffStats): string`
  - `function buildHtmlReport(rows: AlignedDiffRow[], stats: DiffStats, opts: ReportOptions): string`
  - `function escapeHtml(s: string): string`

**Note on dates:** the baseline used `new Date()` inline. To keep generators pure and testable, each builder must accept the current timestamp via a parameter with a default: add `generatedAt: Date = new Date()` as the last parameter of each builder and use it instead of calling `new Date()` internally.

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect } from "bun:test";
import {
  escapeHtml,
  buildTxtReport,
  buildMdReport,
  buildJsonReport,
  buildHtmlReport,
} from "./index";
import type { AlignedDiffRow } from "../diff/engine";

const rows: AlignedDiffRow[] = [
  {
    type: "equal",
    leftLineNum: 1,
    rightLineNum: 1,
    leftContent: "same",
    rightContent: "same",
  },
  {
    type: "modify",
    leftLineNum: 2,
    rightLineNum: 2,
    leftContent: "old",
    rightContent: "new",
  },
];
const stats = {
  similarityPercentage: 50,
  additions: 0,
  deletions: 0,
  modifications: 1,
};
const at = new Date("2026-06-18T00:00:00Z");

test("escapeHtml escapes the five entities", () => {
  expect(escapeHtml(`<a href="x" data='y'>&`)).toBe(
    "&lt;a href=&quot;x&quot; data=&#039;y&#039;&gt;&amp;",
  );
});

test("txt report includes the similarity index and content", () => {
  const out = buildTxtReport(rows, stats, at);
  expect(out).toContain("Similarity Index: 50%");
  expect(out).toContain("same");
});

test("md report renders a table and the summary", () => {
  const out = buildMdReport(rows, stats, at);
  expect(out).toContain(
    "# DiffStudio Comparison Report".replace("DiffStudio", "Juxta"),
  );
  expect(out).toContain("| Source (L) | Target (R) | Symbol | Content |");
});

test("json report is valid JSON with analytics + diffData", () => {
  const obj = JSON.parse(buildJsonReport(rows, stats, at));
  expect(obj.analytics.congruencyPercentage).toBe(50);
  expect(obj.diffData).toHaveLength(2);
});

test("html report is a full document with escaped content", () => {
  const out = buildHtmlReport(
    rows,
    stats,
    { showLineNumbers: true, theme: "dark" },
    at,
  );
  expect(out.startsWith("<!DOCTYPE html>")).toBe(true);
  expect(out).toContain("row-modify");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/export/index.test.ts`
Expected: FAIL — `Cannot find module './index'`.

- [ ] **Step 3: Extract and refactor the implementation**

From baseline `src/App.tsx`, locate `escapeHtml` (lines ~1023–1030) and `exportReport` (lines ~1033 onward, through the end of the HTML branch). Split `exportReport`'s four format branches into the four pure `build*Report` functions per the Interfaces block:

- Move the `txt` branch body into `buildTxtReport`, the `md` branch into `buildMdReport`, the `json` branch into `buildJsonReport`, the `html` branch into `buildHtmlReport(rows, stats, opts, generatedAt)`.
- Replace every `new Date()` with the injected `generatedAt` parameter.
- Replace each reference to a free variable (`similarityPercentage`, `additions`, `deletions`, `modifications`, `alignedRows`, `showLineNumbers`, `theme`) with the corresponding `stats.*` / `rows` / `opts.*` parameter.
- Rebrand the literal report title strings from "DiffStudio"/"Diff Studio" to "Juxta".
- Do NOT port the `download`/Blob/anchor side-effect code here (that becomes the `download()` helper wired in Plan 2). Export only the pure builders + `escapeHtml`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/export/index.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Run the full suite**

Run: `bun test`
Expected: PASS — all engine, tokenizer, detect, export tests green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/export/index.ts src/lib/export/index.test.ts
git commit -m "feat: extract pure export report generators (txt/md/json/html)"
```

---

### Task 8: Minimal diff page (in-browser smoke)

**Files:**

- Modify: `src/routes/+page.svelte`

**Interfaces:**

- Consumes: `diffLines`, `alignDiff` (Tasks 3–4).
- Produces: a page with two `<textarea>`s and a rendered list of aligned rows. This is a smoke screen, NOT the parity UI (Plan 2 replaces it).

- [ ] **Step 1: Implement the smoke page**

```svelte
<script lang="ts">
  import { diffLines, alignDiff } from '$lib/diff/engine';

  let left = $state('hello world\nsecond line');
  let right = $state('hello there\nsecond line');

  const rows = $derived(alignDiff(diffLines(left.split(/\r?\n/), right.split(/\r?\n/)), 'word'));
</script>

<main class="mx-auto max-w-5xl space-y-4 p-6">
  <h1 class="text-2xl font-bold">Juxta</h1>
  <div class="grid grid-cols-2 gap-4">
    <textarea class="h-40 rounded border p-2 font-mono text-sm" bind:value={left}></textarea>
    <textarea class="h-40 rounded border p-2 font-mono text-sm" bind:value={right}></textarea>
  </div>
  <ul class="font-mono text-sm" data-testid="diff-rows">
    {#each rows as row}
      <li>
        <span>{row.type}</span>
        <span>{row.leftContent ?? ''}</span>
        <span>→</span>
        <span>{row.rightContent ?? ''}</span>
      </li>
    {/each}
  </ul>
</main>
```

- [ ] **Step 2: Verify it builds and type-checks**

Run: `bun run check && bun run build`
Expected: 0 errors; `build/` produced.

- [ ] **Step 3: Manual smoke (record result)**

Run: `bun run dev`, open `http://localhost:3000`, confirm the row list shows a `modify` row for line 1 and an `equal` row for line 2; editing a textarea updates the list live. Note the observed result in the commit body.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: minimal in-browser diff smoke page wired to the diff engine"
```

---

## Self-Review

**1. Spec coverage (Plan 1 portion):**

- Stack (SvelteKit/Svelte5/Bun/adapter-node/Tailwind v4) → Task 1. ✓
- shadcn-svelte/bits-ui compatibility checkpoint → Task 1 Step 10. ✓
- Diff engine verbatim port incl. safety cap → Tasks 2–4 (cap covered by Task 3 test). ✓
- Tokenizer + language detect → Tasks 5–6. ✓
- Export generators (4 formats) → Task 7. ✓
- `bun test` unit suite → Tasks 2–7. ✓
- In-browser proof → Task 8. ✓
- Deferred to Plan 2: components, runes settings store, bits-ui chrome, keyboard shortcuts, full UI parity. Deferred to Plan 3: a11y/responsiveness, Playwright/axe, Docker, OSS docs, CI. (Tracked in plan intro.)

**2. Placeholder scan:** No TBD/TODO. Verbatim ports cite exact baseline file + line ranges; all test code is concrete. ✓

**3. Type consistency:** `DiffWord`/`AlignedDiffRow`/`DiffOp` defined Task 2, consumed Tasks 4/7/8 with matching names. `Lang`/`SegmentType` defined Task 5, consumed Task 6. `DiffStats`/`ReportOptions` defined and used consistently in Task 7. `build*Report(rows, stats, [opts,] generatedAt)` signatures match between Interfaces and tests. ✓

**4. Date-purity:** Resolved by injecting `generatedAt` (Task 7 note), avoiding non-deterministic tests.
