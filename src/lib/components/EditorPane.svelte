<script lang="ts">
  import Copy from '@lucide/svelte/icons/copy';
  import Check from '@lucide/svelte/icons/check';
  import Clock from '@lucide/svelte/icons/clock';
  import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
  import { getStats } from '$lib/text/stats';
  import {
    toLowerCaseText,
    sortLines,
    removeExcessWhitespace,
    replaceLineBreaks
  } from '$lib/text/transforms';

  let { value = $bindable(), side, label, dotClass, placeholder, emptyHint }: {
    value: string;
    side: 'left' | 'right';
    label: string;
    dotClass: string;
    placeholder: string;
    emptyHint: string;
  } = $props();

  // Ephemeral UI state
  let copied = $state(false);
  let showReplace = $state(false);
  let replaceSep = $state(', ');

  const stats = $derived(getStats(value));

  const presets = [
    { label: 'Comma', val: ', ' },
    { label: 'Space', val: 'space' },
    { label: 'Tab', val: '\\t' },
    { label: 'Pipe', val: ' | ' },
    { label: 'Hyphen', val: ' - ' },
    { label: 'Semicolon', val: '; ' }
  ];

  function copyText() {
    navigator.clipboard.writeText(value);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }

  function applyReplace() {
    value = replaceLineBreaks(value, replaceSep);
    showReplace = false;
  }
</script>

<div class="flex flex-col border-r border-slate-200 dark:border-slate-800">
  <!-- Header bar -->
  <div class="flex items-center justify-between px-6 py-3 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:bg-slate-800/30 dark:border-slate-800">
    <span class="flex items-center gap-2 text-slate-700 dark:text-slate-400">
      <span class="w-2 h-2 rounded-full {dotClass}"></span>
      {label}
    </span>
    <span class="font-mono text-[11px] text-slate-400 lowercase">Active Workspace</span>
  </div>

  <!-- Mini-Stats Badges Row -->
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-6 py-2 bg-slate-100/30 border-b border-slate-200 dark:bg-slate-900/20 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium" id="stats-bar-{side}">
    <span class="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350">
      <span class="font-semibold text-slate-800 dark:text-slate-200">{stats.lines}</span> lines
    </span>
    <span class="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350" id="{side}-stat-words">
      <span class="font-semibold text-slate-800 dark:text-slate-200">{stats.words}</span> words
    </span>
    <span class="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350">
      <span class="font-semibold text-slate-800 dark:text-slate-200">{stats.chars}</span> chars ({stats.nonSpaceChars} visible)
    </span>
    <span class="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350" title="Expected reading duration at an average rate of 200 words per minute">
      <Clock class="w-3 h-3 text-slate-400 dark:text-slate-500" />
      <span>{stats.readingTime} read time</span>
    </span>
    <span class="flex items-center gap-1 bg-indigo-50/50 border border-indigo-100/45 dark:bg-indigo-950/20 dark:border-indigo-900/30 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-300" title="Average Word Length: {stats.charsPerWord} letters (Excluding whitespaces). Text contains {stats.densityPct}% dense non-whitespace content.">
      <BarChart3 class="w-3 h-3 text-indigo-400 dark:text-indigo-500" />
      <span>Density: <strong class="font-bold">{stats.charsPerWord}</strong> c/w ({stats.densityPct}%)</span>
    </span>
  </div>

  <!-- Text Operations Bar -->
  <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800" id="{side}-text-operations-bar">
    <div class="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onclick={() => { value = toLowerCaseText(value); }}
        class="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition shadow-2xs"
        id="btn-lowercase-{side}"
        title="Convert all text to lowercase"
      >
        a-z lowercase
      </button>
      <button
        type="button"
        onclick={() => { value = sortLines(value); }}
        class="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition shadow-2xs"
        id="btn-sort-{side}"
        title="Sort lines alphabetically"
      >
        Sort Lines
      </button>
      <button
        type="button"
        onclick={() => { value = removeExcessWhitespace(value); }}
        class="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition shadow-2xs"
        id="btn-whitespace-{side}"
        title="Remove excess white space & normalize lines"
      >
        Trim Workspace
      </button>

      <!-- Replace Line Breaks -->
      <div class="relative inline-block text-left">
        <button
          onclick={() => { showReplace = !showReplace; }}
          class="px-2 py-1 text-[11px] font-medium rounded border transition shadow-2xs {showReplace ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}"
          id="btn-replace-breaks-{side}"
          title="Replace line breaks with other characters"
        >
          Replace Line Breaks
        </button>

        {#if showReplace}
          <div class="absolute left-0 mt-1.5 w-60 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30">
            <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Replace line breaks with:</p>
            <div class="grid grid-cols-3 gap-1 mb-2">
              {#each presets as preset}
                <button
                  onclick={() => { replaceSep = preset.val; }}
                  type="button"
                  class="px-1.5 py-1 text-[10px] rounded border text-center transition {replaceSep === preset.val ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300' : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}"
                >
                  {preset.label}
                </button>
              {/each}
            </div>
            <div class="mb-2">
              <label for="replace-sep-input-{side}" class="block text-[9px] font-semibold text-slate-400 dark:text-slate-500 mb-1">Custom String:</label>
              <input
                type="text"
                id="replace-sep-input-{side}"
                value={replaceSep === 'space' || replaceSep === '\\t' ? '' : replaceSep}
                oninput={(e) => { replaceSep = (e.target as HTMLInputElement).value; }}
                placeholder="e.g. , "
                class="w-full px-2 py-1 text-xs bg-slate-50 text-slate-800 dark:text-slate-200 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div class="flex gap-1.5 justify-end mt-2">
              <button
                onclick={() => { showReplace = false; }}
                type="button"
                class="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onclick={applyReplace}
                type="button"
                class="px-2 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
              >
                Apply
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Textarea area -->
  <div class="flex-1 min-h-[220px] relative">
    <textarea
      bind:value
      class="absolute inset-0 w-full h-full p-6 bg-transparent text-slate-800 dark:text-slate-300 font-mono text-sm leading-relaxed focus:outline-none resize-none overflow-y-auto placeholder-slate-400 dark:placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/10"
      {placeholder}
      id="{side}-textarea"
    ></textarea>

    {#if value === ''}
      <div class="absolute bottom-6 right-6 flex items-center gap-2 pointer-events-none select-none">
        <span class="text-[11px] font-mono text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-950/40 px-2 py-1 rounded">
          {emptyHint}
        </span>
      </div>
    {/if}

    {#if value !== ''}
      <button
        type="button"
        onclick={copyText}
        class="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-755 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded transition"
        title="Copy input text"
        aria-label="Copy input text"
      >
        {#if copied}
          <Check class="w-3.5 h-3.5 text-emerald-500" />
        {:else}
          <Copy class="w-3.5 h-3.5" />
        {/if}
      </button>
    {/if}
  </div>
</div>
