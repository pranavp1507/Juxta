<script lang="ts">
  import { fly } from 'svelte/transition';
  import DiffLine from '$lib/components/DiffLine.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import type { AlignedDiffRow } from '$lib/diff/engine';
  import type { Lang } from '$lib/diff/tokenizer';

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

  // ── Reduced-motion ────────────────────────────────────────────────────────────
  // `prefersReducedMotion` is not exported from svelte/motion in Svelte 5.56.3,
  // so we fall back to a local $state backed by window.matchMedia.
  let reduceMotion: boolean = $state(false);

  $effect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotion = mq.matches;
    const handler = (e: MediaQueryListEvent) => { reduceMotion = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });

  // ── Derived helpers ───────────────────────────────────────────────────────────

  const wrapClass = $derived(
    settings.lineWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
  );
</script>

<div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl">
  <div class="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase select-none flex justify-between">
    <span>Unified/Inline Chronological View</span>
    <span class="font-mono text-[10px] tracking-wider text-indigo-600 uppercase">Interactive Stack</span>
  </div>
<div class="overflow-auto max-h-[600px] bg-slate-50/50 dark:bg-slate-950/20">
  <table class="w-full border-collapse table-fixed">
    {#each rows as row, idx (idx)}
      {@const isRowNavHighlight = idx === activeDiffNavIdx}

      {#if row.type === 'modify'}
        <!-- modify: two stacked rows (delete then insert) grouped in a tbody wrapper -->
        <tbody
          id="diff-row-{idx}"
          class={isRowNavHighlight ? 'ring-2 ring-indigo-500/80 ring-inset' : ''}
          transition:fly={{ y: 4, duration: reduceMotion ? 0 : 150 }}
        >
          <!-- Original Line deletion -->
          <tr class="font-mono text-xs leading-6 bg-rose-50/40 border-l-[3px] border-rose-500/70 dark:bg-rose-950/10 border-b border-slate-100/50 dark:border-slate-900/10">
            {#if settings.showLineNumbers}
              <td class="w-12 text-right pr-2 select-none text-[10px] text-slate-600 dark:text-slate-400 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35">
                {row.leftLineNum}
              </td>
              <td class="w-12 text-right pr-2 select-none text-[10px] text-rose-500 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35">
                -
              </td>
            {/if}
            <td class={`pl-4 pr-2 ${wrapClass} align-top text-rose-900 dark:text-rose-450 pt-1 text-[12.5px]`} tabindex={settings.lineWrap ? undefined : 0}>
              <DiffLine
                text={row.leftContent}
                rowType="delete"
                side="left"
                words={row.leftWords}
                lang={detectedLanguageLeft}
                {searchQuery}
              />
            </td>
          </tr>

          <!-- Target Line insertion -->
          <tr class="font-mono text-xs leading-6 bg-emerald-50/40 border-l-[3px] border-emerald-500/70 dark:bg-emerald-950/10 border-b border-slate-100/50 dark:border-slate-900/10">
            {#if settings.showLineNumbers}
              <td class="w-12 text-right pr-2 select-none text-[10px] text-emerald-500 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35">
                +
              </td>
              <td class="w-12 text-right pr-2 select-none text-[10px] text-slate-600 dark:text-slate-400 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35">
                {row.rightLineNum}
              </td>
            {/if}
            <td class={`pl-4 pr-2 ${wrapClass} align-top text-emerald-900 dark:text-emerald-450 pt-1 text-[12.5px]`} tabindex={settings.lineWrap ? undefined : 0}>
              <DiffLine
                text={row.rightContent}
                rowType="insert"
                side="right"
                words={row.rightWords}
                lang={detectedLanguageRight}
                {searchQuery}
              />
            </td>
          </tr>
        </tbody>

      {:else}
        <!-- equal / delete / insert: single row with two line-number columns + symbol + content -->
        {@const isDelete = row.type === 'delete'}
        {@const isInsert = row.type === 'insert'}
        {@const textClass = isDelete
          ? 'text-rose-900 dark:text-rose-450'
          : isInsert
            ? 'text-emerald-900 dark:text-emerald-450'
            : 'text-slate-705 dark:text-slate-350'}
        {@const bgClass = isDelete
          ? 'bg-rose-50/40 border-l-[3px] border-rose-500/70 dark:bg-rose-950/10'
          : isInsert
            ? 'bg-emerald-50/40 border-l-[3px] border-emerald-500/70 dark:bg-emerald-950/10'
            : 'bg-transparent'}
        {@const symbol = isDelete ? '-' : isInsert ? '+' : ' '}
        {@const leftNum = isInsert ? '' : (row.leftLineNum ?? '')}
        {@const rightNum = isDelete ? '' : (row.rightLineNum ?? '')}
        {@const useLeft = row.leftContent !== undefined}
        <tbody>
          <tr
            id="diff-row-{idx}"
            class={`font-mono text-xs leading-6 border-b border-slate-100/55 dark:border-slate-850/10 ${bgClass} ${isRowNavHighlight ? 'ring-2 ring-indigo-500/80 ring-inset' : ''}`}
            transition:fly={{ y: 4, duration: reduceMotion ? 0 : 150 }}
          >
            {#if settings.showLineNumbers}
              <td class="w-12 text-right pr-2 select-none text-[10px] text-slate-600 dark:text-slate-400 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35 pt-1">
                {leftNum}
              </td>
              <td class="w-12 text-right pr-2 select-none text-[10px] text-slate-600 dark:text-slate-400 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35 pt-1">
                {rightNum}
              </td>
            {/if}
            <td class="w-8 text-center select-none font-bold font-mono text-[11px] opacity-40 text-slate-500 dark:text-slate-400 align-top pt-1">
              {symbol}
            </td>
            <td class={`pl-4 pr-2 ${wrapClass} align-top ${textClass} pt-1 text-[12.5px]`} tabindex={settings.lineWrap ? undefined : 0}>
              <DiffLine
                text={useLeft ? row.leftContent : row.rightContent}
                rowType={row.type}
                side={useLeft ? 'left' : 'right'}
                words={useLeft ? row.leftWords : row.rightWords}
                lang={useLeft ? detectedLanguageLeft : detectedLanguageRight}
                {searchQuery}
              />
            </td>
          </tr>
        </tbody>
      {/if}
    {/each}
  </table>
</div>
</div>
