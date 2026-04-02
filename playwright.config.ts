import { defineConfig } from '@playwright/test'
import { resolve } from 'path'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : 6,
  reporter: isCI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    ...(isCI
      ? { channel: 'chromium' }
      : {
          launchOptions: {
            executablePath: resolve('/Users/developer/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
          },
        }),
  },
  webServer: {
    command: 'npx serve dist -l 4321',
    port: 4321,
    reuseExistingServer: !isCI,
    timeout: 30000,
  },
})
