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

test('theme toggle changes rendered styles (class-based dark variant)', async ({ page }) => {
  await page.goto('/');
  // Root div carries `bg-slate-50 dark:bg-slate-950` — its computed background
  // colour must actually change when the theme flips, not just the html class.
  // (Regression guard: Tailwind v4 needs `@custom-variant dark` for the `.dark`
  // class to drive `dark:` utilities; without it the toggle is a no-op.)
  const root = page.locator('div.min-h-screen').first();
  const bgBefore = await root.evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.locator('#theme-toggler').click();
  await expect
    .poll(() => root.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe(bgBefore);
});

test('Alt+N jumps to the next diff', async ({ page }) => {
  await page.goto('/');
  await page.locator('#load-sample-code').click();
  await expect(page.locator('[id^="diff-row-"]').first()).toBeVisible();
  await page.keyboard.press('Alt+n');
  await expect(page.locator('[id^="diff-row-"][class*="ring-indigo-500"]').first()).toBeVisible();
});
