// e2e/dietician-flow.spec.ts
import { test, expect } from '@playwright/test';

test('Dietician can update a client\'s meal timings', async ({ page }) => {
  // Login as dietician
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'dietician@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("Login")');

  // Navigate to client list
  await page.waitForURL('**/dietician/clients');
  await page.click('text=View'); // assumes first client row has a View button

  // Open meal‑timings modal and add a slot
  await page.click('button:has-text("Add Meal")');
  await page.fill('input[name="time"]', '12:30');
  await page.click('button:has-text("Save")');

  // Verify UI reflects the new slot
  await expect(page.locator('text=12:30')).toBeVisible();
});
