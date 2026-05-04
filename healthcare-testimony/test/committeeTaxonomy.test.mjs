import test from "node:test";
import assert from "node:assert/strict";
import { committeesForIssueTags, getIssue } from "../src/lib/healthcareTaxonomy.mjs";

test("healthcare taxonomy maps issues to correct committees", () => {
  assert.deepEqual(getIssue("medicare_advantage").primaryCommitteeCodes, ["finance"]);
  assert.ok(getIssue("medicare_advantage").secondaryCommitteeCodes.includes("aging"));
  assert.deepEqual(getIssue("ai_healthcare").primaryCommitteeCodes, ["help"]);
  assert.ok(getIssue("ai_healthcare").secondaryCommitteeCodes.includes("judiciary"));
  assert.deepEqual(getIssue("pbm").primaryCommitteeCodes, ["finance"]);
  assert.deepEqual(getIssue("hospital_consolidation").primaryCommitteeCodes, ["judiciary"]);
  assert.deepEqual(getIssue("cybersecurity").primaryCommitteeCodes, ["homeland_security"]);
  assert.deepEqual(getIssue("nih_funding").primaryCommitteeCodes, ["appropriations_lhhs"]);
  assert.ok(committeesForIssueTags(["ai_healthcare", "prior_authorization", "medicare_advantage", "patient_access"]).includes("finance"));
});
