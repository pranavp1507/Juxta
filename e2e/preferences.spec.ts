import { test, expect } from '@playwright/test';

test('theme toggle persists across reload', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const wasDark = await html.evaluate((el) => el.classList.contains('dark'));
  await page.locator('#theme-toggler').click();
  await expect.poll(() => html.evaluate((el) => el.classList.contains('dark'))).toBe(!wasDark);
  await page.reload();
  await expect.poll(() => html.evaluate((el) => el.classList.contains('dark'))).toBe(!wasDark);
});

test('Alt+N jumps to the next diff', async ({ page }) => {
  await page.goto('/');
  await page.locator('#load-sample-code').click();
  await page.keyboard.press('Alt+n');
  await expect(page.locator('[class*="ring-indigo-500"]').first()).toBeVisible();
});
