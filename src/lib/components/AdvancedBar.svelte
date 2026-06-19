<script lang="ts">
  import { settings } from '$lib/state/settings.svelte';
  import Search from '@lucide/svelte/icons/search';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import Code from '@lucide/svelte/icons/code';

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
    onsearchjump: (dir: 'next' | 'prev') => void;
    onclearsearch: () => void;
    oncompare: () => void;
  } = $props();
</script>

<div class="bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-250 dark:border-slate-850 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
  <!-- Search tool block -->
  <div class="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
    <div class="relative w-full">
      <span class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
        <Search class="w-4 h-4" />
      </span>
      <input
        type="text"
        bind:value={searchQuery}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
              onsearchjump('prev');
            } else {
              onsearchjump('next');
            }
          }
        }}
        placeholder="Search matches... (Enter for Next, Shift+Enter for Prev)"
        class="w-full pl-9 pr-24 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500"
        id="search-diff-input"
      />
      {#if searchQuery}
        <span class="absolute inset-y-0 right-2 flex items-center gap-1.5 pr-1 select-none pointer-events-auto">
          <span class="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            {searchMatches.length > 0 ? `${activeSearchIdx + 1}/${searchMatches.length}` : '0/0'}
          </span>
          <button
            onclick={() => onclearsearch()}
            class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-semibold px-1"
            title="Clear search"
            aria-label="Clear search"
          >
            ✕
          </button>
        </span>
      {/if}
    </div>

    {#if searchMatches.length > 0}
      <div class="flex items-center gap-1 shrink-0">
        <button
          onclick={() => onsearchjump('prev')}
          class="p-1 text-slate-500 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded transition"
          title="Previous match"
          aria-label="Previous match"
        >
          <ChevronUp class="w-3.5 h-3.5" />
        </button>
        <button
          onclick={() => onsearchjump('next')}
          class="p-1 text-slate-500 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded transition"
          title="Next match"
          aria-label="Next match"
        >
          <ChevronDown class="w-3.5 h-3.5" />
        </button>
      </div>
    {/if}
  </div>

  <!-- Feature toggles -->
  <div class="flex flex-wrap items-center gap-4">

    <!-- Syntax Highlighting toggle -->
    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer" id="opt-syntax-highlight">
        <input
          type="checkbox"
          checked={settings.syntaxHighlighting}
          onchange={(e) => settings.syntaxHighlighting = e.currentTarget.checked}
          class="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
        />
        <span class="flex items-center gap-1">
          <Code class="w-3.5 h-3.5 text-indigo-500" />
          Syntax Highlight
        </span>
      </label>

      {#if settings.syntaxHighlighting}
        <div class="flex flex-wrap items-center gap-2.5 pl-3 border-l border-slate-250 dark:border-slate-800">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Lang:</span>
            <select
              value={settings.languageMode}
              onchange={(e) => settings.languageMode = e.currentTarget.value as 'auto' | 'ts' | 'html' | 'css' | 'json'}
              class="px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer shadow-sm text-[11px]"
              id="opt-language-mode"
            >
              <option value="auto">Auto-Detect</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="ts">JS / TS / Java</option>
            </select>
            {#if settings.languageMode === 'auto'}
              <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-200/50 dark:bg-slate-900 px-1.5 py-0.5 rounded italic">
                active: {detectedLanguageLeft.toUpperCase()}
              </span>
            {/if}
          </div>

          <div class="hidden sm:block h-3.5 w-px bg-slate-250 dark:bg-slate-800"></div>

          <div class="flex items-center gap-1.5">
            <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Scheme:</span>
            <select
              value={settings.syntaxScheme}
              onchange={(e) => settings.syntaxScheme = e.currentTarget.value as 'high-contrast' | 'soft'}
              class="px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer shadow-sm text-[11px]"
              id="opt-syntax-scheme"
            >
              <option value="high-contrast">High Contrast</option>
              <option value="soft">Soft</option>
            </select>
          </div>
        </div>
      {/if}
    </div>

    <div class="h-4 w-px bg-slate-250 dark:bg-slate-800"></div>

    <!-- Responsive Layout selection -->
    <div class="flex items-center gap-1.5">
      <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
        Layout:
      </span>
      <div class="flex items-center bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
        <button
          onclick={() => settings.responsiveLayout = 'adaptive'}
          class={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all duration-150 ${
            settings.responsiveLayout === 'adaptive'
              ? 'bg-white shadow text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
              : 'text-slate-550 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white'
          }`}
          id="opt-layout-adaptive"
          title="Line stack vertically on mobile viewports"
        >
          Auto Stack
        </button>
        <button
          onclick={() => settings.responsiveLayout = 'fixed-split'}
          class={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all duration-150 ${
            settings.responsiveLayout === 'fixed-split'
              ? 'bg-white shadow text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
              : 'text-slate-550 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white'
          }`}
          id="opt-layout-fixed"
          title="Force side-by-side columns on mobile viewport with scroll"
        >
          Force Split
        </button>
      </div>
    </div>

    <div class="h-4 w-px bg-slate-250 dark:bg-slate-800"></div>

    <!-- Auto Compare toggle -->
    <div class="flex items-center gap-3">
      <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer" id="opt-auto-compare">
        <input
          type="checkbox"
          checked={settings.autoCompare}
          onchange={(e) => settings.autoCompare = e.currentTarget.checked}
          class="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
        />
        <span class="flex items-center gap-1">
          Auto-Compare
        </span>
      </label>

      {#if !settings.autoCompare}
        <button
          onclick={() => oncompare()}
          class={`flex items-center gap-1 py-1 px-2.5 rounded-md text-xs font-bold transition-all ${
            isDirty
              ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
              : 'bg-slate-250 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          id="btn-run-manual-compare"
          title="Trigger text diff matching comparison manually (Alt + Enter)"
        >
          <RefreshCw class="w-3 h-3" />
          <span>Compare Now</span>
          {#if isDirty}
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-1"></span>
          {/if}
        </button>
      {/if}
    </div>

  </div>
</div>
