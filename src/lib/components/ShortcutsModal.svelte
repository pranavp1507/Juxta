<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import KeyboardIcon from '@lucide/svelte/icons/keyboard';

  let { open = $bindable() }: { open: boolean } = $props();

  const shortcutList = [
    { keys: ['Alt', 'N'], desc: 'Jump to Next Difference' },
    { keys: ['Alt', 'P'], desc: 'Jump to Previous Difference' },
    { keys: ['Alt', 'X'], desc: 'Swap text layout fields' },
    { keys: ['Alt', 'W'], desc: 'Toggle long lines wrapping toggle' },
    { keys: ['Alt', 'L'], desc: 'Toggle line numbers' },
    { keys: ['Alt', 'M'], desc: 'Toggle Word vs. Character Highlight mode' },
    { keys: ['Alt', 'E'], desc: 'Export HTML report' },
    { keys: ['Alt', 'C'], desc: 'Clear comparative inputs' },
    { keys: ['Alt', 'K'], desc: 'Open / Close this helper guide' },
  ] as const;
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="max-w-lg overflow-hidden p-0"
    showCloseButton={false}
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40"
    >
      <div class="flex items-center gap-2.5">
        <KeyboardIcon class="h-5 w-5 text-indigo-500" />
        <Dialog.Title class="text-sm font-bold text-slate-900 dark:text-white">
          Keyboard Shortcuts Guide
        </Dialog.Title>
      </div>
      <Dialog.Close
        class="text-xs font-semibold text-slate-400 transition hover:text-slate-600 dark:hover:text-white"
      >
        ✕ Close
      </Dialog.Close>
    </div>

    <!-- Body -->
    <div class="space-y-4 p-6">
      <Dialog.Description class="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Unlock high-productivity text comparison using these simple, instant shortcuts. Alt modifiers
        work even while focusing input fields!
      </Dialog.Description>

      <div class="grid grid-cols-1 gap-2">
        {#each shortcutList as s}
          <div
            class="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-0 dark:border-slate-800"
          >
            <span class="text-xs font-medium text-slate-600 dark:text-slate-300">{s.desc}</span>
            <div class="flex items-center gap-1">
              {#each s.keys as k}
                <kbd
                  class="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {k}
                </kbd>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Footer -->
    <div
      class="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-950/40"
    >
      <Dialog.Close
        class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/10 transition hover:bg-indigo-700"
      >
        Dismiss
      </Dialog.Close>
    </div>
  </Dialog.Content>
</Dialog.Root>
