import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "titulation.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3210",
    timezoneId: "America/Santiago",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  webServer: {
    command:
      process.env.PLAYWRIGHT_SKIP_BUILD === "1"
        ? "npx next start --port 3210"
        : "npx next build --webpack && npx next start --port 3210",
    url: "http://localhost:3210/api/runtime-config",
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_API_URL: "http://localhost:3999/api/graphql",
      NEXT_PUBLIC_BASE_PATH: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
