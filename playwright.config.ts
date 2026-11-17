import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "npm run dev -- --port 3102",
    url: "http://localhost:3102",
    reuseExistingServer: false,
    timeout: 120000,
    env: { NEXT_TEST_DIST_DIR: ".next-e2e" },
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3102",
    channel: "chrome",
    headless: true,
    viewport: { width: 1024, height: 616 },
    trace: "retain-on-failure",
  },
});
