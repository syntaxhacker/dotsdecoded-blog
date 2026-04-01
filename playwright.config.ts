import { defineConfig } from '@playwright/test'
import { resolve } from 'path'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 6,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    launchOptions: {
      executablePath: resolve('/Users/developer/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
    },
  },
  webServer: {
    command: 'npx serve dist -l 4321',
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})
