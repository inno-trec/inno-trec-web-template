import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests run against the production build, served by `vite preview`.
 * They automate the checks in docs/contributing.md: every page at 1440px and 400px wide,
 * no sideways scroll and no console errors.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4174',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 400, height: 800 } } },
  ],
  webServer: {
    command: 'vite build && vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
  },
});
