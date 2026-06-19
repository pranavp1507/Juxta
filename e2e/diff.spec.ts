import { test, expect } from '@playwright/test';

test('typing in both panes produces diff rows', async ({ page }) => {
  await page.goto('/');
  await page.locator('#left-textarea').fill('hello world\nsecond');
  await page.locator('#right-textarea').fill('hello there\nsecond');
  await expect(page.locator('[id^="diff-row-"]').first()).toBeVisible();
});

test('loading the code sample renders a diff and split/unified toggle works', async ({ page }) => {
  await page.goto('/');
  await page.locator('#load-sample-code').click();
  await expect(page.locator('[id^="diff-row-"]').first()).toBeVisible();
  await page.locator('#opt-unified-mode').click();
  await expect(page.locator('[id^="diff-row-"]').first()).toBeVisible();
  await page.locator('#opt-split-mode').click();
  await expect(page.locator('[id^="diff-row-"]').first()).toBeVisible();
});

test('search highlights matches and Enter navigates', async ({ page }) => {
  await page.goto('/');
  await page.locator('#load-sample-code').click();
  await page.locator('#search-diff-input').fill('user');
  await page.locator('#search-diff-input').press('Enter');
  await expect(page.locator('mark').first()).toBeVisible();
});
