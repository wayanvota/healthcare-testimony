export function auditCitations({ alignmentResults = [], questions = [], rewrites = [], evidence = [], sources = [] } = {}) {
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const sourceUrls = new Set(sources.map((source) => source.url));
  const warnings = [];
  const errors = [];

  for (const result of alignmentResults) {
    if (mentionsSenator(result.riskSummary, result.senatorName) && !isThinEvidenceNotice(result.riskSummary) && !result.citedEvidenceItemIds.length) {
      errors.push(`Unsupported senator-specific claim for ${result.senatorName}.`);
    }
    validateEvidenceIds(result.citedEvidenceItemIds, evidenceById, errors);
    validateCitationUrls(result.citations, sourceUrls, errors);
    if (result.thinEvidenceWarning) warnings.push(`Thin evidence for ${result.senatorName} on ${result.topic || "selected topic"}.`);
  }

  for (const question of questions) {
    if (!question.citedEvidenceItemIds.length) errors.push(`Question for ${question.senatorName} lacks cited evidence.`);
    validateEvidenceIds(question.citedEvidenceItemIds, evidenceById, errors);
  }

  for (const rewrite of rewrites) {
    if (!/recommendation|safer|avoids|strategic/i.test(rewrite.whySafer || "")) {
      warnings.push(`Rewrite ${rewrite.id} should be labeled as a recommendation.`);
    }
    validateEvidenceIds(rewrite.citedEvidenceItemIds, evidenceById, errors);
  }

  for (const item of evidence) {
    if (item.quote && item.source?.rawText && !item.source.rawText.includes(item.quote)) {
      errors.push(`Evidence quote does not appear in retrieved source text: ${item.id}.`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings: [...new Set(warnings)]
  };
}

export function blockUnsupportedSenatorClaims(output, knownSenatorNames = []) {
  const text = typeof output === "string" ? output : JSON.stringify(output);
  const unsupported = knownSenatorNames.filter((name) => text.includes(name) && !/"citations"|citedEvidenceItemIds|Citation/.test(text));
  return {
    passed: unsupported.length === 0,
    errors: unsupported.map((name) => `Output mentions ${name} without citations.`)
  };
}

function mentionsSenator(text = "", senatorName = "") {
  return senatorName && String(text).includes(senatorName);
}

function isThinEvidenceNotice(text = "") {
  return /evidence is thin|public record is thin|do not assert/i.test(String(text));
}

function validateEvidenceIds(ids = [], evidenceById, errors) {
  for (const id of ids || []) {
    if (!evidenceById.has(id)) errors.push(`Citation references unknown evidence item ${id}.`);
  }
}

function validateCitationUrls(citations = [], sourceUrls, errors) {
  for (const citation of citations || []) {
    if (!citation.url || !sourceUrls.has(citation.url)) errors.push(`Citation URL was not retrieved: ${citation.url || "(missing)"}.`);
  }
}
