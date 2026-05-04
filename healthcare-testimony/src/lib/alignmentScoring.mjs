import { issueRelevanceForCommittee } from "./healthcareTaxonomy.mjs";
import { COMMITTEES } from "./committees.mjs";
import { clamp, lower } from "./utils.mjs";

export function scoreAlignment({ claims = [], senators = [], evidence = [], committeeCodes = [], topic = "" } = {}) {
  const results = [];
  for (const claim of claims) {
    for (const senator of senators) {
      const senatorEvidence = evidence
        .filter((item) => item.senatorId === senator.id)
        .filter((item) => item.issueTags.some((tag) => claim.issueTags.includes(tag)))
        .sort((a, b) => b.rankScore - a.rankScore);
      const committeeCode = bestCommitteeForClaim(senator, claim, committeeCodes);
      const scored = scoreOne({ claim, senator, senatorEvidence, committeeCode, topic });
      results.push(scored);
    }
  }
  return {
    results,
    matrix: buildMatrix(results, senators)
  };
}

export function scoreOne({ claim, senator, senatorEvidence, committeeCode, topic }) {
  const text = lower(claim.claimText);
  const topicMatch = topic ? overlapScore(topic, `${claim.claimText} ${claim.issueTags.join(" ")}`) : 0.5;
  const issueTagMatch = senatorEvidence.length ? Math.min(1, senatorEvidence[0].issueTags.filter((tag) => claim.issueTags.includes(tag)).length / Math.max(1, claim.issueTags.length)) : 0;
  const stanceCompatibility = compatibilityScore(text, senatorEvidence);
  const evidenceStrength = senatorEvidence.length ? clamp(senatorEvidence.reduce((sum, item) => sum + item.evidenceWeight * item.confidence, 0) / Math.min(3, senatorEvidence.length), 0, 1) : 0;
  const recencyWeight = senatorEvidence.length ? recencyScore(senatorEvidence[0].evidenceDate) : 0;
  const committeeRelevance = issueRelevanceForCommittee(claim.issueTags, committeeCode);
  const roleInfluence = senator.committeeRoles?.some((role) => /chair|ranking|senior/i.test(role)) ? 1 : 0.5;
  const riskPenalty = riskPenaltyForClaim(text, claim, senatorEvidence);
  const raw =
    topicMatch * 0.2 +
    issueTagMatch * 0.2 +
    stanceCompatibility * 0.25 +
    evidenceStrength * 0.15 +
    recencyWeight * 0.05 +
    committeeRelevance * 0.1 +
    roleInfluence * 0.05 -
    riskPenalty;
  const alignmentScore = mapRawToScore(raw, senatorEvidence.length);
  const riskLevel = riskLevelFromScore(alignmentScore, claim.riskLevel, senatorEvidence.length);
  const evidenceStrengthLabel = senatorEvidence.length === 0 ? "none" : senatorEvidence.length === 1 || evidenceStrength < 0.45 ? "thin" : evidenceStrength > 0.7 ? "strong" : "moderate";
  const topEvidence = senatorEvidence.slice(0, 3);
  return {
    claimId: claim.id,
    senatorId: senator.id,
    senatorName: senator.fullName,
    stateCode: senator.stateCode,
    party: senator.party,
    committeeCode,
    committeeName: COMMITTEES[committeeCode]?.shortName || committeeCode,
    topic,
    alignmentScore,
    alignmentLabel: labelForScore(alignmentScore),
    rawScore: Number(raw.toFixed(3)),
    evidenceStrength: evidenceStrengthLabel,
    riskLevel,
    riskSummary: summarizeRisk(claim, senator, topEvidence, evidenceStrengthLabel, alignmentScore),
    likelyQuestion: likelyQuestionFor(claim, senator, topEvidence),
    answerFrame: answerFrameFor(claim, topEvidence),
    recommendedRewrite: "",
    citedEvidenceItemIds: topEvidence.map((item) => item.id),
    citations: topEvidence.flatMap((item) => item.citations || []),
    thinEvidenceWarning: evidenceStrengthLabel === "thin" || evidenceStrengthLabel === "none"
  };
}

function bestCommitteeForClaim(senator, claim, fallbackCodes) {
  const senatorCodes = senator.committeeCodes || [];
  let best = senatorCodes[0] || fallbackCodes[0] || "help";
  let bestScore = -1;
  for (const code of [...senatorCodes, ...fallbackCodes]) {
    const score = issueRelevanceForCommittee(claim.issueTags, code);
    if (score > bestScore) {
      best = code;
      bestScore = score;
    }
  }
  return best;
}

function compatibilityScore(claimText, evidence) {
  if (!evidence.length) return 0;
  const stance = evidence[0].stanceDirection || "";
  const hasSafeguards = ["human", "appeal", "audit", "oversight", "transparen", "clinical", "safeguard"].some((term) => claimText.includes(term));
  const isBroadAutomationClaim = claimText.includes("automates") || claimText.includes("ensures") || claimText.includes("guarantee");
  if (/safeguard|access|accountability|privacy|competition|fiscal/.test(stance)) {
    if (hasSafeguards) return 0.65;
    if (isBroadAutomationClaim) return -0.75;
    return -0.2;
  }
  if (/support|funding_access/.test(stance)) return hasSafeguards ? 0.8 : 0.45;
  return 0.1;
}

