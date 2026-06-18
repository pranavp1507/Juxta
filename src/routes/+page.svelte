<script lang="ts">
  import { diffLines, alignDiff } from '$lib/diff/engine';
  import EditorPane from '$lib/components/EditorPane.svelte';

  let left = $state('hello world\nsecond line');
  let right = $state('hello there\nsecond line');

  const rows = $derived(alignDiff(diffLines(left.split(/\r?\n/), right.split(/\r?\n/)), 'word'));
</script>

<main class="mx-auto max-w-5xl space-y-4 p-6">
  <h1 class="text-2xl font-bold">Juxta</h1>
  <div class="grid grid-cols-2">
    <EditorPane
      bind:value={left}
      side="left"
      label="Source Document (Original)"
      dotClass="bg-rose-500"
      placeholder="Paste or type original document here..."
      emptyHint="Ctrl + V to client paste"
    />
    <EditorPane
      bind:value={right}
      side="right"
      label="Modified Document (Changed)"
      dotClass="bg-emerald-500"
      placeholder="Paste or type modified document here..."
      emptyHint="Ctrl + V to client paste"
    />
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
