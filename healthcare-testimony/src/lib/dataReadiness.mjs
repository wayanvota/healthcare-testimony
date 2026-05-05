import { unique } from "./utils.mjs";

const DATA_PROMPTS = [
  {
    tags: ["ai_healthcare", "algorithmic_decision_support"],
    items: [
      "Human review rate for AI-supported decisions",
      "Model audit results, drift monitoring, and clinical governance records",
      "Exception handling process when the model is uncertain or documentation is incomplete",
      "Disparity testing by age, race, geography, disability status, and plan type"
    ]
  },
  {
    tags: ["prior_authorization", "patient_access", "medicare_advantage"],
    items: [
      "Approval, denial, delay, and withdrawal counts for the relevant period",
      "Median and 95th percentile time to decision for routine and urgent requests",
      "Appeal volume, overturn rate, and time to appeal resolution",
      "Documented patient access safeguards for medically necessary care"
    ]
  },
  {
    tags: ["patient_safety", "healthcare_quality"],
    items: [
      "Known patient harm incidents, near misses, and remediation steps",
      "Quality metrics before and after deployment",
      "Independent validation or external review findings"
    ]
  },
  {
    tags: ["drug_pricing", "pbm", "billing_transparency", "price_transparency"],
    items: [
      "Net price, rebate, spread, and patient out-of-pocket impact data",
      "Examples showing whether savings reached patients or plan sponsors",
      "Transparency commitments that can be verified after the hearing"
    ]
  },
  {
    tags: ["hospital_consolidation", "provider_reimbursement"],
    items: [
      "Market-by-market access, price, and quality effects",
      "Competition safeguards and post-transaction accountability metrics",
      "Rural and safety-net provider impact analysis"
    ]
  },
  {
    tags: ["cybersecurity", "health_data_privacy"],
    items: [
      "Recent security assessments, incident response tabletop results, and remediation status",
      "Data minimization, access logging, and third-party vendor control evidence",
      "Patient notification and continuity-of-care procedures for a cyber incident"
    ]
  },
  {
    tags: ["rural_health", "telehealth"],
    items: [
      "Rural access metrics by county or service area",
      "Broadband, device, language, and disability access accommodations",
      "Evidence that telehealth improves access without substituting for needed in-person care"
    ]
  }
];

export function buildDataReadiness({ claims = [], issueTags = [] } = {}) {
  const tags = unique([...issueTags, ...claims.flatMap((claim) => claim.issueTags || [])]);
  const matched = DATA_PROMPTS.filter((prompt) => prompt.tags.some((tag) => tags.includes(tag)));
  const items = unique(matched.flatMap((prompt) => prompt.items)).slice(0, 12);
  const highRiskTerms = unique(claims.flatMap((claim) => claim.riskTerms || []));
  const claimSpecific = highRiskTerms.length
    ? [`Be ready to document or soften these exact high-risk terms: ${highRiskTerms.join(", ")}.`]
    : [];
  return {
    title: "CEO data readiness",
    summary: items.length
      ? "Have these source-backed numbers ready before the CEO repeats the testimony claim."
      : "No specialized data-readiness prompts were triggered beyond source-backed caveats.",
    items: [...claimSpecific, ...items],
    caveat: "This is a strategic communications checklist, not legal lobbying compliance advice."
  };
}
