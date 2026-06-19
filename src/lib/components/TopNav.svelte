<script lang="ts">
  import { settings } from '$lib/state/settings.svelte';
  import type { SampleKey } from '$lib/samples';
  import ArrowRightLeft from '@lucide/svelte/icons/arrow-right-left';
  import Code from '@lucide/svelte/icons/code';
  import FileText from '@lucide/svelte/icons/file-text';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Download from '@lucide/svelte/icons/download';
  import Keyboard from '@lucide/svelte/icons/keyboard';
  import Moon from '@lucide/svelte/icons/moon';
  import Sun from '@lucide/svelte/icons/sun';

  let { onloadsample, onclear, onswap, onexport, onshowshortcuts }: {
    onloadsample: (k: SampleKey) => void;
    onclear: () => void;
    onswap: () => void;
    onexport: (fmt: 'html' | 'md' | 'json' | 'txt') => void;
    onshowshortcuts: () => void;
  } = $props();
</script>

<nav class="flex items-center justify-between px-6 sm:px-8 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 dark:border-slate-800 dark:bg-slate-900/50">
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
      <ArrowRightLeft class="w-4 h-4 text-white" />
    </div>
    <span class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Juxta</span>
    <span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ml-2">v2.5.0</span>
  </div>

  <div class="flex items-center gap-3">
    <!-- Quick Load sample buttons -->
    <div class="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
      <button
        onclick={() => onloadsample('code')}
        class="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium rounded-md transition"
        id="load-sample-code"
        title="Load TypeScript demonstration sample code"
      >
        <Code class="w-3.5 h-3.5 text-indigo-500" />
        <span>TS Code</span>
      </button>
      <button
        onclick={() => onloadsample('html')}
        class="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium rounded-md transition"
        id="load-sample-html"
        title="Load HTML demonstration document"
      >
        <FileText class="w-3.5 h-3.5 text-orange-500" />
        <span>HTML</span>
      </button>
      <button
        onclick={() => onloadsample('css')}
        class="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium rounded-md transition"
        id="load-sample-css"
        title="Load CSS stylesheet demonstration"
      >
        <Sparkles class="w-3.5 h-3.5 text-pink-500" />
        <span>CSS</span>
      </button>
      <button
        onclick={() => onloadsample('json')}
        class="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium rounded-md transition"
        id="load-sample-json"
        title="Load JSON configuration file"
      >
        <FileText class="w-3.5 h-3.5 text-emerald-500" />
        <span>JSON</span>
      </button>
      <button
        onclick={() => onloadsample('prose')}
        class="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium rounded-md transition"
        id="load-sample-prose"
        title="Load general editorial prose text"
      >
        <BookOpen class="w-3.5 h-3.5 text-sky-500" />
        <span>Prose</span>
      </button>
    </div>

    <button
      onclick={onclear}
      class="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium transition-all"
      id="btn-clear-all"
      aria-label="Clear Areas"
    >
      <Trash2 class="w-3.5 h-3.5" />
      <span class="hidden xs:inline">Clear Areas</span>
    </button>

    <button
      onclick={onswap}
      class="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/45 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-md text-sm font-medium transition-all"
      id="btn-swap-fields"
      title="Swap text layout fields (Alt + X)"
    >
      <ArrowRightLeft class="w-3.5 h-3.5" />
      <span>Swap Fields</span>
    </button>

    <div class="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

    <!-- Export suite -->
    <div class="flex items-center gap-1">
      <button
        onclick={() => onexport('html')}
        class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/45 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-l-md text-xs font-semibold transition shadow-sm border-y border-l border-indigo-200 dark:border-indigo-900/40"
        id="btn-export-report-html"
        title="Export HTML comparison report (Alt + E)"
      >
        <Download class="w-3.5 h-3.5" />
        <span>HTML</span>
      </button>
      <button
        onclick={() => onexport('md')}
        class="flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-705 dark:text-slate-300 border-y border-r border-slate-200 dark:border-slate-720 text-xs font-semibold transition"
        id="btn-export-report-md"
        title="Export Markdown comprehensive comparison report"
      >
        <Sparkles class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300" />
        <span>MD</span>
      </button>
      <button
        onclick={() => onexport('json')}
        class="flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-705 dark:text-slate-300 border-y border-r border-slate-200 dark:border-slate-720 text-xs font-semibold transition"
        id="btn-export-report-json"
        title="Export JSON structured diff data"
      >
        <FileText class="w-3.5 h-3.5 text-emerald-500" />
        <span>JSON</span>
      </button>
      <button
        onclick={() => onexport('txt')}
        class="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-r-md text-xs font-semibold transition border-y border-r border-slate-200 dark:border-slate-700"
        id="btn-export-report-txt"
        title="Export Plain Text comparison report"
      >
        <FileText class="w-3.5 h-3.5 text-amber-500" />
        <span>TXT</span>
      </button>
    </div>

    <div class="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

    <button
      onclick={onshowshortcuts}
      class="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
      title="Keyboard Shortcuts Guide (Alt + K)"
      aria-label="Keyboard Shortcuts Guide"
      id="btn-keyboard-guide"
    >
      <Keyboard class="w-5 h-5" />
    </button>

    <button
      onclick={() => settings.theme = settings.theme === 'dark' ? 'light' : 'dark'}
      class="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
      title="Toggle Accessibility dark mode"
      aria-label={settings.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      id="theme-toggler"
    >
      {#if settings.theme === 'light'}
        <Moon class="w-5 h-5" />
      {:else}
        <Sun class="w-5 h-5" />
      {/if}
    </button>
  </div>
</nav>
