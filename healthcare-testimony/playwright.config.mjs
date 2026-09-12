import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 4174);
const baseURL = `http://127.0.0.1:${port}/healthcare-testimony`;

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["line"], ["junit", { outputFile: "test-results/e2e-junit.xml" }], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : "line",
  use: {
    baseURL,
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: "node src/server.mjs",
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      ...process.env,
      PORT: String(port),
      BASE_PATH: "/healthcare-testimony",
      DATABASE_URL: "",
      USE_LLM: "false",
      OPENAI_API_KEY: "",
      ENABLE_SCHEDULER: "false"
    }
  }
});
