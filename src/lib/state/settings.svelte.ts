// Rune-backed persisted settings store.
// .svelte.ts extension required so the Svelte compiler processes $state.

import { serialize, parseStored } from './persisted';

export { serialize, parseStored };

// ── Rune-backed persisted box ─────────────────────────────────────────────────

/**
 * Creates a $state box whose value is persisted to localStorage.
 *
 * SSR-safe: when localStorage is unavailable, holds `initial` in memory.
 *
 * Cross-module reactivity: returns a plain object with get/set `value`
 * accessors. The internal $state variable makes reads/writes reactive in
 * Svelte-compiled components and stores.
 *
 * In non-Svelte contexts (Bun test runner, plain TS): $state is a no-op
 * identity function shim so the module can be imported without crashing.
 */
export function createPersisted<T>(key: string, initial: T): { value: T } {
  const isClient = typeof localStorage !== 'undefined';
  const stored = isClient ? parseStored(localStorage.getItem(key), initial) : initial;

  let _value: T = $state(stored);

  return {
    get value(): T {
      return _value;
    },
    set value(next: T) {
      _value = next;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, serialize(next));
      }
    },
  };
}

// ── Theme default with system-preference fallback ─────────────────────────────

function initialTheme(): 'light' | 'dark' {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('juxta-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  }
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // SSR fallback: no window available
}

// ── Settings singleton ────────────────────────────────────────────────────────

const _theme = createPersisted<'light' | 'dark'>('juxta-theme', initialTheme());
const _compareMode = createPersisted<'split' | 'unified'>('juxta-compareMode', 'split');
const _syncScroll = createPersisted<boolean>('juxta-syncScroll', true);
const _showWhitespace = createPersisted<boolean>('juxta-showWhitespace', false);
const _showLineNumbers = createPersisted<boolean>('juxta-showLineNumbers', true);
const _lineWrap = createPersisted<boolean>('juxta-lineWrap', false);
const _highlightMode = createPersisted<'word' | 'char'>('juxta-highlightMode', 'word');
const _syntaxHighlighting = createPersisted<boolean>('juxta-syntaxHighlighting', true);
const _syntaxScheme = createPersisted<'high-contrast' | 'soft'>('juxta-syntaxScheme', 'high-contrast');
const _responsiveLayout = createPersisted<'adaptive' | 'fixed-split'>('juxta-responsiveLayout', 'adaptive');
const _autoCompare = createPersisted<boolean>('juxta-autoCompare', true);
const _languageMode = createPersisted<'auto' | 'ts' | 'html' | 'css' | 'json'>('juxta-languageMode', 'auto');

export const settings = {
  get theme() { return _theme.value; },
  set theme(v: 'light' | 'dark') { _theme.value = v; },

  get compareMode() { return _compareMode.value; },
  set compareMode(v: 'split' | 'unified') { _compareMode.value = v; },

  get syncScroll() { return _syncScroll.value; },
  set syncScroll(v: boolean) { _syncScroll.value = v; },

  get showWhitespace() { return _showWhitespace.value; },
  set showWhitespace(v: boolean) { _showWhitespace.value = v; },

  get showLineNumbers() { return _showLineNumbers.value; },
  set showLineNumbers(v: boolean) { _showLineNumbers.value = v; },

  get lineWrap() { return _lineWrap.value; },
  set lineWrap(v: boolean) { _lineWrap.value = v; },

  get highlightMode() { return _highlightMode.value; },
  set highlightMode(v: 'word' | 'char') { _highlightMode.value = v; },

  get syntaxHighlighting() { return _syntaxHighlighting.value; },
  set syntaxHighlighting(v: boolean) { _syntaxHighlighting.value = v; },

  get syntaxScheme() { return _syntaxScheme.value; },
  set syntaxScheme(v: 'high-contrast' | 'soft') { _syntaxScheme.value = v; },

  get responsiveLayout() { return _responsiveLayout.value; },
  set responsiveLayout(v: 'adaptive' | 'fixed-split') { _responsiveLayout.value = v; },

  get autoCompare() { return _autoCompare.value; },
  set autoCompare(v: boolean) { _autoCompare.value = v; },

  get languageMode() { return _languageMode.value; },
  set languageMode(v: 'auto' | 'ts' | 'html' | 'css' | 'json') { _languageMode.value = v; },
};
