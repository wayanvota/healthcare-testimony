import { listCommittees, normalizeCommitteeCodes } from "./committees.mjs";
import { DEMO_INPUT } from "./fixtures.mjs";
import { committeesForIssueTags, detectIssueTags, getIssue } from "./healthcareTaxonomy.mjs";
import { parseTestimonyInput } from "./documentParser.mjs";
import { extractClaims } from "./claimExtractor.mjs";
import { getRelevantSenators } from "./roster.mjs";
import { retrieveEvidence } from "./retrieval.mjs";
import { scoreAlignment } from "./alignmentScoring.mjs";
import { generateQuestions } from "./questionGenerator.mjs";
import { rewriteTestimony } from "./rewriteEngine.mjs";
import { auditCitations } from "./citationAuditor.mjs";
import { enhanceAnalysisWithLlm } from "./openaiClient.mjs";
import { buildMarkdownReport } from "./reportBuilder.mjs";
import { buildDataReadiness } from "./dataReadiness.mjs";
import { stableId, unique } from "./utils.mjs";

export function runAnalysis(input = {}) {
  const parsed = parseTestimonyInput(input.testimonyText || input.healthcareTopic ? input : DEMO_INPUT);
  const topicTags = detectIssueTags(`${parsed.healthcareTopic} ${parsed.testimonyText} ${parsed.companyType}`);
  const explicitCommittees = normalizeCommitteeCodes(input.committees || input.committeeCodes || []);
  const autoCommittees = committeesForIssueTags(topicTags);
  const committeeCodes = unique([...(explicitCommittees.length ? explicitCommittees : autoCommittees), ...autoCommittees]).slice(0, 6);
  const committees = committeeCodes.map((code) => listCommittees().find((committee) => committee.code === code)).filter(Boolean);
  const senators = getRelevantSenators(committeeCodes, {
    includeSenators: input.includeSenators || input.specificSenators || "",
    excludeSenators: input.excludeSenators || ""
  });
  const { claims } = extractClaims({ ...parsed, healthcareTopic: parsed.healthcareTopic });
  const allClaimTags = unique([...topicTags, ...claims.flatMap((claim) => claim.issueTags)]);
  const retrieval = retrieveEvidence({ senators, issueTags: allClaimTags, topic: parsed.healthcareTopic, committeeCodes });
  const scored = scoreAlignment({ claims, senators, evidence: retrieval.evidence, committeeCodes, topic: parsed.healthcareTopic });
  const questionResult = generateQuestions({ claims, senators, alignmentResults: scored.results, evidence: retrieval.evidence });
  const rewriteResult = rewriteTestimony({ claims, alignmentResults: scored.results, evidence: retrieval.evidence });
  const dataReadiness = buildDataReadiness({ claims, issueTags: allClaimTags });
  const audit = auditCitations({
    alignmentResults: scored.results,
    questions: questionResult.questions,
    rewrites: rewriteResult.rewrites,
    evidence: retrieval.evidence,
    sources: retrieval.sources
  });
  const senatorCards = buildSenatorCards({ senators, alignmentResults: scored.results, questions: questionResult.questions, evidence: retrieval.evidence });
  const analysis = {
    id: stableId("analysis", JSON.stringify({ parsed, committeeCodes, claims })),
    input: parsed,
    committeeCodes,
    committees,
    issueTags: allClaimTags,
    issueLabels: allClaimTags.map((tag) => getIssue(tag)?.issueLabel || tag),
    senators,
    claims,
    evidence: retrieval.evidence,
    sources: retrieval.sources,
    alignmentResults: scored.results,
    matrix: scored.matrix,
    questions: questionResult.questions,
    rewrites: rewriteResult.rewrites,
    dataReadiness,
    senatorCards,
    audit,
    executiveSummary: buildExecutiveSummary({ claims, matrix: scored.matrix, alignmentResults: scored.results, committees, rewrites: rewriteResult.rewrites })
  };
  analysis.markdown = buildMarkdownReport(analysis, "ceo_briefing_memo");
  return analysis;
}

export async function runAnalysisDynamic(input = {}, config = {}) {
  const deterministic = runAnalysis(input);
  return enhanceAnalysisWithLlm(config, deterministic);
}

