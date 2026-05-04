import { COMMITTEES } from "./committees.mjs";
import { lower, unique } from "./utils.mjs";

export const HEALTHCARE_ISSUES = {
  medicare: issue("medicare", "Medicare", "Medicare benefits, financing, and beneficiary protections.", ["finance"], ["aging", "appropriations_lhhs"], ["medicare", "beneficiary"]),
  medicare_advantage: issue("medicare_advantage", "Medicare Advantage", "Private Medicare plan payment, access, denials, and oversight.", ["finance"], ["aging", "appropriations_lhhs", "help"], ["medicare advantage", "ma plan", "prior authorization"]),
  medicaid: issue("medicaid", "Medicaid", "Medicaid eligibility, financing, managed care, and access.", ["finance"], ["help", "appropriations_lhhs"], ["medicaid"]),
  chip: issue("chip", "CHIP", "Children's Health Insurance Program coverage and financing.", ["finance"], ["help"], ["chip", "children's health insurance"]),
  aca: issue("aca", "Affordable Care Act", "ACA marketplaces, subsidies, and health insurance statutes.", ["finance"], ["help"], ["aca", "affordable care act", "marketplace"]),
  drug_pricing: issue("drug_pricing", "Drug Pricing", "Prescription drug affordability, negotiation, rebates, and patient costs.", ["finance"], ["aging", "help", "judiciary"], ["drug price", "drug pricing", "prescription drug", "rebate"]),
  pbm: issue("pbm", "PBM", "Pharmacy benefit manager transparency, spread pricing, consolidation, and rebates.", ["finance"], ["judiciary", "help"], ["pbm", "pharmacy benefit", "spread pricing"]),
  hospital_consolidation: issue("hospital_consolidation", "Hospital Consolidation", "Hospital mergers, market power, and competition safeguards.", ["judiciary"], ["finance", "help"], ["hospital consolidation", "merger", "market power", "competition"]),
  provider_reimbursement: issue("provider_reimbursement", "Provider Reimbursement", "Provider payment, reimbursement policy, and payment adequacy.", ["finance"], ["appropriations_lhhs", "help"], ["reimbursement", "provider payment", "payment rate"]),
  prior_authorization: issue("prior_authorization", "Prior Authorization", "Prior authorization delays, denials, appeals, and utilization management.", ["finance"], ["help", "aging"], ["prior authorization", "authorization", "denial", "appeal"]),
  patient_access: issue("patient_access", "Patient Access", "Access to medically necessary care, networks, delays, and rural access.", ["help"], ["finance", "aging", "appropriations_lhhs"], ["patient access", "access to care", "faster access", "delays", "denials"]),
  patient_safety: issue("patient_safety", "Patient Safety", "Clinical safety, adverse events, and care quality safeguards.", ["help"], ["finance"], ["patient safety", "harm", "adverse event", "safe"]),
  healthcare_quality: issue("healthcare_quality", "Healthcare Quality", "Quality measurement, outcomes, and care standards.", ["help"], ["finance"], ["quality", "outcome", "measure"]),
  ai_healthcare: issue("ai_healthcare", "AI in Healthcare", "AI in care delivery, coverage operations, model accountability, and clinical oversight.", ["help"], ["finance", "judiciary", "homeland_security"], ["ai", "artificial intelligence", "algorithm", "automated", "machine learning"]),
  algorithmic_decision_support: issue("algorithmic_decision_support", "Algorithmic Decision Support", "Algorithmic support for clinical, administrative, or coverage decisions.", ["help"], ["finance", "judiciary", "homeland_security"], ["algorithmic", "decision support", "automated decision", "proprietary algorithm"]),
  health_data_privacy: issue("health_data_privacy", "Health Data Privacy", "Health data use, consumer privacy, and sensitive data protections.", ["judiciary"], ["help", "homeland_security"], ["privacy", "health data", "data sharing"]),
  cybersecurity: issue("cybersecurity", "Cybersecurity", "Cybersecurity risk, resilience, incident reporting, and critical infrastructure.", ["homeland_security"], ["help", "finance"], ["cybersecurity", "ransomware", "breach", "incident"]),
  telehealth: issue("telehealth", "Telehealth", "Telehealth coverage, access, payment, and virtual care policy.", ["finance"], ["help", "aging"], ["telehealth", "virtual care"]),
  rural_health: issue("rural_health", "Rural Health", "Rural hospital access, workforce, telehealth, and service availability.", ["finance"], ["help", "appropriations_lhhs"], ["rural", "frontier"]),
  maternal_health: issue("maternal_health", "Maternal Health", "Maternal morbidity, mortality, coverage, and access.", ["help"], ["finance", "appropriations_lhhs"], ["maternal", "maternity", "postpartum"]),
  behavioral_health: issue("behavioral_health", "Behavioral Health", "Mental health and substance use access, parity, and workforce.", ["help"], ["finance", "appropriations_lhhs"], ["behavioral health", "mental health", "substance use"]),
  long_term_care: issue("long_term_care", "Long-Term Care", "Long-term services, supports, and care quality.", ["aging"], ["finance", "help"], ["long-term care", "ltc"]),
  nursing_homes: issue("nursing_homes", "Nursing Homes", "Nursing home quality, staffing, ownership, and safety.", ["aging"], ["finance", "help"], ["nursing home", "skilled nursing"]),
  aging_in_place: issue("aging_in_place", "Aging in Place", "Home and community-based supports for older adults.", ["aging"], ["finance"], ["aging in place", "home care", "hcbs"]),
  nih_funding: issue("nih_funding", "NIH Funding", "NIH appropriations and biomedical research funding.", ["appropriations_lhhs"], ["help"], ["nih", "biomedical research"]),
  cdc_funding: issue("cdc_funding", "CDC Funding", "CDC appropriations, grants, and public health capacity.", ["appropriations_lhhs"], ["help"], ["cdc", "public health funding"]),
  fda_regulation: issue("fda_regulation", "FDA Regulation", "FDA regulation, review, safety, and post-market oversight.", ["help"], ["appropriations_lhhs"], ["fda", "approval", "post-market"]),
  medical_devices: issue("medical_devices", "Medical Devices", "Medical device regulation, access, safety, and payment.", ["help"], ["finance"], ["medical device", "medtech"]),
  pharmaceuticals: issue("pharmaceuticals", "Pharmaceuticals", "Drug development, access, pricing, and regulation.", ["help"], ["finance", "judiciary"], ["pharmaceutical", "drug development"]),
  biotech: issue("biotech", "Biotech", "Biotechnology innovation, FDA pathway, research, and access.", ["help"], ["finance", "appropriations_lhhs"], ["biotech", "biotechnology"]),
  public_health_preparedness: issue("public_health_preparedness", "Public Health Preparedness", "Preparedness, response, stockpiles, and public health infrastructure.", ["help"], ["homeland_security", "appropriations_lhhs"], ["preparedness", "pandemic", "response"]),
  health_workforce: issue("health_workforce", "Health Workforce", "Healthcare workforce training, shortages, scope, and retention.", ["help"], ["appropriations_lhhs", "finance"], ["workforce", "shortage", "clinician"]),
  value_based_care: issue("value_based_care", "Value-Based Care", "Value-based payment, quality incentives, and delivery reform.", ["finance"], ["help"], ["value-based", "accountable care"]),
  health_equity: issue("health_equity", "Health Equity", "Disparities, underserved communities, and equitable access.", ["help"], ["finance", "appropriations_lhhs"], ["equity", "underserved", "disparity"]),
  fraud_waste_abuse: issue("fraud_waste_abuse", "Fraud, Waste, and Abuse", "Program integrity, improper payments, fraud, waste, and abuse.", ["homeland_security"], ["finance", "aging"], ["fraud", "waste", "abuse", "improper payment"]),
  billing_transparency: issue("billing_transparency", "Billing Transparency", "Billing practices, surprise bills, and patient-facing financial information.", ["finance"], ["help"], ["billing", "surprise bill"]),
  price_transparency: issue("price_transparency", "Price Transparency", "Price transparency, patient out-of-pocket costs, and consumer information.", ["finance"], ["help", "judiciary"], ["price transparency", "out-of-pocket", "cost transparency"])
};

