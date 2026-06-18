// e2e/client-calendar.spec.ts
import { test, expect } from '@playwright/test';

test('Client sees correct dynamic meal slots', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'client@example.com');
  await page.fill('input[name="password"]', 'clientpwd');
  await page.click('button:has-text("Login")');

  await page.waitForURL('**/client/calendar');
  // Verify default slots are displayed
  await expect(page.locator('text=Breakfast')).toBeVisible();
  await expect(page.locator('text=Lunch')).toBeVisible();
  await expect(page.locator('text=Dinner')).toBeVisible();
});
