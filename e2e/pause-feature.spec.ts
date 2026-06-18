// e2e/pause-feature.spec.ts
import { test, expect } from '@playwright/test';

test('Dietician can pause & resume a client plan', async ({ page }) => {
  // Login as dietician
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'dietician@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("Login")');

  // Go to client list
  await page.waitForURL('**/dietician/clients');
  await page.click('text=Pause'); // assume a Pause button for first client

  // Verify paused state
  await expect(page.locator('text=Paused')).toBeVisible();

  // Resume the plan
  await page.click('text=Resume');
  await expect(page.locator('text=Active')).toBeVisible();
});
