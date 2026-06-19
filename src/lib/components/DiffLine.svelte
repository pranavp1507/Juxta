<script lang="ts">
  import { tokenizeLanguage } from '$lib/diff/tokenizer';
  import type { Lang, SegmentType } from '$lib/diff/tokenizer';
  import type { DiffWord } from '$lib/diff/engine';
  import { settings } from '$lib/state/settings.svelte';

  let { text, rowType, side, words, lang, searchQuery }: {
    text: string | undefined;
    rowType: 'equal' | 'delete' | 'insert' | 'modify';
    side: 'left' | 'right';
    words?: DiffWord[];
    lang: Lang;
    searchQuery: string;
  } = $props();

  // ── Helpers ───────────────────────────────────────────────────────────────────

  /** Replace spaces with middle dot when showWhitespace is on. */
  function fmt(str: string): string {
    return settings.showWhitespace ? str.replace(/ /g, '·') : str;
  }

  /**
   * Split `str` into alternating [plain, match, plain, match, …] parts for
   * case-insensitive `searchQuery` highlighting.
   * Returns an array of { text, isMatch } objects; empty array when no query.
   */
  function splitForSearch(str: string): { text: string; isMatch: boolean }[] {
    if (!searchQuery) return [];
    const lowerStr = str.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    let pos = lowerStr.indexOf(lowerQuery);
    if (pos === -1) return [];

    const parts: { text: string; isMatch: boolean }[] = [];
    let startIdx = 0;
    while (pos !== -1) {
      if (pos > startIdx) {
        parts.push({ text: str.substring(startIdx, pos), isMatch: false });
      }
      parts.push({ text: str.substring(pos, pos + searchQuery.length), isMatch: true });
      startIdx = pos + searchQuery.length;
      pos = lowerStr.indexOf(lowerQuery, startIdx);
    }
    if (startIdx < str.length) {
      parts.push({ text: str.substring(startIdx), isMatch: false });
    }
    return parts;
  }

  /**
   * Color class for a syntax token type.
   * Mirrors renderSegmentWithSearch (App.tsx:163-176).
   */
  function segmentColorClass(type: SegmentType): string {
    const isSoft = settings.syntaxScheme === 'soft';
    if (type === 'comment')    return isSoft ? 'text-slate-500 dark:text-slate-400 italic'                            : 'text-slate-600 dark:text-slate-450 italic';
    if (type === 'string')     return isSoft ? 'text-emerald-700/80 dark:text-emerald-400/70 font-normal'             : 'text-emerald-700 dark:text-emerald-400 font-medium';
    if (type === 'keyword')    return isSoft ? 'text-indigo-700/80 dark:text-sky-400/70 font-medium'                  : 'text-indigo-700 dark:text-sky-400 font-semibold';
    if (type === 'number')     return isSoft ? 'text-amber-700/75 dark:text-orange-400/75'                            : 'text-amber-700 dark:text-orange-400';
    if (type === 'punctuation')return isSoft ? 'text-slate-500/80 dark:text-slate-400/80'                             : 'text-slate-600 dark:text-slate-400';
    if (type === 'function')   return isSoft ? 'text-blue-700/80 dark:text-yellow-300/70 font-medium'                 : 'text-blue-700 dark:text-yellow-300 font-semibold';
    if (type === 'tag')        return isSoft ? 'text-rose-600/80 dark:text-rose-400/75 font-medium'                   : 'text-rose-700 dark:text-rose-400 font-semibold';
    if (type === 'attribute')  return isSoft ? 'text-violet-600/80 dark:text-violet-400/75 font-normal'               : 'text-violet-700 dark:text-violet-400 font-medium';
    if (type === 'property')   return isSoft ? 'text-amber-700/80 dark:text-orange-300/70 font-normal'                : 'text-amber-750 dark:text-orange-350 font-medium';
    if (type === 'value')      return isSoft ? 'text-sky-600/80 dark:text-sky-305/70'                                 : 'text-sky-700 dark:text-sky-350';
    if (type === 'selector')   return isSoft ? 'text-blue-700/80 dark:text-yellow-300/75 font-semibold'               : 'text-blue-700 dark:text-yellow-405 font-bold';
    return 'text-slate-800 dark:text-slate-300';
  }

  // ── Derived data ──────────────────────────────────────────────────────────────

  /** Row-level text color for plain / delete / insert / modify rows (App.tsx:814-819). */
  const textStyle = $derived((): string => {
    if (rowType === 'delete') return 'text-rose-900 dark:text-rose-400';
    if (rowType === 'insert') return 'text-emerald-900 dark:text-emerald-400';
    if (rowType === 'modify') return side === 'left'
      ? 'text-rose-800 dark:text-rose-400 font-bold'
      : 'text-emerald-800 dark:text-emerald-400 font-bold';
    return 'text-slate-800 dark:text-slate-300';
  });

  /** Syntax tokens (only computed when needed). */
  const syntaxTokens = $derived(
    settings.syntaxHighlighting && rowType === 'equal' && text !== undefined
      ? tokenizeLanguage(text, lang)
      : null
  );
</script>

