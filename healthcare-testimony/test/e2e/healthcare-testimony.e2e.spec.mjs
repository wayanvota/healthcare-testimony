import { expect, test } from "@playwright/test";

const appPath = "/healthcare-testimony";
const apiPath = `${appPath}/api`;
const sampleText = "Our AI platform fully automates prior authorization decisions and guarantees faster access for every Medicare Advantage patient.";

async function waitForAnalysis(page) {
  await expect(page.getByRole("button", { name: "Run committee analysis" })).toBeEnabled();
  await expect(page.locator("#matrixBody tr").first()).toBeVisible();
}

async function openApp(page) {
  await page.goto(appPath);
  await waitForAnalysis(page);
}

test.describe("Healthcare Testimony deterministic end-to-end contract", () => {
  test("U01 dashboard loads and completes the default analysis", async ({ page }) => {
    await openApp(page);
    await expect(page.getByRole("heading", { name: "Healthcare CEO Senate Testimony Alignment Tool" })).toBeVisible();
    await expect(page.locator("#healthStatus")).toHaveText(/Local deterministic mode|Analysis complete/);
    await expect(page.locator("#claimCount")).not.toHaveText("0 claims");
  });

  test("U02 a user can submit custom testimony and see risk-specific output", async ({ page }) => {
    await openApp(page);
    await page.getByLabel("Testimony text").fill(sampleText);
    await page.getByRole("button", { name: "Run committee analysis" }).click();
    await waitForAnalysis(page);
    await expect(page.locator("#claimAnalysis")).toContainText("fully automates prior authorization decisions");
    await expect(page.locator("#claimAnalysis")).toContainText("high");
  });

  test("U03 committee choices constrain the resulting roster", async ({ page }) => {
    await openApp(page);
    await page.locator('input[name="committees"]').evaluateAll((checkboxes) => {
      for (const checkbox of checkboxes) checkbox.checked = false;
    });
    await page.getByLabel("Homeland Security").check();
    await page.getByLabel("Healthcare topic").fill("healthcare cybersecurity incident response");
    await page.getByRole("button", { name: "Run committee analysis" }).click();
    await waitForAnalysis(page);
    await expect(page.locator("#matrixBody")).toContainText("Gary Peters");
  });

  test("U04 selected-senator analysis honors include and exclude fields", async ({ page }) => {
    await openApp(page);
    await page.getByLabel("Specific senators").fill("Ron Wyden");
    await page.getByLabel("Excluded senators").fill("Mike Crapo");
    await page.getByRole("button", { name: "Run selected-senator analysis" }).click();
    await waitForAnalysis(page);
    await expect(page.locator("#matrixBody")).toContainText("Ron Wyden");
    await expect(page.locator("#matrixBody")).not.toContainText("Mike Crapo");
  });

  test("U05 roster refresh completes without changing the selected form inputs", async ({ page }) => {
    await openApp(page);
    await page.getByLabel("Healthcare topic").fill("rural health access");
    await page.getByRole("button", { name: "Refresh committee rosters" }).click();
    await expect(page.locator("#healthStatus")).toHaveText("Rosters loaded");
    await expect(page.getByLabel("Healthcare topic")).toHaveValue("rural health access");
  });

  test("U06 history clearly reports local memory mode", async ({ page }) => {
    await openApp(page);
    await page.getByRole("button", { name: "History" }).click();
    await expect(page.locator("#historyCount")).toHaveText("0 runs");
    await expect(page.locator("#historyList")).toContainText("Neon is not configured");
  });

  test("U07 Markdown export downloads a citation-bearing briefing", async ({ page }) => {
    await openApp(page);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Markdown" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("healthcare-testimony-ceo-briefing.md");
    const content = await download.createReadStream().then(async (stream) => {
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      return Buffer.concat(chunks).toString("utf8");
    });
    expect(content).toContain("## Source list");
  });

  test("U08 PDF export downloads a valid PDF", async ({ page }) => {
    await openApp(page);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("healthcare-testimony-report.pdf");
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect(Buffer.concat(chunks).subarray(0, 5).toString()).toBe("%PDF-");
  });

  test("U09 health endpoint reports the local deterministic boundary", async ({ request }) => {
    const response = await request.get(`${apiPath}/health`);
    expect(response.ok()).toBeTruthy();
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      app: "healthcare-testimony",
      standalone: true,
      basePath: appPath,
      dbMode: "local_memory",
      llmEnabled: false
    });
  });

  test("U10 a user can create and retrieve a completed analysis job", async ({ request }) => {
    const created = await request.post(`${apiPath}/jobs`, { data: { testimonyText: sampleText, healthcareTopic: "prior authorization" } });
    expect(created.ok()).toBeTruthy();
    const job = await created.json();
    expect(job.status).toBe("completed");
    const fetched = await request.get(`${apiPath}/jobs/${encodeURIComponent(job.id)}`);
    expect(fetched.ok()).toBeTruthy();
    expect((await fetched.json()).id).toBe(job.id);
  });

  test("A01 malformed JSON is rejected without a stack trace", async ({ request }) => {
    const response = await request.post(`${apiPath}/analyze`, {
      headers: { "content-type": "application/json" },
      data: Buffer.from("{broken"),
      failOnStatusCode: false
    });
    expect(response.status()).toBe(400);
    const body = await response.text();
    expect(body).toContain("Request body must be valid JSON");
    expect(body).not.toMatch(/at .+\.mjs:\d+/);
  });

  test("A02 oversized JSON is rejected at the HTTP boundary", async ({ request }) => {
    const response = await request.post(`${apiPath}/analyze`, {
      headers: { "content-type": "application/json" },
      data: JSON.stringify({ testimonyText: "x".repeat(1024 * 1024 + 1) }),
      failOnStatusCode: false
    });
    expect(response.status()).toBe(413);
    expect(await response.json()).toMatchObject({ error: "Request body is too large." });
  });

  test("A03 unsupported API methods do not execute an analysis", async ({ request }) => {
    const response = await request.put(`${apiPath}/analyze`, { data: { testimonyText: sampleText }, failOnStatusCode: false });
    expect(response.status()).toBe(404);
    expect(await response.json()).toMatchObject({ error: "Not found" });
  });

  test("A04 requests outside the configured base path are rejected", async ({ request }) => {
    const response = await request.get("/api/health", { failOnStatusCode: false });
    expect(response.status()).toBe(404);
    expect(await response.json()).toMatchObject({ app: "healthcare-testimony" });
  });

  test("A05 path traversal cannot read files outside public assets", async ({ request }) => {
    const response = await request.get(`${appPath}/..%2Fpackage.json`, { failOnStatusCode: false });
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('"dependencies"');
  });

  test("A06 HTML in testimony is rendered as text and never executed", async ({ page }) => {
    await openApp(page);
    await page.getByLabel("Testimony text").fill('<img src=x onerror="window.__e2eXss=1"> Our AI guarantees care.');
    await page.getByRole("button", { name: "Run committee analysis" }).click();
    await waitForAnalysis(page);
    expect(await page.evaluate(() => window.__e2eXss)).toBeUndefined();
    await expect(page.locator("#claimAnalysis img")).toHaveCount(0);
    await expect(page.locator("#claimAnalysis")).toContainText("__e2eXss=1");
  });

  test("A07 unknown committee codes do not create invented committee results", async ({ request }) => {
    const response = await request.post(`${apiPath}/analyze`, {
      data: { testimonyText: "A neutral operational statement with enough words for extraction.", healthcareTopic: "", committees: ["invented_committee"] }
    });
    expect(response.ok()).toBeTruthy();
    const analysis = await response.json();
    expect(analysis.committeeCodes).toEqual([]);
    expect(analysis.senators).toEqual([]);
  });

  test("A08 unknown job identifiers return a controlled 404", async ({ request }) => {
    const response = await request.get(`${apiPath}/jobs/not-a-real-job`, { failOnStatusCode: false });
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: "Job not found." });
  });

  test("A09 OpenAI stays disabled in deterministic CI", async ({ request }) => {
    const response = await request.post(`${apiPath}/analyze`, { data: { testimonyText: sampleText, healthcareTopic: "prior authorization" } });
    expect(response.ok()).toBeTruthy();
    const analysis = await response.json();
    expect(analysis.llm).toMatchObject({ used: false });
    expect(JSON.stringify(analysis)).not.toMatch(/sk-[A-Za-z0-9_-]+/);
  });

  test("A10 browser and API responses carry baseline security headers", async ({ request }) => {
    for (const path of [appPath, `${apiPath}/health`]) {
      const response = await request.get(path);
      expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
      expect(response.headers()["x-content-type-options"]).toBe("nosniff");
      expect(response.headers()["x-frame-options"]).toBe("DENY");
      expect(response.headers()["referrer-policy"]).toBe("no-referrer");
    }
  });
});
