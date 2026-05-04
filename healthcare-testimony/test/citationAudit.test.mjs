import test from "node:test";
import assert from "node:assert/strict";
import { auditCitations, blockUnsupportedSenatorClaims } from "../src/lib/citationAuditor.mjs";
import { runAnalysis } from "../src/lib/analysis.mjs";
import { DEMO_INPUT } from "../src/lib/fixtures.mjs";

test("citation auditor passes deterministic analysis with retrieved URLs", () => {
  const analysis = runAnalysis(DEMO_INPUT);
  assert.equal(analysis.audit.passed, true);
});

test("citation auditor blocks unsupported senator claims", () => {
  const audit = auditCitations({
    alignmentResults: [{
      senatorName: "Senator X",
      riskSummary: "Based on public record, Senator X supports this claim.",
      citedEvidenceItemIds: [],
      citations: []
    }],
    questions: [],
    rewrites: [],
    evidence: [],
    sources: []
  });
  assert.equal(audit.passed, false);
  assert.match(audit.errors[0], /Unsupported/);

  const llmAudit = blockUnsupportedSenatorClaims("Senator X supports this testimony.", ["Senator X"]);
  assert.equal(llmAudit.passed, false);
});
