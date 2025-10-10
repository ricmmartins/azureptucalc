import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10000
  }
});
