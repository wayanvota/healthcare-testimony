import { detectIssueTags } from "./healthcareTaxonomy.mjs";
import { lower, splitSentencesWithSpans, unique } from "./utils.mjs";

const HIGH_RISK_PATTERNS = [
  "guarantee",
  "always",
  "never",
  "fully safe",
  "eliminates risk",
  "no patient harm",
  "no denials",
  "automated decisions",
  "automates routine decisions",
  "proprietary algorithm",
  "cost savings without evidence",
  "efficiency without access safeguards",
  "ai without human oversight",
  "prior authorization without appeal rights",
  "price transparency without patient impact",
  "consolidation without competition safeguards"
];

const CLAIM_CUES = [
  "we ", "our ", "will ", "supports ", "ensures ", "reduces ", "improves ", "automates ",
  "protects ", "provides ", "commits ", "invests ", "saves ", "increases "
];

export function extractClaims(input = {}) {
  const text = String(input.testimonyText || input.text || "");
  const topic = String(input.healthcareTopic || input.topic || "");
  const sentences = splitSentencesWithSpans(text);
  const claims = [];
  for (const sentence of sentences) {
    const sentenceLower = lower(sentence.text);
    const hasCue = CLAIM_CUES.some((cue) => sentenceLower.includes(cue)) || detectIssueTags(sentence.text).length > 0;
    if (!hasCue) continue;
    const issueTags = unique([...detectIssueTags(topic), ...detectIssueTags(sentence.text)]);
    if (!issueTags.length && sentence.text.length < 35) continue;
    const highRiskMatches = HIGH_RISK_PATTERNS.filter((pattern) => sentenceLower.includes(pattern));
    const claimType = classifyClaim(sentenceLower, issueTags);
    const riskLevel = determineRiskLevel(sentenceLower, issueTags, highRiskMatches);
    claims.push({
      id: `claim_${claims.length + 1}`,
      claimText: sentence.text,
      claimType,
      issueTags,
      riskLevel,
      supportStatus: "unreviewed",
      riskTerms: highRiskMatches,
      sourceSpan: { start: sentence.start, end: sentence.end }
    });
  }
  return { claims };
}

function classifyClaim(sentence, issueTags) {
  if (issueTags.includes("ai_healthcare") || issueTags.includes("algorithmic_decision_support")) return "AI_claim";
  if (sentence.includes("cost") || sentence.includes("savings") || sentence.includes("affordable")) return "cost_claim";
  if (sentence.includes("quality") || sentence.includes("outcome")) return "quality_claim";
  if (sentence.includes("safe") || sentence.includes("harm")) return "safety_claim";
  if (sentence.includes("access") || sentence.includes("medically necessary")) return "access_claim";
  if (sentence.includes("comply") || sentence.includes("compliance")) return "compliance_claim";
  if (sentence.includes("ask") || sentence.includes("congress should") || sentence.includes("policy")) return "policy_ask";
  if (sentence.includes("patients") || sentence.includes("beneficiaries")) return "patient_impact_claim";
  if (sentence.includes("reduce") || sentence.includes("increase") || sentence.includes("improve")) return "performance_claim";
  return "value_claim";
}

function determineRiskLevel(sentence, issueTags, highRiskMatches) {
  let risk = 0;
  risk += highRiskMatches.length * 2;
  if (issueTags.includes("ai_healthcare") && sentence.includes("automates")) risk += 2;
  if (issueTags.includes("prior_authorization") && !sentence.includes("appeal")) risk += 1;
  if (issueTags.includes("ai_healthcare") && !sentence.includes("human")) risk += 1;
  if (sentence.includes("ensures") || sentence.includes("guarantee")) risk += 1;
  if (risk >= 4) return "high";
  if (risk >= 2) return "medium";
  return "low";
}
