import { defineConfig, devices } from '@playwright/test';

export default defineConfig({ globalSetup: './e2e/setup/global-setup.ts',
  testDir: './e2e',
  webServer: {
    command: 'npm run dev -- -p 3005',
    port: 3005,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
  timeout: 60_000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    navigationTimeout: 60_000,
    baseURL: 'http://localhost:3005',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
