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

  const gridClass = $derived(
    settings.responsiveLayout === 'adaptive'
      ? 'grid-cols-1 lg:grid-cols-2'
      : 'grid-cols-2 min-w-[760px] lg:min-w-0'
  );

  const wrapClass = $derived(
    settings.lineWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
  );

  function leftBgClass(type: AlignedDiffRow['type']): string {
    if (type === 'delete') return 'bg-rose-50/70 border-l-[3px] border-rose-500 dark:bg-rose-950/20';
    if (type === 'modify') return 'bg-rose-500/5 border-l-[3px] border-rose-400/70 dark:bg-rose-950/10';
    if (type === 'insert') return 'bg-slate-100/30 dark:bg-slate-900/30 opacity-30';
    return 'bg-transparent';
  }

  function rightBgClass(type: AlignedDiffRow['type']): string {
    if (type === 'insert') return 'bg-emerald-50/60 border-l-[3px] border-emerald-500 dark:bg-emerald-950/20';
    if (type === 'modify') return 'bg-emerald-500/5 border-l-[3px] border-emerald-400/70 dark:bg-emerald-950/10';
    if (type === 'delete') return 'bg-slate-100/30 dark:bg-slate-900/30 opacity-30';
    return 'bg-transparent';
  }
</script>

<div class="overflow-x-auto w-full">
  <div class={`grid ${gridClass} gap-0 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl`}>

    <!-- Left side (Source Document) Scroll box -->
    <div class="flex flex-col border-r border-slate-200 dark:border-slate-800">
      <div class="px-4 py-2 bg-slate-100/50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-805 text-xs font-semibold text-slate-500 uppercase select-none flex items-center justify-between">
        <span>Source Diff (Original)</span>
        <span class="font-mono text-[10px] text-slate-400">OLD</span>
      </div>
      <div
        bind:this={leftScroll}
        class="overflow-auto max-h-[550px] min-h-[400px] bg-slate-50/50 dark:bg-slate-950/20"
      >
        <table class="w-full border-collapse table-fixed">
          <tbody>
            {#each rows as row, idx (idx)}
              {@const bgClass = leftBgClass(row.type)}
              {@const isActive = idx === activeDiffNavIdx}
              <tr
                id="diff-row-{idx}"
                class={`group font-mono text-xs leading-6 border-b border-slate-100/40 dark:border-slate-850/20 ${bgClass} ${isActive ? 'ring-2 ring-indigo-500/70 ring-inset' : ''}`}
                transition:fly={{ x: -6, duration: reduceMotion ? 0 : 150 }}
              >
                {#if settings.showLineNumbers}
                  <td class="w-12 text-right pr-2 select-none text-[10px] text-slate-400 dark:text-slate-550 border-r border-slate-200/50 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-900/30 align-top pt-1">
                    {row.leftLineNum ?? ''}
                  </td>
                {/if}
                <td class={`pl-4 pr-2 ${wrapClass} align-top text-[12.5px] pt-1`}>
                  <DiffLine
                    text={row.leftContent}
                    rowType={row.type}
                    side="left"
                    words={row.leftWords}
                    lang={detectedLanguageLeft}
                    {searchQuery}
                  />
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Right side (Modified Output) Scroll box -->
    <div class="flex flex-col">
      <div class="px-4 py-2 bg-slate-100/50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-805 text-xs font-semibold text-slate-500 uppercase select-none flex items-center justify-between">
        <span>Target Output Diff</span>
        <span class="font-mono text-[10px] text-emerald-400 font-bold">NEW</span>
      </div>
      <div
        bind:this={rightScroll}
        class="overflow-auto max-h-[550px] min-h-[400px] bg-slate-50/50 dark:bg-slate-950/20"
      >
        <table class="w-full border-collapse table-fixed">
          <tbody>
            {#each rows as row, idx (idx)}
              {@const bgClass = rightBgClass(row.type)}
              {@const isActive = idx === activeDiffNavIdx}
              <tr
                class={`group font-mono text-xs leading-6 border-b border-slate-100/40 dark:border-slate-850/20 ${bgClass} ${isActive ? 'ring-2 ring-indigo-500/70 ring-inset' : ''}`}
                transition:fly={{ x: 6, duration: reduceMotion ? 0 : 150 }}
              >
                {#if settings.showLineNumbers}
                  <td class="w-12 text-right pr-2 select-none text-[10px] text-slate-400 dark:text-slate-550 border-r border-slate-200/50 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-900/30 align-top pt-1">
                    {row.rightLineNum ?? ''}
                  </td>
                {/if}
                <td class={`pl-4 pr-2 ${wrapClass} align-top text-[12.5px] pt-1`}>
                  <DiffLine
                    text={row.rightContent}
                    rowType={row.type}
                    side="right"
                    words={row.rightWords}
                    lang={detectedLanguageRight}
                    {searchQuery}
                  />
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

  </div>
</div>
