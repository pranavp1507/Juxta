<script lang="ts">
  import Clock from '@lucide/svelte/icons/clock';

  let { additions, deletions, modifications, similarityPercentage, parseTimeMs }: {
    additions: number;
    deletions: number;
    modifications: number;
    similarityPercentage: number;
    parseTimeMs: number;
  } = $props();
</script>

<footer class="h-auto md:h-12 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-6 sm:px-8 py-3 md:py-0 flex flex-col md:flex-row items-center justify-between text-slate-700 dark:text-white gap-4 transition shadow-sm">
  <div class="flex flex-wrap gap-4 sm:gap-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
      <span>{additions} Insertions</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
      <span>{deletions} Deletions</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
      <span>{modifications} Modifications</span>
    </div>
    <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-mono text-[11px] font-normal lowercase">
      &bull; congruency {similarityPercentage}%
    </div>
  </div>

  <div class="flex flex-wrap items-center gap-4 sm:gap-6">
    <div class="flex items-center gap-2">
      <span class="text-[10px] text-slate-450 dark:text-slate-500 uppercase font-mono">DIFF ALGORITHM:</span>
      <span class="text-xs font-bold text-slate-600 dark:text-slate-300 select-all font-mono">MYERS_OPTIMIZED_V2</span>
    </div>
    <div class="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
    <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
      <Clock class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
      <span>Parsed in {parseTimeMs}ms (secured client-side)</span>
    </div>
  </div>
</footer>
