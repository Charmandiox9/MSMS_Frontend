import { defineConfig, devices } from '@playwright/test';

const FRONTEND_PORT = 3100;
const BACKEND_PORT = 3999;

export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;
export const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

/**
 * E2E contra el build de producción del frontend y un backend simulado con
 * estado (`e2e/fake-backend.ts`). Los tests comparten ese estado, así que
 * corren en serie y cada uno lo reinicia.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: FRONTEND_URL,
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/fake-backend.mts',
      url: `${BACKEND_URL}/__state`,
      env: { E2E_BACKEND_PORT: String(BACKEND_PORT), E2E_FRONTEND_ORIGIN: FRONTEND_URL },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx next build && npx next start --port ${FRONTEND_PORT}`,
      url: `${FRONTEND_URL}/api/runtime-config`,
      env: { NEXT_PUBLIC_API_URL: `${BACKEND_URL}/api/graphql`, NEXT_TELEMETRY_DISABLED: '1' },
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
  ],
});
