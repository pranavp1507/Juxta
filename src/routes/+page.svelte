<script lang="ts">
  import { diffLines, alignDiff } from '$lib/diff/engine';

  let left = $state('hello world\nsecond line');
  let right = $state('hello there\nsecond line');

  const rows = $derived(alignDiff(diffLines(left.split(/\r?\n/), right.split(/\r?\n/)), 'word'));
</script>

<main class="mx-auto max-w-5xl space-y-4 p-6">
  <h1 class="text-2xl font-bold">Juxta</h1>
  <div class="grid grid-cols-2 gap-4">
    <textarea class="h-40 rounded border p-2 font-mono text-sm" bind:value={left}></textarea>
    <textarea class="h-40 rounded border p-2 font-mono text-sm" bind:value={right}></textarea>
  </div>
  <ul class="font-mono text-sm" data-testid="diff-rows">
    {#each rows as row}
      <li>
        <span>{row.type}</span>
        <span>{row.leftContent ?? ''}</span>
        <span>→</span>
        <span>{row.rightContent ?? ''}</span>
      </li>
    {/each}
  </ul>
</main>