function riskPenaltyForClaim(claimText, claim, evidence) {
  let penalty = claim.riskLevel === "high" ? 0.55 : claim.riskLevel === "medium" ? 0.25 : 0.05;
  if (claimText.includes("automates") && !claimText.includes("human")) penalty += 0.2;
  if (claimText.includes("ensures") && !claimText.includes("evidence")) penalty += 0.1;
  if (!evidence.length) penalty += 0.05;
  return penalty;
}

function mapRawToScore(raw, evidenceCount) {
  if (evidenceCount === 0) return 0;
  if (raw >= 0.65) return 2;
  if (raw >= 0.25) return 1;
  if (raw <= -0.45) return -2;
  if (raw <= -0.1) return -1;
  return 0;
}

function riskLevelFromScore(score, claimRisk, evidenceCount) {
  if (score <= -2 || (score < 0 && claimRisk === "high")) return "high";
  if (score < 0 || claimRisk === "medium" || evidenceCount <= 1) return "medium";
  return "low";
}

function summarizeRisk(claim, senator, evidence, strength, score) {
  if (!evidence.length) return `Evidence is thin for ${senator.fullName}; do not assert a senator-specific position without more public record support.`;
  const basis = evidence[0].summary;
  if (score < 0) return `Based on public record, this claim may create tension with ${senator.fullName}'s cited focus. ${basis}`;
  if (score > 0) return `The cited evidence suggests partial alignment with ${senator.fullName}'s public priorities, but avoid overstating support. ${basis}`;
  return `The public record is ${strength}; treat this as neutral unless additional cited evidence is retrieved.`;
}

function likelyQuestionFor(claim, senator, evidence) {
  const text = lower(claim.claimText);
  if (text.includes("automates") && claim.issueTags.includes("prior_authorization")) {
    return "How many patients were denied or delayed because of your algorithm?";
  }
  if (claim.issueTags.includes("hospital_consolidation")) return "How will this affect prices, competition, and patient choice in my state?";
  if (claim.issueTags.includes("pbm")) return "Where exactly do rebates and spreads go, and how much reaches patients at the pharmacy counter?";
  if (claim.issueTags.includes("cybersecurity")) return "What incident response and patient safety protections are in place if systems go down?";
  if (!evidence.length) return "Can you provide committee staff with source data supporting that claim?";
  return "What evidence can you provide that patients benefit from this policy or product?";
}

function answerFrameFor(claim) {
  const frames = ["Lead with patient impact and source-grounded limits.", "Describe what is measured and what remains under review."];
  if (claim.issueTags.includes("ai_healthcare")) frames.push("Name human oversight, audit controls, and accountability procedures.");
  if (claim.issueTags.includes("prior_authorization")) frames.push("Address appeal rights, denials, delays, and medically necessary care.");
  if (claim.issueTags.includes("hospital_consolidation")) frames.push("Address competition safeguards and patient-facing cost effects.");
  return frames;
}

function buildMatrix(results, senators) {
  return senators.map((senator) => {
    const senatorResults = results.filter((result) => result.senatorId === senator.id);
    const avg = senatorResults.length ? senatorResults.reduce((sum, item) => sum + item.alignmentScore, 0) / senatorResults.length : 0;
    const highestRisk = senatorResults.sort((a, b) => riskRank(b.riskLevel) - riskRank(a.riskLevel))[0];
    const topCitation = highestRisk?.citations?.[0] || null;
    return {
      senatorId: senator.id,
      senator: senator.fullName,
      state: senator.stateCode,
      party: senator.party,
      committeeRole: senator.committeeRoles?.join("; ") || "Member",
      relevantCommittee: highestRisk?.committeeName || senator.committeeCodes?.[0] || "",
      issueRelevance: highestRisk ? Number(issueRelevanceForCommittee([], highestRisk.committeeCode).toFixed(2)) : 0,
      alignmentScore: Math.round(avg),
      alignmentLabel: labelForScore(Math.round(avg)),
      riskLevel: highestRisk?.riskLevel || "medium",
      evidenceStrength: highestRisk?.evidenceStrength || "none",
      likelyConcern: highestRisk?.likelyQuestion || "Evidence is thin.",
      topCitedSource: topCitation
    };
  });
}

function overlapScore(a, b) {
  const aWords = new Set(lower(a).split(/\W+/).filter((word) => word.length > 3));
  const bWords = new Set(lower(b).split(/\W+/).filter((word) => word.length > 3));
  if (!aWords.size) return 0;
  let matches = 0;
  for (const word of aWords) if (bWords.has(word)) matches += 1;
  return clamp(matches / aWords.size, 0, 1);
}

function recencyScore(date) {
  const year = Number(String(date || "").slice(0, 4));
  if (!year) return 0.3;
  return clamp((year - 2020) / 5, 0.2, 1);
}

function labelForScore(score) {
  return {
    2: "strongly aligned",
    1: "partially aligned",
    0: "neutral / no clear record",
    "-1": "tension",
    "-2": "direct conflict / likely attack line"
  }[score];
}

function riskRank(level) {
  return { high: 3, medium: 2, low: 1 }[level] || 0;
}
