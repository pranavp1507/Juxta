// Shim for Svelte 5 runes when running under Bun's test runner.
// The Svelte compiler rewrites $state/$effect etc. syntactically at build time;
// in plain-TS contexts (Bun) they are undefined globals.
// This preload makes them identity no-ops so .svelte.ts modules can be imported.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

if (typeof g.$state === 'undefined') {
  g.$state = <T>(v: T): T => v;
}
if (typeof g.$effect === 'undefined') {
  g.$effect = (_fn: () => void): void => { /* no-op */ };
}
if (typeof g.$derived === 'undefined') {
  g.$derived = <T>(v: T): T => v;
}
if (typeof g.$props === 'undefined') {
  g.$props = <T>(v: T): T => v;
}
