import { test, expect } from '@playwright/test';
import { mockApi } from './setup/mock-api';

test('Dietician can update a client\'s meal timings', async ({ page }) => {
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
  
  // Click View button for first client row
  await page.click('text=View'); 

  // Navigate to Suggest Diet page via sidebar link
  await page.click('text=Suggest Diet');

  // Open Actions dropdown and select Add Meal Timing
  await page.click('button:has-text("Action")');
  await page.click('text=Add Meal Timing');

  // Add a new meal and fill it with 12:30
  await page.click('button:has-text("Add Meal")');
  await page.locator('input[type="time"]').last().fill('12:30');
  
  // Save the timings modal
  await page.click('button:has-text("Save Meal Timings")');

  // Verify UI reflects the new slot (using .first() to handle multiple instances in different day columns)
  await expect(page.locator('text=12:30').first()).toBeVisible();
});
