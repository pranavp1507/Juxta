/**
 * Svelte action that attaches a global `keydown` listener mapping Alt-key
 * combos to handler callbacks. Ports the keydown handler from App.tsx:1326-1378.
 *
 * Usage:
 *   <svelte:window use:shortcuts={handlers} />
 *   or on any element — the listener is attached to `window`.
 */

export interface ShortcutHandlers {
  onnext(): void;
  onprev(): void;
  onwrap(): void;
  onlinenumbers(): void;
  onhighlightmode(): void;
  ontoggleshortcuts(): void;
  onexporthtml(): void;
  onclear(): void;
  oncompare(): void;
  onswap(): void;
  onfocussearch(): void;
}

export function shortcuts(
  _node: HTMLElement,
  handlers: ShortcutHandlers
): { update(h: ShortcutHandlers): void; destroy(): void } {
  // Keep a mutable reference so the closure always calls the latest handlers
  // without needing to re-attach the listener on every update.
  let h = handlers;

  function handleKeyDown(e: KeyboardEvent): void {
    // Mirror the source guard: allow Alt combos even inside editable fields,
    // but skip non-Alt keys when an editable field has focus.
    const isEditable =
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA' ||
      (document.activeElement as HTMLElement | null)?.isContentEditable;

    if (isEditable && !e.altKey) return;

    if (!e.altKey) return;

    const key = e.key.toLowerCase();

    if (key === 'n') {
      e.preventDefault();
      h.onnext();
    } else if (key === 'p') {
      e.preventDefault();
      h.onprev();
    } else if (key === 'w') {
      e.preventDefault();
      h.onwrap();
    } else if (key === 'l') {
      e.preventDefault();
      h.onlinenumbers();
    } else if (key === 'm') {
      e.preventDefault();
      h.onhighlightmode();
    } else if (key === 'k') {
      e.preventDefault();
      h.ontoggleshortcuts();
    } else if (key === 'e') {
      e.preventDefault();
      h.onexporthtml();
    } else if (key === 'c') {
      e.preventDefault();
      h.onclear();
    } else if (e.key === 'Enter') {
      // Alt+Enter: e.key is 'Enter' (not lowercased)
      e.preventDefault();
      h.oncompare();
    } else if (key === 'x') {
      e.preventDefault();
      h.onswap();
    } else if (key === 'f') {
      e.preventDefault();
      h.onfocussearch();
    }
  }

  window.addEventListener('keydown', handleKeyDown);

  return {
    update(newHandlers: ShortcutHandlers) {
      h = newHandlers;
    },
    destroy() {
      window.removeEventListener('keydown', handleKeyDown);
    },
  };
}
