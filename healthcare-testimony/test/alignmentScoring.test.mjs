import test from "node:test";
import assert from "node:assert/strict";
import { runAnalysis } from "../src/lib/analysis.mjs";
import { DEMO_INPUT } from "../src/lib/fixtures.mjs";
import { extractClaims } from "../src/lib/claimExtractor.mjs";
import { scoreAlignment } from "../src/lib/alignmentScoring.mjs";

test("alignment scoring returns negative score when claim conflicts with cited evidence", () => {
  const analysis = runAnalysis(DEMO_INPUT);
  const wyden = analysis.alignmentResults.find((result) => result.senatorName === "Ron Wyden");
  assert.ok(wyden);
  assert.ok(wyden.alignmentScore < 0);
  assert.match(wyden.likelyQuestion, /denied or delayed/);
  assert.ok(wyden.citedEvidenceItemIds.length > 0);
});

test("alignment scoring returns thin-evidence warning when evidence count is low", () => {
  const { claims } = extractClaims(DEMO_INPUT);
  const result = scoreAlignment({
    claims,
    senators: [{ id: "sen_unknown", fullName: "Example Senator", stateCode: "ZZ", party: "I", committeeCodes: ["help"], committeeRoles: ["HELP: Member"] }],
    evidence: [],
    committeeCodes: ["help"],
    topic: DEMO_INPUT.healthcareTopic
  });
  assert.equal(result.results[0].thinEvidenceWarning, true);
  assert.equal(result.results[0].evidenceStrength, "none");
});
