import { test, expect } from '@playwright/test';

const STATIC_URL = process.env.HEALTHCARE_TESTIMONY_STATIC_URL || 'https://wayan.com/healthcare-testimony/';
const APP_URL = process.env.HEALTHCARE_TESTIMONY_APP_URL || 'https://healthcare-testimony.onrender.com/healthcare-testimony';
const API_BASE = process.env.HEALTHCARE_TESTIMONY_API_BASE || `${APP_URL}/api`;

const demoText =
  'Our AI-enabled prior authorization platform automates routine decisions, reduces administrative burden, and ensures patients get faster access to medically necessary care.';

test.describe('Healthcare Testimony live deployment', () => {
  test('static landing page links to Render app and Render API analyzes demo testimony', async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const failedApiRequests: string[] = [];
    page.on('requestfailed', (request) => {
      if (/\/api\//.test(request.url())) {
        failedApiRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`);
      }
    });

    await page.goto(STATIC_URL, { waitUntil: 'networkidle' });
    await expect(page.getByText(/Prepare the CEO/i)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('01-static-landing.png'), fullPage: true });

    const launch = page.getByRole('link', { name: /launch the tool|open tool/i }).first();
    await expect(launch).toBeVisible();
    await expect(launch).toHaveAttribute('href', /healthcare-testimony\.onrender\.com\/healthcare-testimony/);

    const health = await page.request.get(`${API_BASE}/health`);
    expect(health.ok(), `Render health endpoint failed with ${health.status()}`).toBe(true);
    const healthJson = await health.json();
    expect(healthJson).toMatchObject({ ok: true, app: 'healthcare-testimony', basePath: '/healthcare-testimony' });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel(/Setup panel/i)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('02-render-setup.png'), fullPage: true });

    await page.getByLabel(/Hearing title/i).fill('AI, Prior Authorization, and Patient Access in Medicare Advantage');
    await page.getByLabel(/Healthcare topic/i).fill('AI-enabled prior authorization in Medicare Advantage');
    await page.getByLabel(/CEO name/i).fill('Jane Doe');
    await page.getByLabel(/Organization/i).fill('Example Health AI');
    await page.getByLabel(/Testimony text/i).fill(demoText);

    await page.getByRole('button', { name: /Run committee analysis/i }).click();
    await expect(page.getByText(/How many patients were denied or delayed/i)).toBeVisible({ timeout: 60_000 });
    await page.screenshot({ path: testInfo.outputPath('03-render-results.png'), fullPage: true });

    const bodyText = await page.locator('body').innerText();
    const required = [
      /automates routine decisions/i,
      /prior authorization/i,
      /Medicare Advantage/i,
      /patient access/i,
      /human review|human oversight/i,
      /appeal rights|appeal/i,
      /audit|auditability/i,
      /denied or delayed|denials|delays/i,
      /CEO data readiness/i,
      /Citation|official|fixture/i
    ];
    const missing = required.filter((pattern) => !pattern.test(bodyText)).map(String);
    expect(missing, `Missing expected analysis terms: ${missing.join(', ')}`).toEqual([]);

    const genericOnly =
      /be transparent/i.test(bodyText) &&
      !/human review|appeal|audit|denied|delayed|algorithm/i.test(bodyText);
    expect(genericOnly, 'Tool appears to return generic advice only, not healthcare testimony risk analysis.').toBe(false);
    expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
    expect(failedApiRequests, `Failed API requests: ${failedApiRequests.join('\n')}`).toEqual([]);
  });
});
