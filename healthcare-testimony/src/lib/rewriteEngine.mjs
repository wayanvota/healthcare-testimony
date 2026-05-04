export function rewriteTestimony({ claims = [], alignmentResults = [], evidence = [] } = {}) {
  const rewrites = [];
  for (const claim of claims) {
    const relatedResults = alignmentResults.filter((result) => result.claimId === claim.id);
    const riskyResults = relatedResults.filter((result) => result.riskLevel === "high" || result.alignmentScore < 0);
    if (!riskyResults.length && claim.riskLevel !== "high") continue;
    const citedIds = [...new Set(riskyResults.flatMap((result) => result.citedEvidenceItemIds))];
    const cited = evidence.filter((item) => citedIds.includes(item.id)).slice(0, 3);
    rewrites.push({
      id: `rw_${rewrites.length + 1}`,
      originalText: claim.claimText,
      riskExplanation: riskExplanationFor(claim, riskyResults),
      suggestedRewrite: suggestedRewriteFor(claim),
      whySafer: "This is a strategic communications recommendation, not legal advice. It avoids unsupported guarantees, names operational safeguards, and keeps factual claims within what the CEO can document.",
      relevantSenatorConcerns: riskyResults.slice(0, 5).map((result) => ({
        senatorName: result.senatorName,
        concern: result.riskSummary
      })),
      citedEvidenceItemIds: cited.map((item) => item.id),
      citations: cited.flatMap((item) => item.citations || [])
    });
  }
  return { rewrites };
}

function riskExplanationFor(claim, results) {
  if (claim.issueTags.includes("ai_healthcare") && claim.issueTags.includes("prior_authorization")) {
    return "Automated prior authorization language can trigger questions about denials, delays, human review, appeal rights, auditability, and patient access.";
  }
  if (claim.riskTerms?.length) return `High-risk language detected: ${claim.riskTerms.join(", ")}.`;
  if (results.length) return "The claim is in tension with cited public concerns for at least one senator.";
  return "The claim lacks enough public evidence support.";
}

function suggestedRewriteFor(claim) {
  if (claim.issueTags.includes("ai_healthcare") && claim.issueTags.includes("prior_authorization")) {
    return "Our platform supports clinical and administrative reviewers by flagging missing documentation and routing routine cases more efficiently, while final coverage decisions remain subject to human review, appeal rights, audit controls, and patient access safeguards.";
  }
  if (claim.issueTags.includes("drug_pricing") || claim.issueTags.includes("pbm")) {
    return "We are prepared to provide committee staff with documented data on how this approach affects patient out-of-pocket costs, plan spending, and pharmacy access.";
  }
  if (claim.issueTags.includes("hospital_consolidation")) {
    return "We will describe the transaction's patient access rationale, competition safeguards, and measurable commitments on prices, service lines, and local care availability.";
  }
  return "We will provide documented results, identify remaining limits, and follow up with committee staff where exact figures are not available today.";
}
