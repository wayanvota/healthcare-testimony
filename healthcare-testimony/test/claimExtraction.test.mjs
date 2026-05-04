import test from "node:test";
import assert from "node:assert/strict";
import { extractClaims } from "../src/lib/claimExtractor.mjs";
import { DEMO_INPUT } from "../src/lib/fixtures.mjs";

test("claim extraction identifies high-risk AI and prior authorization claims", () => {
  const { claims } = extractClaims(DEMO_INPUT);
  assert.equal(claims.length, 1);
  const claim = claims[0];
  assert.equal(claim.riskLevel, "high");
  assert.equal(claim.claimType, "AI_claim");
  assert.ok(claim.issueTags.includes("ai_healthcare"));
  assert.ok(claim.issueTags.includes("prior_authorization"));
  assert.ok(claim.issueTags.includes("medicare_advantage"));
  assert.ok(claim.issueTags.includes("patient_access"));
  assert.ok(claim.sourceSpan.start >= 0);
  assert.ok(claim.sourceSpan.end > claim.sourceSpan.start);
});
