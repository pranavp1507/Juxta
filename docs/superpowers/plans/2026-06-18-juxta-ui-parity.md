# Juxta UI Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the entire React UI of the old diff tool into Svelte 5 components with full 1:1 feature parity, wired to the already-ported `src/lib` logic.

**Architecture:** This is Plan 2 of 3 (Foundation done → **UI parity** → Productionization). The pure logic (`src/lib/diff`, `src/lib/export`) already exists and is tested. This plan decomposes the 2620-line `src/App.tsx` monolith into ~12 focused Svelte components plus a runes-based settings store, two new pure helper modules (stats, transforms), and a DOM download helper. The old React files stay in place, inert, until the Plan 3 cutover. Accessibility/responsiveness _refinement_, Playwright E2E, Docker, docs, and CI are all Plan 3 — this plan delivers a working, feature-complete Svelte app verified via `svelte-check` + `build` + targeted SSR/runtime smokes.

**Tech Stack:** SvelteKit, Svelte 5 runes, Bun, Tailwind v4, shadcn-svelte/bits-ui (accessible chrome primitives), `@lucide/svelte` (icons), Svelte built-in transitions (replacing `motion/react`).

## Global Constraints

- **Source of truth for the port:** the old React component at `src/App.tsx` (preserved in the working tree). Each task cites exact line ranges to port from. Reproduce behavior and Tailwind classes faithfully.
- **Preserve Tailwind classes verbatim**, including non-standard custom shades (`text-slate-550`, `text-amber-750`, `bg-amber-250`, `dark:text-yellow-405`, `dark:text-sky-350`, `dark:text-orange-350`, etc.). These are intentional — do NOT "correct" them.
- **Bun only** (`bun`, `bunx`); no npm/pnpm lockfiles.
- **Svelte 5 runes** — no legacy stores API (`writable`) for component state; use `$state`/`$derived`/`$effect` and the `settings.svelte.ts` rune store.
- **localStorage keys rebrand** `text-compare-*` → `juxta-*`. The 12 persisted prefs and their defaults are defined in Task 1 and consumed everywhere — never re-read raw localStorage in a component.
- **Diff result contract:** `alignDiff(diffLines(left, right), highlightMode)` keyed on committed text + highlight mode, preserving today's auto-compare vs manual-commit ("dirty") model.
- **Animations** use `svelte/transition` (`fly`/`fade`) gated on `prefers-reduced-motion`; do NOT add `motion`/framer.
- **Naming:** product is **Juxta**. No "Claude"/"Anthropic"/`Co-Authored-By` in any commit message.
- **Each task ends green:** `bun run check` (0 errors) and `bun run build` succeed; `bun test` stays green for any task touching pure logic.

## React → Svelte 5 Conversion Guide (applies to every component task)

| React                                          | Svelte 5                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------- |
| `const [x, setX] = useState(init)` (ephemeral) | `let x = $state(init)`                                                              |
| persisted pref                                 | import from `settings.svelte.ts` (Task 1); read/write `settings.x`                  |
| `useMemo(() => f(), [deps])`                   | `const x = $derived.by(() => f())` (or `$derived(expr)`)                            |
| `useRef(null)` + `ref={r}`                     | `let r: HTMLElement                                                                 | undefined = $state()`+`bind:this={r}` |
| `className=`                                   | `class=` (keep class strings byte-identical)                                        |
| `onClick={h}` / `onChange`                     | `onclick={h}` / `oninput`/`onchange`; prefer `bind:value` for inputs/textareas      |
| conditional `{cond && <X/>}`                   | `{#if cond}<X/>{/if}`                                                               |
| `.map(...)` list                               | `{#each items as item, idx (key)}`                                                  |
| lucide-react `<Icon/>`                         | `@lucide/svelte` `<Icon/>` (same names)                                             |
| `motion.tr`/`AnimatePresence`                  | plain element + `transition:fly`/`fade` (reduced-motion gated)                      |
| component props                                | `let { ... } = $props()` with a typed interface                                     |
| callbacks up to parent                         | callback props (e.g. `oncompare?: () => void`) — do NOT use `createEventDispatcher` |

---

### Task 1: Settings store (persisted prefs via runes)

**Files:**

