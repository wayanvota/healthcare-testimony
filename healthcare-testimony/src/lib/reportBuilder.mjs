import { listCommittees } from "./committees.mjs";

export function buildMarkdownReport(analysis, reportType = "ceo_briefing_memo") {
  if (reportType === "senator_cards") return senatorCardsMarkdown(analysis);
  if (reportType === "rewrite_memo") return rewriteMemoMarkdown(analysis);
  return ceoMemoMarkdown(analysis);
}

function ceoMemoMarkdown(analysis) {
  return [
    `# CEO Briefing Memo: ${analysis.input.hearingTitle}`,
    "",
    "This is a standalone healthcare-focused tool. It does not depend on the Senate Appropriations testimony tool.",
    "",
    "## Executive summary",
    `Overall risk score: **${analysis.executiveSummary.overallRiskScore}/100**.`,
    `Aligned claims: **${analysis.executiveSummary.alignedClaims}**. Risky claims: **${analysis.executiveSummary.riskyClaims}**.`,
    "",
    "## Hearing context",
    `Topic: ${analysis.input.healthcareTopic || "Not specified"}.`,
    `Organization: ${analysis.input.organizationName || "Not specified"}. CEO: ${analysis.input.ceoName || "Not specified"}.`,
    "",
    "## Committee jurisdiction",
    ...analysis.committees.map((committee) => `- **${committee.shortName}**: ${committee.jurisdictionSummary}`),
    "",
    "## Top strategic risks",
    ...analysis.executiveSummary.highestRiskClaims.map((claim) => `- ${claim.claimText}`),
    "",
    "## Top alignment opportunities",
    ...analysis.matrix.filter((row) => row.alignmentScore > 0).map((row) => `- ${row.senator}: ${row.alignmentLabel}`),
    "",
    "## Senator watchlist",
    ...analysis.executiveSummary.highestRiskSenators.map((row) => `- ${row.senator} (${row.relevantCommittee}): ${row.likelyConcern}`),
    "",
    "## Claim-by-claim analysis",
    ...analysis.claims.flatMap((claim) => [
      `### ${claim.claimText}`,
      `Type: ${claim.claimType}. Tags: ${claim.issueTags.join(", ")}. Risk: ${claim.riskLevel}.`,
      ...analysis.alignmentResults.filter((result) => result.claimId === claim.id).slice(0, 4).map((result) => `- ${result.senatorName}: ${result.alignmentLabel}; ${result.riskSummary} ${citationLinks(result.citations)}`)
    ]),
    "",
    "## Recommended testimony edits",
    ...analysis.rewrites.map((rewrite) => `- Original: ${rewrite.originalText}\n  Suggested: ${rewrite.suggestedRewrite}\n  Citations: ${citationLinks(rewrite.citations)}`),
    "",
    "## Red-team Q&A",
    ...analysis.questions.map((question) => `- **${question.senatorName}**: ${question.likelyQuestion}\n  Answer frame: ${question.answerFrame.join(" ")}\n  Citation: ${citationLinks(question.citations)}`),
    "",
    "## Evidence confidence and caveats",
    ...analysis.audit.warnings.map((warning) => `- ${warning}`),
    "Every senator-specific factual claim should be read as based on public record and subject to source limits.",
    "",
    "## Source list",
    ...sourceList(analysis)
  ].join("\n");
}

function senatorCardsMarkdown(analysis) {
  return [
    `# Senator Q&A Cards: ${analysis.input.hearingTitle}`,
    "",
    ...analysis.senatorCards.flatMap((card) => [
      `## ${card.name} (${card.party}-${card.state})`,
      `Committee role: ${card.committeeRole}`,
      `Healthcare priorities: ${card.healthcareIssuePriorities.join(", ")}`,
      `Evidence summary: ${card.evidenceSummary}`,
      "Likely questions:",
      ...card.likelyQuestions.map((item) => `- ${item}`),
      `Strong answer frame: ${card.bestAnswerFrames.join(" ")}`,
      `Weak answer to avoid: ${card.phrasesToAvoid.join("; ")}`,
      `Citations: ${citationLinks(card.citations)}`,
      ""
    ])
  ].join("\n");
}

function rewriteMemoMarkdown(analysis) {
  return [
    `# Testimony Rewrite Memo: ${analysis.input.hearingTitle}`,
    "",
    ...analysis.rewrites.flatMap((rewrite) => [
      `## High-risk language`,
      rewrite.originalText,
      `Why risky: ${rewrite.riskExplanation}`,
      `Suggested rewrite: ${rewrite.suggestedRewrite}`,
      `Why safer: ${rewrite.whySafer}`,
      `Evidence basis: ${citationLinks(rewrite.citations)}`,
      ""
    ])
  ].join("\n");
}

function citationLinks(citations = []) {
  if (!citations.length) return "[missing citation]";
  return citations.map((citation) => `[${citation.title}](${citation.url})`).join("; ");
}

function sourceList(analysis) {
  const seen = new Set();
  const rows = [];
  for (const item of analysis.evidence || []) {
    for (const citation of item.citations || []) {
      if (seen.has(citation.url)) continue;
      seen.add(citation.url);
      rows.push(`- [${citation.title}](${citation.url}) (${citation.publisher}, ${citation.reliability})`);
    }
  }
  if (!rows.length) {
    return listCommittees().map((committee) => `- [${committee.name}](${committee.officialUrl})`);
  }
  return rows;
}
