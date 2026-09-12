import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/live",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 60_000 },
  reporter: "line",
  use: {
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  }
});