- Create: `src/lib/state/settings.svelte.ts`
- Create: `src/lib/state/persisted.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `function createPersisted<T>(key: string, initial: T, storage?: Storage): { value: T }` — a rune-backed box whose `.value` getter/setter mirrors `localStorage[key]` (JSON-serialized). On the server (no `localStorage`), it holds `initial` in memory. The `storage` param exists for testing the pure serialize/parse path.
  - `const settings` — a singleton object exposing all 12 prefs as live properties (getters/setters), each persisted. Keys + defaults below.
  - A helper `parseStored<T>(raw: string | null, initial: T): T` and `serialize<T>(v: T): string` (pure, exported for tests).

**Persisted prefs (key → default):** `juxta-theme`→system-or `'dark'`; `juxta-compareMode`→`'split'`; `juxta-syncScroll`→`true`; `juxta-showWhitespace`→`false`; `juxta-showLineNumbers`→`true`; `juxta-lineWrap`→`false`; `juxta-highlightMode`→`'word'`; `juxta-syntaxHighlighting`→`true`; `juxta-syntaxScheme`→`'high-contrast'`; `juxta-responsiveLayout`→`'adaptive'`; `juxta-autoCompare`→`true`; `juxta-languageMode`→`'auto'`. (Match the defaults in `App.tsx` lines 441–546.)

- [ ] **Step 1: Write the failing test (pure serialize/parse)**

```ts
import { test, expect } from "bun:test";
import { serialize, parseStored } from "./settings.svelte";

test("serialize round-trips primitives", () => {
  expect(parseStored(serialize("dark"), "light")).toBe("dark");
  expect(parseStored(serialize(true), false)).toBe(true);
});

test("parseStored falls back to initial on null", () => {
  expect(parseStored(null, "auto")).toBe("auto");
});

test("parseStored falls back to initial on malformed JSON", () => {
  expect(parseStored("{not json", 42)).toBe(42);
});
```

(Name the test file `persisted.test.ts`; it imports from `./settings.svelte`. Note: do NOT unit-test the rune `.value` reactivity here — runes need the Svelte compiler; that path is covered by Playwright in Plan 3.)

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/state/persisted.test.ts`
Expected: FAIL — `Cannot find module './settings.svelte'`.

- [ ] **Step 3: Implement `settings.svelte.ts`**

Implement `serialize` (=`JSON.stringify`), `parseStored` (try `JSON.parse`, catch → return `initial`; `null` → `initial`), `createPersisted` (uses `$state`; in a `typeof localStorage !== 'undefined'` guard, initializes from `parseStored(localStorage.getItem(key), initial)` and writes via `$effect`/setter using `serialize`), and the `settings` singleton with the 12 prefs. For `juxta-theme`, replicate the system-preference fallback from `App.tsx:441-448`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/state/persisted.test.ts` → PASS (3 tests).

- [ ] **Step 5: Verify type-check**

Run: `bun run check` → 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/state/settings.svelte.ts src/lib/state/persisted.test.ts
git commit -m "feat: runes-based persisted settings store"
```

---

### Task 2: Pure text helpers — stats + transforms (TDD)

**Files:**

