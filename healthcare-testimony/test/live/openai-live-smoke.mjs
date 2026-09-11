import assert from "node:assert/strict";
import { runAnalysisDynamic } from "../../src/lib/analysis.mjs";
import { envConfig } from "../../src/lib/utils.mjs";

const config = envConfig({ ...process.env, USE_LLM: "true" });
assert.ok(config.openaiApiKey, "OPENAI_API_KEY is required for the live OpenAI smoke test.");

const analysis = await runAnalysisDynamic({
  hearingTitle: "AI and patient access oversight",
  committees: ["finance", "help"],
  healthcareTopic: "AI prior authorization and Medicare Advantage patient access",
  companyType: "AI healthcare company",
  ceoName: "Test Executive",
  organizationName: "Test Organization",
  testimonyText: "Our AI-assisted workflow helps staff review prior authorization documentation while preserving human review, appeal rights, and audit controls."
}, config);

assert.equal(analysis.llm?.enabled, true, "Live mode did not enable OpenAI synthesis.");
assert.equal(analysis.llm?.error, undefined, analysis.llm?.reason || "OpenAI request failed.");
assert.ok(
  analysis.llm?.used || (analysis.llm?.blocked && /citation validation|citation audit/i.test(analysis.llm.reason || "")),
  analysis.llm?.reason || "OpenAI response was neither accepted nor safely blocked by citation validation."
);

console.log(`OpenAI live smoke passed: ${analysis.llm.used ? "citation-gated synthesis accepted" : "unsupported synthesis safely blocked"}.`);
