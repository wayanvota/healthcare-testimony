export async function ingestCongress({ topic = "", committeeCodes = [] } = {}) {
  return {
    status: "skipped",
    source: "congress.gov",
    topic,
    committeeCodes,
    message: "Congress.gov ingestion is configured but skipped in local deterministic mode without API keys."
  };
}

export async function ingestGovInfo({ topic = "", committeeCodes = [] } = {}) {
  return {
    status: "skipped",
    source: "govinfo.gov",
    topic,
    committeeCodes,
    message: "GovInfo ingestion is configured but skipped in local deterministic mode without API keys."
  };
}