- Create: `src/lib/text/stats.ts`
- Create: `src/lib/text/stats.test.ts`
- Create: `src/lib/text/transforms.ts`
- Create: `src/lib/text/transforms.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `stats.ts`: `interface TextStats { lines: number; words: number; chars: number; nonSpaceChars: number; readingTime: string; charsPerWord: number; densityPct: number }` and `function getStats(text: string): TextStats` — ported from `App.tsx:1381-1414`.
  - `transforms.ts`: `function toLowerCaseText(s: string): string`; `function sortLines(s: string): string`; `function removeExcessWhitespace(s: string): string`; `function replaceLineBreaks(s: string, separator: string): string` — the pure string bodies extracted from `App.tsx` `convertToLowercase` (951–958), `sortLines` (960–973), `removeExcessWhitespace` (975–998), `replaceLineBreaks` (1000–1020). `replaceLineBreaks` must resolve the special tokens `'\\t'`→tab, `'\\n'`→newline, `'space'`→`' '` exactly as the source (1001–1004).

- [ ] **Step 1: Write the failing tests**

```ts
// stats.test.ts
import { test, expect } from "bun:test";
import { getStats } from "./stats";
test("counts lines, words, chars", () => {
  const s = getStats("hello world\nfoo");
  expect(s.lines).toBe(2);
  expect(s.words).toBe(3);
  expect(s.chars).toBe(15);
});
test("empty string is all zeros", () => {
  const s = getStats("");
  expect(s.lines).toBe(1); // split('\n') of '' is ['']
  expect(s.words).toBe(0);
});
```

```ts
// transforms.test.ts
import { test, expect } from "bun:test";
import {
  toLowerCaseText,
  sortLines,
  removeExcessWhitespace,
  replaceLineBreaks,
} from "./transforms";
test("lowercase", () => {
  expect(toLowerCaseText("AbC")).toBe("abc");
});
test("sortLines orders case-insensitively", () => {
  expect(sortLines("banana\nApple\ncherry")).toBe("Apple\nbanana\ncherry");
});
test("removeExcessWhitespace trims and collapses", () => {
  expect(removeExcessWhitespace("  a   b  \n\n\n\nc ")).toBe("a b\n\nc");
});
test("replaceLineBreaks resolves special tokens", () => {
  expect(replaceLineBreaks("a\nb", ", ")).toBe("a, b");
  expect(replaceLineBreaks("a\nb", "\\t")).toBe("a\tb");
  expect(replaceLineBreaks("a\nb", "space")).toBe("a b");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test src/lib/text/` → FAIL (modules not found).

- [ ] **Step 3: Implement both modules**

Port `getStats` verbatim into `stats.ts` (returning the `TextStats` shape). Extract the four pure string operations into `transforms.ts` (the part inside each `setTextX(prev => ...)` updater — operate on the input param, return the result; no React state).

- [ ] **Step 4: Run to verify pass**

Run: `bun test src/lib/text/` → PASS. Then `bun test` (full) → still green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/text/
git commit -m "feat: pure text stats and transform helpers"
```

---

### Task 3: Install UI deps + generate bits-ui/shadcn primitives

**Files:**

- Modify: `package.json` (add deps)
- Create: shadcn-svelte component files under `src/lib/components/ui/**` (generated)
- Create/Modify: `components.json`, and whatever `src/lib/utils.ts` the CLI needs
- Modify: `src/app.css` (shadcn theme tokens, if the CLI adds them — keep existing `@import 'tailwindcss';`)

**Interfaces:**

- Consumes: nothing.
- Produces: importable accessible primitives used by later tasks — at minimum: `button`, `dialog`, `dropdown-menu`, `select`, `switch` (or `checkbox`), `toggle`/`toggle-group`, `tooltip`. Plus `@lucide/svelte` icons.

- [ ] **Step 1: Add icon + util deps**

Run:

```bash
bun add @lucide/svelte
bun add -d clsx tailwind-merge
```

- [ ] **Step 2: Initialize shadcn-svelte**

Run `bunx shadcn-svelte@latest init` and accept defaults compatible with Tailwind v4 + Svelte 5. If the CLI prompts for a base color/paths, use defaults (`src/lib/components/ui`, `$lib/utils`). If the pinned CLI version is incompatible with the installed Svelte 5 / Tailwind v4, resolve to the latest working version and **record the exact version + any config change in the report** (same latitude as Plan 1 Task 1).

- [ ] **Step 3: Generate the needed primitives**

Run:

```bash
bunx shadcn-svelte@latest add button dialog dropdown-menu select switch toggle toggle-group tooltip
```

(If a component name differs in the installed CLI version, add the nearest equivalent and note it.)

- [ ] **Step 4: Verify build**

Run: `bun run check && bun run build` → 0 errors; build succeeds. (The generated theme tokens must not break the existing `@import 'tailwindcss'` — if they do, reconcile minimally and note it.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "build: add @lucide/svelte and shadcn-svelte/bits-ui primitives"
```

---

### Task 4: EditorPane component

**Files:**

- Create: `src/lib/components/EditorPane.svelte`

**Interfaces:**

- Consumes: `getStats` (Task 2), `toLowerCaseText`/`sortLines`/`removeExcessWhitespace`/`replaceLineBreaks` (Task 2), `@lucide/svelte` icons (`Copy`, `Check`, `Clock`, `BarChart3`).
- Produces: `EditorPane` with props:

  ```ts
  let {
    value = $bindable(),
    side,
    label,
    dotClass,
    placeholder,
    emptyHint,
  }: {
    value: string;
    side: "left" | "right";
    label: string;
    dotClass: string;
    placeholder: string;
    emptyHint: string;
  } = $props();
  ```

  It owns its ephemeral UI state (copied flag, replace-dropdown open, replace separator). It mutates `value` via `bind:value` on the `<textarea>` and via the transform buttons (e.g. `value = sortLines(value)`).

- [ ] **Step 1: Implement the component**

Port the shared editor-pane structure from `App.tsx:1570-1735` (left) — header bar, mini-stats row (`getStats(value)`), the transform button bar, the textarea, the empty hint overlay, and the copy button — parameterized by props so one component serves both sides. Use the Conversion Guide. Replace the per-side handlers with local logic: transforms call the Task 2 helpers on `value`; copy uses `navigator.clipboard.writeText(value)` then a 2s `copied` flag (`Copy`↔`Check`). The Replace-Line-Breaks dropdown ports lines 1629–1702 (6 presets in `grid-cols-3` + custom input + Cancel/Apply); Apply calls `value = replaceLineBreaks(value, sep)` and closes. Keep all Tailwind classes and element IDs (`btn-lowercase-left`, etc. — make IDs side-aware via `{side}`).

- [ ] **Step 2: Verify type-check + build**

Run: `bun run check && bun run build` → 0 errors, build OK.

- [ ] **Step 3: Smoke via temporary mount**

Temporarily render two `<EditorPane>`s in `src/routes/+page.svelte` (replacing the existing textareas, keeping `bind:value={left}`/`{right}`), run `bun run build`, then `bun run dev` + `curl -s localhost:3000/ | grep -c "Active Workspace"` (expect ≥2 — one label per pane in SSR). Record the result. (Full interaction is covered by Plan 3 Playwright.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/EditorPane.svelte src/routes/+page.svelte
git commit -m "feat: EditorPane component with stats, transforms, copy"
```

---

### Task 5: TopNav component (brand, samples, actions, theme)

**Files:**

- Create: `src/lib/components/TopNav.svelte`
- Create: `src/lib/samples.ts`

**Interfaces:**

- Consumes: `settings` (theme), `@lucide/svelte` (`ArrowRightLeft`, `Code`, `FileText`, `Sparkles`, `BookOpen`, `Trash2`, `Download`, `Keyboard`, `Moon`, `Sun`).
- Produces:
  - `samples.ts`: `export const SAMPLES` ported verbatim from `App.tsx:227-405` (the `code/prose/html/css/json` `{name,left,right}` map) and `export type SampleKey = keyof typeof SAMPLES`.
  - `TopNav` with callback props:

    ```ts
    let {
      onloadsample,
      onclear,
      onswap,
      onexport,
      onshowshortcuts,
    }: {
      onloadsample: (k: SampleKey) => void;
      onclear: () => void;
      onswap: () => void;
      onexport: (fmt: "html" | "md" | "json" | "txt") => void;
      onshowshortcuts: () => void;
    } = $props();
    ```

    Theme toggle reads/writes `settings.theme` directly.

- [ ] **Step 1: Create `samples.ts`** — copy the `SAMPLES` object verbatim from `App.tsx:227-405`.

- [ ] **Step 2: Implement `TopNav.svelte`** — port the nav from `App.tsx:1423-1563`: brand + `v2.5.0` badge, the 5 sample buttons (`hidden lg:flex` container) each calling `onloadsample(key)`, Clear (`onclear`), Swap (`onswap`), the 4 export buttons segmented control calling `onexport(fmt)`, the keyboard-guide button (`onshowshortcuts`), and the theme toggle (`settings.theme = settings.theme === 'dark' ? 'light' : 'dark'`). Preserve IDs and classes.

- [ ] **Step 3: Verify** — `bun run check && bun run build` → 0 errors, build OK.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/TopNav.svelte src/lib/samples.ts
git commit -m "feat: TopNav with samples, actions, theme toggle"
```

---

### Task 6: ControlBar component (view + display options + diff nav)

**Files:**

- Create: `src/lib/components/ControlBar.svelte`

**Interfaces:**

- Consumes: `settings` (compareMode, syncScroll, showWhitespace, showLineNumbers, lineWrap, highlightMode), `@lucide/svelte` (`Columns2`, `Rows2`, `WrapText`, `ChevronUp`, `ChevronDown`).
- Produces: `ControlBar` with props:

  ```ts
  let {
    diffIndices,
    activeDiffNavIdx,
    onjump,
  }: {
    diffIndices: number[];
    activeDiffNavIdx: number;
    onjump: (dir: "next" | "prev") => void;
  } = $props();
  ```

  All toggles read/write `settings.*` directly.

- [ ] **Step 1: Implement** — port `App.tsx:1910-2047`: split/unified segmented buttons (`settings.compareMode`), the sync-scroll / whitespace / line-numbers / wrap checkboxes, the word/char segmented buttons (`settings.highlightMode`), and the prev/next diff buttons + `{diffIndices.indexOf(activeDiffNavIdx)+1} of {diffIndices.length}` counter (shown only when `diffIndices.length > 0`), calling `onjump('prev'|'next')`. Keep IDs/classes.

- [ ] **Step 2: Verify** — `bun run check && bun run build` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ControlBar.svelte
git commit -m "feat: ControlBar with view modes, display toggles, diff nav"
```

---

### Task 7: AdvancedBar component (search + syntax/lang/scheme/layout + auto-compare)

**Files:**

- Create: `src/lib/components/AdvancedBar.svelte`

**Interfaces:**

- Consumes: `settings` (syntaxHighlighting, languageMode, syntaxScheme, responsiveLayout, autoCompare), `@lucide/svelte` (`Search`, `ChevronUp`, `ChevronDown`, `RefreshCw`).
- Produces: `AdvancedBar` with props:

  ```ts
  let {
    searchQuery = $bindable(),
    searchMatches,
    activeSearchIdx,
    detectedLanguageLeft,
    isDirty,
    onsearchjump,
    onclearsearch,
    oncompare,
  }: {
    searchQuery: string;
    searchMatches: number[];
    activeSearchIdx: number;
    detectedLanguageLeft: string;
    isDirty: boolean;
    onsearchjump: (dir: "next" | "prev") => void;
    onclearsearch: () => void;
    oncompare: () => void;
  } = $props();
  ```

- [ ] **Step 1: Implement** — port `App.tsx:2050-2245`: the search input (`id="search-diff-input"`, `bind:value={searchQuery}`, Enter→`onsearchjump('next')`, Shift+Enter→`onsearchjump('prev')`), the `{activeSearchIdx+1}/{searchMatches.length}` counter, clear-search (`onclearsearch`), prev/next match buttons; the syntax-highlight checkbox, language `<select>` (`settings.languageMode`) + active-lang badge (`detectedLanguageLeft.toUpperCase()`, shown when `languageMode==='auto'`), scheme `<select>` (`settings.syntaxScheme`), layout adaptive/fixed segmented buttons (`settings.responsiveLayout`), auto-compare checkbox (`settings.autoCompare`), and the **Compare Now** button (shown when `!settings.autoCompare`, pulses when `isDirty`, calls `oncompare`). Keep IDs/classes.

- [ ] **Step 2: Verify** — `bun run check && bun run build` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdvancedBar.svelte
git commit -m "feat: AdvancedBar with search, syntax/layout options, manual compare"
```

---

### Task 8: DiffLine renderer component (the core line renderer)

**Files:**

- Create: `src/lib/components/DiffLine.svelte`

**Interfaces:**

- Consumes: `tokenizeLanguage` + `Lang`/`SegmentType` (`$lib/diff/tokenizer`), `settings` (syntaxHighlighting, syntaxScheme, showWhitespace, highlightMode), `DiffWord` (`$lib/diff/engine`).
- Produces: `DiffLine` with props:

  ```ts
  let {
    text,
    rowType,
    side,
    words,
    lang,
    searchQuery,
  }: {
    text: string | undefined;
    rowType: "equal" | "delete" | "insert" | "modify";
    side: "left" | "right";
    words?: DiffWord[];
    lang: Lang;
    searchQuery: string;
  } = $props();
  ```

  Renders one line's inner HTML: the striped empty-cell when `text===undefined`; word/char highlight spans when `words` present; syntax tokens (`tokenizeLanguage`) for `equal` rows when `settings.syntaxHighlighting`; otherwise plain text — with search-term `<mark>` overlay in all text paths, and whitespace `·` substitution when `settings.showWhitespace`.

- [ ] **Step 1: Implement** — port the logic of `renderLineCode` (`App.tsx:756-878`) and the segment color mapping of `renderSegmentWithSearch` (`App.tsx:155-224`) into this component. Recreate `highlightSearches` (the search-`<mark>` splitter, lines 771–812) as an inline `{#each}` over computed parts or a small local helper. Preserve every color class and the `<mark className="bg-amber-250 dark:bg-amber-500/80 ...">` styling. The empty-cell striped `<div>` (line 764) keeps its exact gradient classes.

- [ ] **Step 2: Verify** — `bun run check && bun run build` → 0 errors.

- [ ] **Step 3: Smoke** — temporarily render a few `<DiffLine>`s (an `equal` TS line with syntax on, a `modify` line with `words`, a line matching a `searchQuery`) on `+page.svelte`; `bun run dev` + `curl` and confirm the SSR HTML contains a syntax-colored token span, a `word-`/highlight span, and a `<mark>`. Record result, then revert the temporary mount.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/DiffLine.svelte
git commit -m "feat: DiffLine renderer (syntax + word/char + search layering)"
```

---

### Task 9: SplitView component

**Files:**

- Create: `src/lib/components/SplitView.svelte`

**Interfaces:**

- Consumes: `DiffLine` (Task 8), `settings` (responsiveLayout, showLineNumbers, lineWrap), `AlignedDiffRow` (`$lib/diff/engine`), `svelte/transition` (`fly`), `prefers-reduced-motion` (via `import { prefersReducedMotion } from 'svelte/motion'` or a media-query check).
- Produces: `SplitView` with props:

  ```ts
  let {
    rows,
    activeDiffNavIdx,
    detectedLanguageLeft,
    detectedLanguageRight,
    searchQuery,
    leftScroll = $bindable(),
    rightScroll = $bindable(),
  }: {
    rows: AlignedDiffRow[];
    activeDiffNavIdx: number;
    detectedLanguageLeft: Lang;
    detectedLanguageRight: Lang;
    searchQuery: string;
    leftScroll?: HTMLDivElement;
    rightScroll?: HTMLDivElement;
  } = $props();
  ```

  Exposes `leftScroll`/`rightScroll` via `bind:this` so the parent wires scroll sync. Fires no events; the parent attaches `onscroll` handlers to the bound elements (or pass `onleftscroll`/`onrightscroll` callback props — choose one and document it).

- [ ] **Step 1: Implement** — port `App.tsx:2265-2385`: the two scroll columns (`bind:this={leftScroll}` / `{rightScroll}`), the `table-fixed` structure, per-row background classes by `row.type` (left-side and inverted right-side palettes from the map), the `ring-2 ring-indigo-500/70 ring-inset` active-nav highlight when `idx===activeDiffNavIdx`, the `id="diff-row-{idx}"`, line-number gutters (when `settings.showLineNumbers`), and `<DiffLine .../>` for content. Replace `motion.tr` with `transition:fly={{ x: side==='left' ? -6 : 6, duration: reduceMotion ? 0 : 150 }}`. Use the `settings.responsiveLayout` grid expression.

- [ ] **Step 2: Verify** — `bun run check && bun run build` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/SplitView.svelte
git commit -m "feat: SplitView with scroll-sync hooks and row transitions"
```

---

### Task 10: UnifiedView component

**Files:**

- Create: `src/lib/components/UnifiedView.svelte`

**Interfaces:**

- Consumes: `DiffLine` (Task 8), `settings` (showLineNumbers, lineWrap), `AlignedDiffRow`, `svelte/transition` (`fly`).
- Produces: `UnifiedView` with props:

  ```ts
  let {
    rows,
    activeDiffNavIdx,
    detectedLanguageLeft,
    detectedLanguageRight,
    searchQuery,
  }: {
    rows: AlignedDiffRow[];
    activeDiffNavIdx: number;
    detectedLanguageLeft: Lang;
    detectedLanguageRight: Lang;
    searchQuery: string;
  } = $props();
  ```

- [ ] **Step 1: Implement** — port `App.tsx:2387-2510`: single scroll container; `modify` rows render two stacked rows (delete then insert) inside one `id="diff-row-{idx}"` wrapper with `-`/`+` symbol columns and the rose/emerald palettes; `equal`/`delete`/`insert` render a single row with two line-number columns + symbol column + `<DiffLine>`. Replace `motion` with `transition:fly={{ y: 4, duration: reduceMotion ? 0 : 150 }}`. Keep classes.

- [ ] **Step 2: Verify** — `bun run check && bun run build` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/UnifiedView.svelte
git commit -m "feat: UnifiedView with stacked modify rows and transitions"
```

---

### Task 11: StatusFooter + EmptyState components

**Files:**

- Create: `src/lib/components/StatusFooter.svelte`
- Create: `src/lib/components/EmptyState.svelte`

**Interfaces:**

- Consumes: `@lucide/svelte` (`Clock`, `Sparkles`).
- Produces:
  - `StatusFooter` props: `{ additions: number; deletions: number; modifications: number; similarityPercentage: number; parseTimeMs: number }` — ported from `App.tsx:2519-2549` (insertions/deletions/modifications/congruency + `DIFF ALGORITHM: MYERS_OPTIMIZED_V2` + parse time).
  - `EmptyState` (no props) — ported from `App.tsx:2251-2260` (centered `Sparkles` + headings).

- [ ] **Step 1: Implement both** per the cited line ranges; keep classes.

- [ ] **Step 2: Verify** — `bun run check && bun run build` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/StatusFooter.svelte src/lib/components/EmptyState.svelte
git commit -m "feat: StatusFooter analytics bar and EmptyState"
```

---

### Task 12: ShortcutsModal (bits-ui dialog) + keyboard shortcuts action + export download

**Files:**

- Create: `src/lib/components/ShortcutsModal.svelte`
- Create: `src/lib/actions/shortcuts.ts`
- Create: `src/lib/export/download.ts`

**Interfaces:**

- Consumes: bits-ui `Dialog` (Task 3), `@lucide/svelte` (`Keyboard`).
- Produces:
  - `ShortcutsModal` props: `{ open = $bindable() }: { open: boolean }` — accessible dialog (focus trap + Escape come from bits-ui) listing the 9 shortcuts from `App.tsx:2574-2602`.
  - `shortcuts.ts`: `export function shortcuts(node, handlers: { onnext; onprev; onwrap; onlinenumbers; onhighlightmode; ontoggleshortcuts; onexporthtml; onclear; oncompare; onswap; onfocussearch }): { destroy }` — a Svelte action that ports the Alt-key map from `App.tsx:1326-1378` (same guard: Alt keys fire even inside inputs).
  - `download.ts`: `export function download(filename: string, content: string, mime: string): void` — the Blob/anchor logic from `App.tsx:1314-1322`.

- [ ] **Step 1: Implement `download.ts`** (Blob → object URL → temp `<a>` click → revoke), `shortcuts.ts` (window `keydown` action calling the handler map), and `ShortcutsModal.svelte` (bits-ui `Dialog.Root bind:open` with the shortcut list + close button).

- [ ] **Step 2: Verify** — `bun run check && bun run build` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ShortcutsModal.svelte src/lib/actions/shortcuts.ts src/lib/export/download.ts
git commit -m "feat: accessible shortcuts modal, keyboard action, download helper"
```

---

### Task 13: Compose the full app in +page.svelte (integration)

**Files:**

- Modify: `src/routes/+page.svelte` (replace the smoke page entirely)

**Interfaces:**

- Consumes: every component (Tasks 4–12), `settings` (Task 1), `diffLines`/`alignDiff` (`$lib/diff/engine`), `detectLanguage` (`$lib/diff/detect`), the export builders (`$lib/export`) + `download` (Task 12), `SAMPLES` (Task 5).
- Produces: the finished single-page app — feature-complete parity with `App.tsx`.

- [ ] **Step 1: Implement the page** — replicate the component-function logic of `App.tsx` at the page level using runes:
  - `let textLeft/textRight = $state('')`, `committedTextLeft/Right = $state('')`; `$effect` for auto-compare (port `App.tsx:569-574`); `isDirty` as `$derived` (line 577); `triggerCompare()` (579–582).
  - Diff `$derived.by` keyed on committed text + `settings.highlightMode` (port the `useMemo` at 669–714 → `{ alignedRows, additions, deletions, modifications, similarityPercentage, diffIndices, parseTimeMs }`).
  - `detectedLanguageLeft/Right` `$derived` (548–556) via `detectLanguage`/`settings.languageMode`.
  - `searchMatches` `$derived` (719–731); `searchQuery/activeSearchIdx/activeDiffNavIdx` `$state`; `jumpToSearchMatch` (733–753) and `jumpToDiff` (883–905) — keep the `getElementById('diff-row-'+idx).scrollIntoView` behavior.
  - Handlers: `loadSample` (920–927), `clearAll` (930–936), `swapTexts` (939–949), `exportReport(fmt)` → build via `$lib/export` builder + `download(...)` (replaces 1033–1323's download tail).
  - Theme `$effect` toggling `document.documentElement.classList` from `settings.theme` (port 589–596).
  - Scroll-sync handlers (644–666) wired to `SplitView`'s bound `leftScroll`/`rightScroll`.
  - `use:shortcuts={{...}}` on the page root (or `<svelte:window>`).
  - Layout: `<TopNav>`, editor grid with two `<EditorPane bind:value={textLeft|textRight} .../>`, `<ControlBar>`, `<AdvancedBar bind:searchQuery>`, then `{#if both empty}<EmptyState/>{:else if settings.compareMode==='split'}<SplitView/>{:else}<UnifiedView/>{/if}`, `<StatusFooter/>`, `<ShortcutsModal bind:open>`. Preserve the root/layout Tailwind classes from `App.tsx:1420-1422,1566-1567`.

- [ ] **Step 2: Verify type-check + build** — `bun run check && bun run build` → 0 errors, build OK.

- [ ] **Step 3: Full-app smoke** — `bun run dev`; `curl -s localhost:3000/` and confirm SSR contains the brand, both editor labels, and (with default empty text) the empty-state copy. Then load a sample programmatically is not possible via curl — instead set default `textLeft/textRight` temporarily? No: leave defaults empty (parity). Record that SSR renders nav + panes + empty state without error. Note: full interactive parity (typing → diff, toggles, shortcuts, export download, scroll sync) is validated by the Plan 3 Playwright suite. Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: compose full Juxta app with feature parity"
```

---

## Self-Review

**1. Spec coverage (feature-parity checklist §5 of the design spec):**

- Split & unified views → Tasks 9, 10. Scroll sync → Task 9 hooks + Task 13 wiring. ✓
- 5-language syntax highlighting + auto-detect → Task 8 (uses ported tokenizer/detect). ✓
- word/char inline diff → Task 8 (+ engine highlightMode). ✓
- search + next/prev nav → Task 7 + Task 13 `jumpToSearchMatch`. ✓
- whitespace/line-wrap/line-number toggles → Tasks 6, 8, 9, 10 (via settings). ✓
- soft/high-contrast schemes → Task 8 (segment colors) + Task 7 (selector). ✓
- per-side transforms (lowercase/sort/trim/replace-breaks) → Task 2 (pure) + Task 4 (UI). ✓
- swap / clear → Task 5 (buttons) + Task 13 (handlers). ✓
- 4-format export → Task 12 download + Task 13 wiring (builders already in `$lib/export`). ✓
- localStorage prefs → Task 1. ✓
- keyboard shortcuts + modal → Task 12. ✓
- sample loader → Task 5. ✓
- light/dark theme → Task 5 toggle + Task 13 effect. ✓
- stats (adds/dels/mods/similarity/parse time) → Task 11 footer + Task 13 derived; per-pane mini-stats → Task 4. ✓
- adaptive vs fixed-split layout → Tasks 6/7 (selector) + Tasks 9/10/13 (grid classes). ✓
- Deferred to Plan 3 (correctly out of this plan): a11y _refinement_ + audits, Playwright/axe, Docker, OSS docs, CI, removal of old React files.

**2. Placeholder scan:** No TBD/TODO. Component tasks cite exact `App.tsx` line ranges (the same verbatim-port pattern Plan 1 used successfully) and define each component's prop interface explicitly; pure-logic tasks embed full test code. The two genuinely-ambiguous CLI steps (Task 3 shadcn init, Task 4/8/13 smokes) give concrete commands + the Plan-1 "resolve version & report" latitude.

**3. Type consistency:** `settings` (Task 1) consumed by Tasks 4–13 by the same property names. `getStats`/`TextStats` (Task 2) → Task 4. Transform fn names (`toLowerCaseText`/`sortLines`/`removeExcessWhitespace`/`replaceLineBreaks`) consistent Task 2 ↔ Task 4. `DiffLine` props (Task 8) consumed by Tasks 9/10. `SplitView` `leftScroll`/`rightScroll` bindables (Task 9) wired in Task 13. `download(filename, content, mime)` (Task 12) called in Task 13. `SampleKey`/`SAMPLES` (Task 5) used in Task 13. Callback-prop names (`onloadsample`, `onjump`, `onsearchjump`, `oncompare`, `onexport`, etc.) consistent between producer and Task 13 consumer.

**4. Note on testing depth:** Per the design spec, runes/components are not unit-tested under `bun test` (compiler-dependent); Plan 2 verifies components via `svelte-check` + `build` + SSR curl smokes, and unit-tests only the pure modules (settings serialize/parse, stats, transforms). Full interactive + a11y verification is Plan 3's Playwright/axe suite. This is an intentional, spec-aligned coverage boundary, not a gap.
