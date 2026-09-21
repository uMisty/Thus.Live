import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4180', channel: process.env.PLAYWRIGHT_BROWSER === 'chromium' ? undefined : process.env.PLAYWRIGHT_BROWSER || 'chrome', colorScheme: 'light', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'node node_modules/vitepress/bin/vitepress.js preview --host 127.0.0.1 --port 4180', url: 'http://127.0.0.1:4180', reuseExistingServer: false, timeout: 30_000 },
})
