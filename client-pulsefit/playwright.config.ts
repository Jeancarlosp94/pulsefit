import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config para PulseFit.
 * Probamos primero en mobile (375px Pixel 5) porque el producto es mobile-first absoluto.
 * Desktop solo cubre validación de PWA en escritorio.
 */
export default defineConfig({
   testDir: './tests/e2e',
   fullyParallel: true,
   forbidOnly: !!process.env.CI,
   retries: process.env.CI ? 2 : 0,
   workers: process.env.CI ? 1 : undefined,
   reporter: process.env.CI ? 'github' : 'list',
   use: {
      baseURL: 'http://localhost:5173',
      trace: 'on-first-retry',
      screenshot: 'only-on-failure'
   },
   projects: [
      {
         name: 'mobile-chrome',
         use: { ...devices['Pixel 5'] }
      },
      {
         name: 'mobile-safari',
         use: { ...devices['iPhone 13'] }
      },
      {
         name: 'desktop-chrome',
         use: { ...devices['Desktop Chrome'] }
      }
   ],
   webServer: {
      command: 'pnpm dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000
   }
})
