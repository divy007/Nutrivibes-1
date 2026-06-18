// e2e/setup/global-setup.ts
import { FullConfig } from '@playwright/test';
import { server } from '../../test/mocks/server.js';

export default async function globalSetup(config: FullConfig) {
  // Start MSW server before any test runs
  server.listen({ onUnhandledRequest: 'bypass' });

  // Store a reference to shut down later via globalTeardown
  // Playwright doesn’t provide a direct globalTeardown hook, so we use process exit
  // to close the server when the test run finishes.
  process.once('exit', () => {
    server.close();
  });
}
