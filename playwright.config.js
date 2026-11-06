import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: 'http://127.0.0.1:4173/the-pushup-challenge-2025/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/the-pushup-challenge-2025/',
    reuseExistingServer: false,
    env: {
      VITE_USE_FIREBASE_EMULATORS: 'true',
      VITE_FIREBASE_PROJECT_ID: 'demo-pushup-2027',
      VITE_FIREBASE_API_KEY: 'demo-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-pushup-2027.firebaseapp.com',
      VITE_FIREBASE_APP_ID: 'demo-app',
      VITE_ENABLE_V2_CLOUD: 'false',
    },
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
