import test from "node:test";
import assert from "node:assert/strict";
import { createAppServer } from "../src/server.mjs";
import { runAnalysis } from "../src/lib/analysis.mjs";
import { buildMarkdownReport } from "../src/lib/reportBuilder.mjs";
import { DEMO_INPUT } from "../src/lib/fixtures.mjs";

test("red-team questions are tied to claims and evidence", () => {
  const analysis = runAnalysis(DEMO_INPUT);
  assert.ok(analysis.questions.length > 0);
  assert.ok(analysis.questions[0].claimId);
  assert.ok(analysis.questions[0].citedEvidenceItemIds.length > 0);
  assert.match(analysis.questions[0].likelyQuestion, /denied or delayed/);
});

test("markdown export includes citations", () => {
  const analysis = runAnalysis(DEMO_INPUT);
  const markdown = buildMarkdownReport(analysis);
  assert.match(markdown, /Source list/);
  assert.match(markdown, /https:\/\/www\.finance\.senate\.gov\//);
});

test("app runs locally without API keys and respects BASE_PATH", async () => {
  const server = createAppServer();
  const health = JSON.parse((await mockGet(server, "/healthcare-testimony/api/health")).body);
  assert.equal(health.ok, true);
  assert.equal(health.basePath, "/healthcare-testimony");
  const home = (await mockGet(server, "/healthcare-testimony")).body;
  assert.match(home, /Healthcare CEO Senate Testimony Alignment Tool/);
});

test("project is standalone with no Appropriations testimony dependency", async () => {
  const pkg = await import("../package.json", { with: { type: "json" } });
  assert.equal(Boolean(pkg.default.dependencies?.pg), true);
  const analysis = runAnalysis(DEMO_INPUT);
  assert.equal(Boolean(analysis.markdown.includes("does not depend on the Senate Appropriations testimony tool")), true);
});

function mockGet(server, url) {
  return new Promise((resolve, reject) => {
    const req = { method: "GET", url, headers: { host: "localhost" } };
    const res = {
      statusCode: 200,
      headers: {},
      writeHead(statusCode, headers) {
        this.statusCode = statusCode;
        this.headers = headers;
      },
      end(body = "") {
        resolve({ statusCode: this.statusCode, headers: this.headers, body: Buffer.isBuffer(body) ? body.toString("utf8") : String(body) });
      }
    };
    server.emit("request", req, res);
    setTimeout(() => reject(new Error(`No response for ${url}`)), 1000).unref();
  });
}