function issue(issueTag, issueLabel, description, primaryCommitteeCodes, secondaryCommitteeCodes, keywords) {
  return {
    issueTag,
    issueLabel,
    description,
    primaryCommitteeCodes,
    secondaryCommitteeCodes,
    keywords,
    sourceUrl: "configuration://healthcare-testimony/healthcare-issue-taxonomy"
  };
}

export function listIssues() {
  return Object.values(HEALTHCARE_ISSUES);
}

export function getIssue(tag) {
  return HEALTHCARE_ISSUES[tag] || null;
}

export function detectIssueTags(text) {
  const value = lower(text);
  const tags = [];
  for (const item of listIssues()) {
    if (item.keywords.some((keyword) => value.includes(keyword))) tags.push(item.issueTag);
  }
  if (value.includes("medically necessary")) tags.push("patient_access");
  if (value.includes("administrative burden")) tags.push("prior_authorization");
  return unique(tags);
}

export function committeesForIssueTags(issueTags) {
  const codes = [];
  for (const tag of issueTags || []) {
    const item = getIssue(tag);
    if (!item) continue;
    codes.push(...item.primaryCommitteeCodes, ...item.secondaryCommitteeCodes);
  }
  return unique(codes).filter((code) => COMMITTEES[code]);
}

export function issueRelevanceForCommittee(issueTags, committeeCode) {
  let score = 0;
  for (const tag of issueTags || []) {
    const item = getIssue(tag);
    if (!item) continue;
    if (item.primaryCommitteeCodes.includes(committeeCode)) score += 1;
    if (item.secondaryCommitteeCodes.includes(committeeCode)) score += 0.55;
  }
  return Math.min(1, score / Math.max(1, issueTags.length));
}
