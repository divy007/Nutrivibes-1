import { test, expect } from '@playwright/test';
import { mockApi } from './setup/mock-api';

test('Dietician can pause & resume a client plan', async ({ page }) => {
  // Mock API requests
  await mockApi(page);

  // Login as dietician
  await page.goto('/login');
  await page.waitForSelector('#email');
  await page.fill('#email', 'dietician@example.com');
  await page.waitForSelector('#password');
  await page.fill('#password', 'password123');
  await page.click('button:has-text("Login")');

  // Verify dashboard and navigate to client list
  await page.waitForURL('**/dietician/dashboard');
  await page.goto('/dietician/clients');

  // Click the actions dropdown trigger for the client
  await page.click('[data-testid="client-actions-trigger"]');
  
  // Click exact Pause option in the dropdown
  await page.locator('button', { hasText: /^Pause$/ }).click();

  // Fill in the pause date and confirm
  await page.fill('input[type="date"]', '2026-12-31');
  await page.click('button:has-text("Confirm Pause")');

  // Since the client is now paused, switch to the "Paused" filter tab to view them
  await page.locator('button', { hasText: /^Paused$/ }).click();

  // Verify paused state is visible in the client row table cell
  await expect(page.locator('td:has-text("Paused")')).toBeVisible();

  // Resume the plan by opening actions trigger again
  await page.click('[data-testid="client-actions-trigger"]');
  
  // Click exact Resume option in the dropdown
  await page.locator('button', { hasText: /^Resume$/ }).click();

  // Since the client is resumed, switch back to the "Active" filter tab to view them
  await page.locator('button', { hasText: /^Active$/ }).click();

  // Verify active state is restored in the client row table cell
  await expect(page.locator('td:has-text("Active")')).toBeVisible();
});
