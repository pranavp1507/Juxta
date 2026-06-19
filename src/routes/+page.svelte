<script lang="ts">
  import { settings } from '$lib/state/settings.svelte';
  import { diffLines, alignDiff } from '$lib/diff/engine';
  import { detectLanguage } from '$lib/diff/detect';
  import type { Lang } from '$lib/diff/tokenizer';
  import { SAMPLES } from '$lib/samples';
  import type { SampleKey } from '$lib/samples';
  import { shortcuts } from '$lib/actions/shortcuts';
  import {
    buildTxtReport,
    buildMdReport,
    buildJsonReport,
    buildHtmlReport,
  } from '$lib/export';
  import { download } from '$lib/export/download';
  import TopNav from '$lib/components/TopNav.svelte';
  import EditorPane from '$lib/components/EditorPane.svelte';
  import ControlBar from '$lib/components/ControlBar.svelte';
  import AdvancedBar from '$lib/components/AdvancedBar.svelte';
  import SplitView from '$lib/components/SplitView.svelte';
  import UnifiedView from '$lib/components/UnifiedView.svelte';
  import StatusFooter from '$lib/components/StatusFooter.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import ShortcutsModal from '$lib/components/ShortcutsModal.svelte';

  // ── Core text state ────────────────────────────────────────────────────────────
  let textLeft = $state('');
  let textRight = $state('');
  let committedTextLeft = $state('');
  let committedTextRight = $state('');

  // ── Auto-compare effect (App.tsx:569-574) ─────────────────────────────────────
  $effect(() => {
    if (settings.autoCompare) {
      committedTextLeft = textLeft;
      committedTextRight = textRight;
    }
  });

  // ── Dirty flag (App.tsx:577) ───────────────────────────────────────────────────
  const isDirty = $derived(
    textLeft !== committedTextLeft || textRight !== committedTextRight
  );

  // ── Manual compare trigger (App.tsx:579-582) ──────────────────────────────────
  function triggerCompare() {
    committedTextLeft = textLeft;
    committedTextRight = textRight;
  }

  // ── Language detection (App.tsx:548-556) ──────────────────────────────────────
  const detectedLanguageLeft = $derived<Lang>(
    settings.languageMode !== 'auto' ? settings.languageMode : detectLanguage(textLeft)
  );
  const detectedLanguageRight = $derived<Lang>(
    settings.languageMode !== 'auto' ? settings.languageMode : detectLanguage(textRight)
  );

  // ── Theme effect (App.tsx:589-596) ────────────────────────────────────────────
  $effect(() => {
    if (typeof document === 'undefined') return;
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  // ── Diff derived (App.tsx:669-714) ────────────────────────────────────────────
  const diffData = $derived.by(() => {
    const start = (typeof performance !== 'undefined') ? performance.now() : 0;

    const linesLeft = committedTextLeft.split(/\r?\n/);
    const linesRight = committedTextRight.split(/\r?\n/);

    const ops = diffLines(linesLeft, linesRight);
    const alignedRows = alignDiff(ops, settings.highlightMode);

    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    let identicals = 0;

    for (const row of alignedRows) {
      if (row.type === 'equal') identicals++;
      else if (row.type === 'delete') deletions++;
      else if (row.type === 'insert') additions++;
      else if (row.type === 'modify') modifications++;
    }

    const totalRowsCount = alignedRows.length;
    const maxLinesCount = Math.max(linesLeft.length, linesRight.length);
    let similarityPercentage = 100;
    if (maxLinesCount > 0) {
      similarityPercentage = totalRowsCount > 0
        ? Math.round((identicals / totalRowsCount) * 100)
        : 100;
    }

    const diffIndices = alignedRows
      .map((row, idx) => (row.type !== 'equal' ? idx : -1))
      .filter(idx => idx !== -1);

    const end = (typeof performance !== 'undefined') ? performance.now() : 0;
    const parseTimeMs = parseFloat((end - start).toFixed(1));

    return {
      alignedRows,
      additions,
      deletions,
      modifications,
      similarityPercentage,
      diffIndices,
      parseTimeMs,
    };
  });

  // ── Search state (App.tsx:505-506) ────────────────────────────────────────────
  let searchQuery = $state('');
  let activeSearchIdx = $state(-1);
  let activeDiffNavIdx = $state(-1);

  // ── Search matches (App.tsx:719-731) ──────────────────────────────────────────
  const searchMatches = $derived.by(() => {
    if (!searchQuery) return [] as number[];
    const lowerQuery = searchQuery.toLowerCase();
    const indices: number[] = [];
    diffData.alignedRows.forEach((row, idx) => {
      const leftMatch = row.leftContent !== undefined && row.leftContent.toLowerCase().includes(lowerQuery);
      const rightMatch = row.rightContent !== undefined && row.rightContent.toLowerCase().includes(lowerQuery);
      if (leftMatch || rightMatch) indices.push(idx);
    });
    return indices;
  });

  // ── Scroll refs (bound from SplitView) ────────────────────────────────────────
  let leftScroll = $state<HTMLDivElement | undefined>(undefined);
  let rightScroll = $state<HTMLDivElement | undefined>(undefined);

  // ── Scroll sync (App.tsx:644-666) ─────────────────────────────────────────────
  $effect(() => {
    const l = leftScroll;
    const r = rightScroll;
    if (!l || !r) return;

    function syncLeftToRight() {
      if (!settings.syncScroll || !l || !r) return;
      if (r.scrollTop !== l.scrollTop) r.scrollTop = l.scrollTop;
      if (r.scrollLeft !== l.scrollLeft) r.scrollLeft = l.scrollLeft;
    }

    function syncRightToLeft() {
      if (!settings.syncScroll || !l || !r) return;
      if (l.scrollTop !== r.scrollTop) l.scrollTop = r.scrollTop;
      if (l.scrollLeft !== r.scrollLeft) l.scrollLeft = r.scrollLeft;
    }

    l.addEventListener('scroll', syncLeftToRight);
    r.addEventListener('scroll', syncRightToLeft);

    return () => {
      l.removeEventListener('scroll', syncLeftToRight);
      r.removeEventListener('scroll', syncRightToLeft);
    };
  });

  // ── Jump to diff (App.tsx:883-905) ────────────────────────────────────────────
  function jumpToDiff(direction: 'next' | 'prev') {
    const { diffIndices } = diffData;
    if (diffIndices.length === 0) return;

    let targetIndex = 0;
    if (direction === 'next') {
      const nextIdx = diffIndices.find(idx => idx > activeDiffNavIdx);
      targetIndex = nextIdx !== undefined ? nextIdx : diffIndices[0];
    } else {
      const revIndices = [...diffIndices].reverse();
      const prevIdx = revIndices.find(idx => idx < activeDiffNavIdx);
      targetIndex = prevIdx !== undefined ? prevIdx : diffIndices[diffIndices.length - 1];
    }

    activeDiffNavIdx = targetIndex;

    setTimeout(() => {
      if (typeof document === 'undefined') return;
      document.getElementById(`diff-row-${targetIndex}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 50);
  }

  // ── Jump to search match (App.tsx:733-753) ────────────────────────────────────
  function jumpToSearchMatch(direction: 'next' | 'prev') {
    if (searchMatches.length === 0) return;

    let nextIdx = 0;
    if (direction === 'next') {
      nextIdx = activeSearchIdx + 1 < searchMatches.length ? activeSearchIdx + 1 : 0;
    } else {
      nextIdx = activeSearchIdx - 1 >= 0 ? activeSearchIdx - 1 : searchMatches.length - 1;
    }

    activeSearchIdx = nextIdx;
    const targetRowIdx = searchMatches[nextIdx];
    activeDiffNavIdx = targetRowIdx;

    setTimeout(() => {
      if (typeof document === 'undefined') return;
      document.getElementById(`diff-row-${targetRowIdx}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 50);
  }

  // ── Load sample (App.tsx:920-927) ─────────────────────────────────────────────
  function loadSample(key: SampleKey) {
    textLeft = SAMPLES[key].left;
    textRight = SAMPLES[key].right;
    committedTextLeft = SAMPLES[key].left;
    committedTextRight = SAMPLES[key].right;
    activeDiffNavIdx = -1;
  }

  // ── Clear all (App.tsx:930-936) ───────────────────────────────────────────────
  function clearAll() {
    textLeft = '';
    textRight = '';
    committedTextLeft = '';
    committedTextRight = '';
    activeDiffNavIdx = -1;
  }

  // ── Swap texts (App.tsx:939-949) ──────────────────────────────────────────────
  function swapTexts() {
    const tmpLeft = textLeft;
    const tmpRight = textRight;
    textLeft = tmpRight;
    textRight = tmpLeft;
    committedTextLeft = tmpRight;
    committedTextRight = tmpLeft;
  }

  // ── Export report ─────────────────────────────────────────────────────────────
  function exportReport(fmt: 'html' | 'md' | 'json' | 'txt') {
    const { alignedRows, similarityPercentage, additions, deletions, modifications } = diffData;
    const stats = { similarityPercentage, additions, deletions, modifications };
    const dateStr = new Date().toISOString().split('T')[0];

    let content: string;
    let mime: string;
    let ext: string;

    if (fmt === 'txt') {
      content = buildTxtReport(alignedRows, stats);
      mime = 'text/plain';
      ext = 'txt';
    } else if (fmt === 'md') {
      content = buildMdReport(alignedRows, stats);
      mime = 'text/markdown';
      ext = 'md';
    } else if (fmt === 'json') {
      content = buildJsonReport(alignedRows, stats);
      mime = 'application/json';
      ext = 'json';
    } else {
      content = buildHtmlReport(alignedRows, stats, {
        showLineNumbers: settings.showLineNumbers,
        theme: settings.theme,
        lineWrap: settings.lineWrap,
      });
      mime = 'text/html';
      ext = 'html';
    }

    download(`juxta-report-${dateStr}.${ext}`, content, mime);
  }

  // ── Shortcuts modal ───────────────────────────────────────────────────────────
  let showShortcuts = $state(false);

  // ── Editor grid class (App.tsx:1567) ──────────────────────────────────────────
  const editorGridClass = $derived(
    settings.responsiveLayout === 'adaptive'
      ? 'grid-cols-1 lg:grid-cols-2'
      : 'grid-cols-2 min-w-[760px] lg:min-w-0'
  );
</script>

<div
  class="min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 flex flex-col"
  use:shortcuts={{
    onnext: () => jumpToDiff('next'),
    onprev: () => jumpToDiff('prev'),
    onwrap: () => { settings.lineWrap = !settings.lineWrap; },
    onlinenumbers: () => { settings.showLineNumbers = !settings.showLineNumbers; },
    onhighlightmode: () => {
      settings.highlightMode = settings.highlightMode === 'word' ? 'char' : 'word';
    },
    ontoggleshortcuts: () => { showShortcuts = !showShortcuts; },
    onexporthtml: () => exportReport('html'),
    onclear: clearAll,
    oncompare: triggerCompare,
    onswap: swapTexts,
    onfocussearch: () => {
      if (typeof document !== 'undefined') {
        (document.getElementById('search-diff-input') as HTMLInputElement | null)?.focus();
      }
    },
  }}
>
  <!-- Navigation Header -->
  <TopNav
    onloadsample={loadSample}
    onclear={clearAll}
    onswap={swapTexts}
    onexport={exportReport}
    onshowshortcuts={() => { showShortcuts = true; }}
  />

  <!-- Main Interactive Editors Workspace -->
  <div class="flex-1 overflow-x-auto">
    <div class={`grid ${editorGridClass} gap-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800`}>
      <EditorPane
        bind:value={textLeft}
        side="left"
        label="Source Document (Original)"
        dotClass="bg-rose-500"
        placeholder="Paste or type original document here..."
        emptyHint="Ctrl + V to client paste"
      />
      <EditorPane
        bind:value={textRight}
        side="right"
        label="Modified Output (Comparison)"
        dotClass="bg-emerald-500"
        placeholder="Paste or type modified document here..."
        emptyHint="Ctrl + V to client paste"
      />
    </div>
  </div>

  <!-- Control Bar -->
  <ControlBar
    diffIndices={diffData.diffIndices}
    {activeDiffNavIdx}
    onjump={jumpToDiff}
  />

  <!-- Advanced Bar -->
  <AdvancedBar
    bind:searchQuery
    searchMatches={searchMatches}
    {activeSearchIdx}
    {detectedLanguageLeft}
    {isDirty}
    onsearchjump={jumpToSearchMatch}
    onclearsearch={() => { searchQuery = ''; activeSearchIdx = -1; }}
    oncompare={triggerCompare}
  />

  <!-- Results Area -->
  <div class="flex-1">
    {#if textLeft === '' && textRight === ''}
      <EmptyState />
    {:else if settings.compareMode === 'split'}
      <SplitView
        rows={diffData.alignedRows}
        {activeDiffNavIdx}
        {detectedLanguageLeft}
        {detectedLanguageRight}
        {searchQuery}
        bind:leftScroll
        bind:rightScroll
      />
    {:else}
      <UnifiedView
        rows={diffData.alignedRows}
        {activeDiffNavIdx}
        {detectedLanguageLeft}
        {detectedLanguageRight}
        {searchQuery}
      />
    {/if}
  </div>

  <!-- Status Footer -->
  <StatusFooter
    additions={diffData.additions}
    deletions={diffData.deletions}
    modifications={diffData.modifications}
    similarityPercentage={diffData.similarityPercentage}
    parseTimeMs={diffData.parseTimeMs}
  />

  <!-- Shortcuts Modal -->
  <ShortcutsModal bind:open={showShortcuts} />
</div>
