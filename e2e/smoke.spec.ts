import { test, expect } from '@playwright/test';

test('home page renders the Juxta brand', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Juxta').first()).toBeVisible();
});