<!--
  Decision tree (mirrors App.tsx:756-878):
  1. text === undefined  →  striped empty cell
  2. words provided      →  word/char diff spans with optional syntax coloring on equal words
  3. syntaxHighlighting && rowType === 'equal'  →  tokenized syntax spans
  4. else                →  plain text with row-type color + search marks
-->

{#if text === undefined}
  <!-- Branch 1: striped empty-cell placeholder (App.tsx:764) -->
  <div class="h-5 select-none bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.02)_8px,rgba(0,0,0,0.02)_16px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,255,255,0.015)_8px,rgba(255,255,255,0.015)_16px)]"></div>

{:else if words}
  <!-- Branch 2: word/char diff spans (App.tsx:821-860) -->
  <span>
    {#each words as word}
      {@const isWordDiffMark = word.type === 'delete' || word.type === 'insert'}
      {@const wordClass = (() => {
        if (word.type === 'delete') {
          return settings.highlightMode === 'char'
            ? 'bg-rose-200/80 dark:bg-rose-950 text-rose-950 dark:text-rose-100 font-bold border-b border-rose-500'
            : 'bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-100 px-1 py-0.5 rounded shadow-xs font-semibold mx-0.5 inline-block';
        }
        if (word.type === 'insert') {
          return settings.highlightMode === 'char'
            ? 'bg-emerald-250/80 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 font-bold border-b border-emerald-500'
            : 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 px-1 py-0.5 rounded shadow-xs font-semibold mx-0.5 inline-block';
        }
        // equal word: optionally apply syntax-ish coloring (App.tsx:839-851)
        if (settings.syntaxHighlighting && !isWordDiffMark) {
          const lowerVal = word.value.trim();
          const isSoft = settings.syntaxScheme === 'soft';
          if (/^(const|let|var|function|return|if|else|for|class|import|export|from|interface|type|public|private|async|await)$/.test(lowerVal)) {
            return isSoft ? 'text-indigo-700/80 dark:text-sky-400/70 font-medium' : 'text-indigo-700 dark:text-sky-400 font-semibold';
          }
          if (/^\d+$/.test(lowerVal)) {
            return isSoft ? 'text-amber-700/75 dark:text-orange-400/75' : 'text-amber-700 dark:text-orange-400';
          }
          if (lowerVal.startsWith('//') || lowerVal.startsWith('/*')) {
            return isSoft ? 'text-slate-500/85 dark:text-slate-400 italic' : 'text-slate-600 dark:text-slate-450 italic';
          }
          if (lowerVal.startsWith('"') || lowerVal.startsWith("'") || lowerVal.startsWith('`')) {
            return isSoft ? 'text-emerald-700/80 dark:text-emerald-400/70 font-mono' : 'text-emerald-700 dark:text-emerald-400 font-mono';
          }
        }
        return '';
      })()}
      {@const effectiveClass = wordClass || textStyle()}
      {@const searchParts = splitForSearch(word.value)}
      <span class={effectiveClass}>
        {#if searchParts.length > 0}
          {#each searchParts as part}
            {#if part.isMatch}
              <mark class="bg-amber-250 dark:bg-amber-500/80 text-slate-950 dark:text-slate-900 px-0.5 py-0.5 rounded font-bold shadow-xs border-b border-amber-550">{fmt(part.text)}</mark>
            {:else}
              {fmt(part.text)}
            {/if}
          {/each}
        {:else}
          {fmt(word.value)}
        {/if}
      </span>
    {/each}
  </span>

{:else if settings.syntaxHighlighting && rowType === 'equal'}
  <!-- Branch 3: syntax-highlighted tokens (App.tsx:863-875) -->
  <span>
    {#if syntaxTokens}
      {#each syntaxTokens as tok}
        {@const colorClass = segmentColorClass(tok.type)}
        {@const searchParts = splitForSearch(tok.text)}
        <span class={colorClass}>
          {#if searchParts.length > 0}
            {#each searchParts as part}
              {#if part.isMatch}
                <mark class="bg-amber-200 dark:bg-amber-500/80 text-slate-950 dark:text-slate-900 rounded px-0.5 font-bold shadow-xs border-b border-amber-550">{fmt(part.text)}</mark>
              {:else}
                {fmt(part.text)}
              {/if}
            {/each}
          {:else}
            {fmt(tok.text)}
          {/if}
        </span>
      {/each}
    {/if}
  </span>

{:else}
  <!-- Branch 4: plain text with row-type color + search marks (App.tsx:877) -->
  {@const ts = textStyle()}
  {@const searchParts = splitForSearch(text)}
  {#if searchParts.length > 0}
    {#each searchParts as part}
      {#if part.isMatch}
        <mark class="bg-amber-250 dark:bg-amber-500/80 text-slate-950 dark:text-slate-900 px-0.5 py-0.5 rounded font-bold shadow-xs border-b border-amber-550">{fmt(part.text)}</mark>
      {:else}
        <span class={ts}>{fmt(part.text)}</span>
      {/if}
    {/each}
  {:else}
    <span class={ts}>{fmt(text)}</span>
  {/if}
{/if}
