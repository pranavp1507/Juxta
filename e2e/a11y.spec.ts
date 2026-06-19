import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const seriousOrCritical = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

// ── Light-mode scans (Playwright default: prefers-color-scheme: light) ──────

test('empty state has no serious/critical a11y violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(seriousOrCritical(results.violations)).toEqual([]);
});

test('diff-loaded state has no serious/critical a11y violations', async ({ page }) => {
  await page.goto('/');
  await page.locator('#load-sample-code').click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(seriousOrCritical(results.violations)).toEqual([]);
});

test('shortcuts modal open has no serious/critical a11y violations', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-keyboard-guide').click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(seriousOrCritical(results.violations)).toEqual([]);
});

// ── Dark-mode scans ──────────────────────────────────────────────────────────
// Force dark mode two ways:
//  1. emulateMedia so prefers-color-scheme: dark is signalled to the app.
//  2. addInitScript sets localStorage so initialTheme() returns 'dark' even if
//     emulate alone races with the Svelte $effect that reads matchMedia.

// Helper: wait for the html.dark class to be present (Svelte $effect applies it after mount)
async function waitForDarkMode(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'), { timeout: 5000 });
}

test('dark mode empty state has no serious/critical a11y violations', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('juxta-theme', 'dark'));
  await page.goto('/');
  // Wait for Svelte $effect to apply the dark class to <html>
  await waitForDarkMode(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(seriousOrCritical(results.violations)).toEqual([]);
});

test('dark mode diff-loaded state has no serious/critical a11y violations', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('juxta-theme', 'dark'));
  await page.goto('/');
  await waitForDarkMode(page);
  await page.locator('#load-sample-code').click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(seriousOrCritical(results.violations)).toEqual([]);
});

test('dark mode shortcuts modal open has no serious/critical a11y violations', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('juxta-theme', 'dark'));
  await page.goto('/');
  await waitForDarkMode(page);
  await page.locator('#btn-keyboard-guide').click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(seriousOrCritical(results.violations)).toEqual([]);
});
