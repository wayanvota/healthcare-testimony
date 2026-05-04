import { SAMPLE_EVIDENCE, SAMPLE_SOURCES } from "./fixtures.mjs";
import { lower, unique } from "./utils.mjs";

const TYPE_WEIGHTS = {
  bill_sponsorship: 1,
  amendment_sponsorship: 0.95,
  hearing_questioning: 0.9,
  committee_letter: 0.85,
  roll_call_vote: 0.8,
  opening_statement: 0.75,
  official_press_release: 0.6,
  official_social_post: 0.4,
  reputable_secondary_quote: 0.3,
  committee_page: 0.7
};

export function retrieveEvidence({ senators = [], issueTags = [], topic = "", committeeCodes = [] } = {}) {
  const senatorIds = new Set(senators.map((senator) => senator.id));
  const wantedTags = new Set(issueTags);
  const wantedCommittees = new Set(committeeCodes);
  const topicText = lower(topic);
  const results = SAMPLE_EVIDENCE
    .filter((item) => !senatorIds.size || senatorIds.has(item.senatorId))
    .map((item) => {
      const source = SAMPLE_SOURCES.find((candidate) => candidate.id === item.sourceId);
      const exactIssueMatches = item.issueTags.filter((tag) => wantedTags.has(tag)).length;
      const committeeMatch = wantedCommittees.has(item.committeeCode) ? 1 : 0;
      const topicDensity = topicText && lower(`${item.topic} ${item.summary} ${item.quote}`).split(/\W+/).filter((word) => word.length > 3 && topicText.includes(word)).length;
      const reliabilityBoost = source?.reliability === "official" ? 0.2 : 0;
      const rankScore = exactIssueMatches * 2 + committeeMatch + Math.min(1, topicDensity / 5) + reliabilityBoost + (TYPE_WEIGHTS[item.itemType] || item.evidenceWeight);
      return {
        ...item,
        source,
        rankScore,
        citations: source ? [{ sourceId: source.id, title: source.title, url: source.url, publisher: source.publisher, reliability: source.reliability }] : []
      };
    })
    .filter((item) => item.rankScore > 0 || !wantedTags.size)
    .sort((a, b) => b.rankScore - a.rankScore);

  return {
    evidence: dedupeEvidence(results),
    sources: SAMPLE_SOURCES
  };
}

export function evidenceForSenator(evidence, senatorId, issueTags = []) {
  const tags = new Set(issueTags);
  return evidence
    .filter((item) => item.senatorId === senatorId)
    .filter((item) => !tags.size || item.issueTags.some((tag) => tags.has(tag)))
    .sort((a, b) => b.rankScore - a.rankScore);
}

function dedupeEvidence(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = `${item.source?.url || item.sourceId}:${item.evidenceKey}:${item.senatorId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({ ...item, issueTags: unique(item.issueTags) });
  }
  return output;
}