function buildExecutiveSummary({ claims, matrix, alignmentResults, committees, rewrites }) {
  const riskyClaims = claims.filter((claim) => claim.riskLevel === "high" || alignmentResults.some((result) => result.claimId === claim.id && result.alignmentScore < 0));
  const alignedClaims = claims.filter((claim) => alignmentResults.some((result) => result.claimId === claim.id && result.alignmentScore > 0));
  const highRiskSenators = matrix
    .filter((row) => row.riskLevel === "high" || row.alignmentScore < 0)
    .sort((a, b) => riskSort(b) - riskSort(a))
    .slice(0, 5);
  const riskScore = Math.min(100, Math.round(35 + riskyClaims.length * 15 + highRiskSenators.length * 6 - alignedClaims.length * 4));
  return {
    overallRiskScore: riskScore,
    alignedClaims: alignedClaims.length,
    riskyClaims: riskyClaims.length,
    highestRiskSenators: highRiskSenators,
    highestRiskClaims: riskyClaims.slice(0, 5),
    strongestJurisdictionCommittees: committees.slice(0, 4).map((committee) => committee.shortName),
    evidenceConfidenceWarning: alignmentResults.some((result) => result.thinEvidenceWarning)
      ? "Some senator-topic outputs rely on thin evidence. Avoid asserting alignment without additional public record support."
      : "Evidence coverage is adequate for deterministic local analysis.",
    topRecommendedEdits: rewrites.slice(0, 3).map((rewrite) => rewrite.suggestedRewrite)
  };
}

function buildSenatorCards({ senators, alignmentResults, questions, evidence }) {
  return senators.map((senator) => {
    const senatorResults = alignmentResults.filter((result) => result.senatorId === senator.id);
    const senatorQuestions = questions.filter((question) => question.senatorId === senator.id);
    const citedEvidence = evidence.filter((item) => item.senatorId === senator.id).slice(0, 4);
    const issuePriorities = unique(citedEvidence.flatMap((item) => item.issueTags)).slice(0, 6);
    return {
      senatorId: senator.id,
      name: senator.fullName,
      state: senator.stateCode,
      party: senator.party,
      committeeRole: senator.committeeRoles?.join("; ") || "Member",
      relevantSubcommittees: senator.subcommittees?.map((item) => `${item.subcommitteeName}: ${item.role}`) || [],
      healthcareIssuePriorities: issuePriorities,
      evidenceSummary: citedEvidence.length
        ? citedEvidence.map((item) => item.summary).join(" ")
        : "Evidence is thin for this senator-topic pair.",
      alignmentWithCeoTestimony: summarizeCardAlignment(senatorResults),
      likelyQuestions: senatorQuestions.length ? senatorQuestions.map((item) => item.likelyQuestion) : senatorResults.slice(0, 2).map((item) => item.likelyQuestion),
      bestAnswerFrames: unique(senatorResults.flatMap((item) => item.answerFrame)).slice(0, 5),
      phrasesToUse: phrasesToUse(senatorResults),
      phrasesToAvoid: phrasesToAvoid(senatorResults),
      citations: citedEvidence.flatMap((item) => item.citations || []),
      confidenceLevel: confidenceLabel(senatorResults)
    };
  });
}

function summarizeCardAlignment(results) {
  const avg = results.length ? results.reduce((sum, item) => sum + item.alignmentScore, 0) / results.length : 0;
  if (avg < -0.5) return "Likely tension with parts of the testimony; answer with safeguards and source-backed limits.";
  if (avg > 0.5) return "Some cited priorities may align, but do not claim senator support.";
  return "Neutral or thin public record; avoid senator-specific claims.";
}

function phrasesToUse(results) {
  const phrases = ["Based on public record", "patient access safeguards", "documented follow-up"];
  if (results.some((item) => item.topic?.toLowerCase().includes("ai"))) phrases.push("human review", "audit controls", "appeal rights");
  return unique(phrases);
}

function phrasesToAvoid(results) {
  const phrases = ["guarantees support", "never denies care", "fully automated without review"];
  if (results.some((item) => item.evidenceStrength === "thin")) phrases.push("the senator agrees with us");
  return unique(phrases);
}

function confidenceLabel(results) {
  if (!results.length || results.every((item) => item.evidenceStrength === "none")) return "low";
  if (results.some((item) => item.evidenceStrength === "strong")) return "medium-high";
  if (results.some((item) => item.evidenceStrength === "moderate")) return "medium";
  return "low / thin evidence";
}

function riskSort(row) {
  const risk = { high: 3, medium: 2, low: 1 }[row.riskLevel] || 0;
  return risk * 10 - row.alignmentScore;
}
