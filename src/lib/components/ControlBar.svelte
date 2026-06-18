<script lang="ts">
  import { settings } from '$lib/state/settings.svelte';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import Rows2 from '@lucide/svelte/icons/rows-2';
  import WrapText from '@lucide/svelte/icons/wrap-text';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  let { diffIndices, activeDiffNavIdx, onjump }: {
    diffIndices: number[];
    activeDiffNavIdx: number;
    onjump: (dir: 'next' | 'prev') => void;
  } = $props();
</script>

<div class="bg-slate-50 border-b border-slate-250 dark:bg-slate-950 dark:border-slate-850 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
  <div class="flex flex-wrap items-center gap-4">

    <!-- Layout view settings split/unified -->
    <div class="flex items-center bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
      <button
        onclick={() => settings.compareMode = 'split'}
        class={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
          settings.compareMode === 'split'
            ? 'bg-white shadow text-slate-900 dark:bg-slate-800 dark:text-white'
            : 'text-slate-550 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
        id="opt-split-mode"
      >
        <Columns2 class="w-3.5 h-3.5" />
        <span>Side-by-Side</span>
      </button>
      <button
        onclick={() => settings.compareMode = 'unified'}
        class={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
          settings.compareMode === 'unified'
            ? 'bg-white shadow text-slate-900 dark:bg-slate-800 dark:text-white'
            : 'text-slate-550 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
        id="opt-unified-mode"
      >
        <Rows2 class="w-3.5 h-3.5" />
        <span>Unified View</span>
      </button>
    </div>

    <!-- Synchronized scroll -->
    <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer">
      <input
        type="checkbox"
        checked={settings.syncScroll}
        onchange={(e) => settings.syncScroll = e.currentTarget.checked}
        class="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
      />
      <span>Synchronized Scroll</span>
    </label>

    <!-- Whitespace display indicator -->
    <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer">
      <input
        type="checkbox"
        checked={settings.showWhitespace}
        onchange={(e) => settings.showWhitespace = e.currentTarget.checked}
        class="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
      />
      <span>Show Whitespace (·)</span>
    </label>

    <!-- Line numbers display toggle -->
    <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer" id="opt-line-numbers">
      <input
        type="checkbox"
        checked={settings.showLineNumbers}
        onchange={(e) => settings.showLineNumbers = e.currentTarget.checked}
        class="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
      />
      <span>Show Line Numbers</span>
    </label>

    <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block"></div>

    <!-- Line wrap toggle -->
    <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer" id="opt-line-wrap">
      <input
        type="checkbox"
        checked={settings.lineWrap}
        onchange={(e) => settings.lineWrap = e.currentTarget.checked}
        class="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
      />
      <span class="flex items-center gap-1">
        <WrapText class="w-3.5 h-3.5" />
        Wrap Lines
      </span>
    </label>

    <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block"></div>

    <!-- Highlight Mode selection -->
    <div class="flex items-center bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
      <button
        onclick={() => settings.highlightMode = 'word'}
        class={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all duration-150 ${
          settings.highlightMode === 'word'
            ? 'bg-white shadow text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
            : 'text-slate-550 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white'
        }`}
        id="opt-highlight-word"
        title="Highlight modified code word-by-word"
      >
        Word diff
      </button>
      <button
        onclick={() => settings.highlightMode = 'char'}
        class={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all duration-150 ${
          settings.highlightMode === 'char'
            ? 'bg-white shadow text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
            : 'text-slate-550 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white'
        }`}
        id="opt-highlight-char"
        title="Highlight modified code character-by-character"
      >
        Char diff
      </button>
    </div>
  </div>

  <!-- Diff navigators -->
  {#if diffIndices.length > 0}
    <div class="flex items-center gap-3">
      <span class="text-[11px] font-mono text-slate-400 dark:text-slate-550 uppercase tracking-wider">
        {activeDiffNavIdx !== -1 ? diffIndices.indexOf(activeDiffNavIdx) + 1 : 0} of {diffIndices.length} differences
      </span>
      <div class="flex items-center gap-1">
        <button
          onclick={() => onjump('prev')}
          class="p-1.5 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 rounded transition"
          title="Jump to previous difference"
          id="btn-prev-diff"
        >
          <ChevronUp class="w-4 h-4" />
        </button>
        <button
          onclick={() => onjump('next')}
          class="p-1.5 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 rounded transition"
          title="Jump to next difference"
          id="btn-next-diff"
        >
          <ChevronDown class="w-4 h-4" />
        </button>
      </div>
    </div>
  {/if}
</div>
