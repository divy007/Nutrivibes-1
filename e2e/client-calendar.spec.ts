import { test, expect } from '@playwright/test';
import { mockApi } from './setup/mock-api';

test('Client sees correct dynamic meal slots', async ({ page }) => {
  // Mock API requests
  await mockApi(page);

  await page.goto('/login');
  await page.waitForSelector('#email');
  await page.fill('#email', 'client@example.com');
  await page.waitForSelector('#password');
  await page.fill('#password', 'clientpwd');
  await page.click('button:has-text("Login")');

  await page.waitForURL('**/client/dashboard');
  await page.goto('/client/diet-plan');

  // Verify default slots are displayed (using .first() to avoid strict mode violations on recurring slots)
  await expect(page.locator('text=Breakfast').first()).toBeVisible();
  await expect(page.locator('text=Lunch').first()).toBeVisible();
  await expect(page.locator('text=Dinner').first()).toBeVisible();
});
