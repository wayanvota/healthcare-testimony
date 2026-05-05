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

test("claim extraction flags overbroad automation and guarantee language", () => {
  const { claims } = extractClaims({
    healthcareTopic: "AI prior authorization Medicare Advantage",
    testimonyText: "Our proprietary AI platform fully automates prior authorization decisions and eliminates unnecessary care delays. The algorithm never denies medically necessary care, guarantees faster access for every patient, and creates major cost savings for Medicare Advantage plans without affecting patient outcomes."
  });
  const riskTerms = claims.flatMap((claim) => claim.riskTerms);
  assert.ok(claims.every((claim) => claim.riskLevel === "high"));
  assert.ok(riskTerms.includes("proprietary ai platform"));
  assert.ok(riskTerms.includes("fully automates"));
  assert.ok(riskTerms.includes("eliminates unnecessary care delays"));
  assert.ok(riskTerms.includes("never denies medically necessary care"));
  assert.ok(riskTerms.includes("guarantees faster access"));
  assert.ok(riskTerms.includes("every patient"));
  assert.ok(riskTerms.includes("major cost savings"));
  assert.ok(riskTerms.includes("without affecting patient outcomes"));
});
