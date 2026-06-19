import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const seriousOrCritical = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

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
