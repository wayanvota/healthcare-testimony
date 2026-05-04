import { contentHash, stableId } from "./utils.mjs";

export const SAMPLE_SENATORS = [
  { id: "sen_wyden", fullName: "Ron Wyden", stateCode: "OR", party: "D", officialWebsite: "https://www.wyden.senate.gov/" },
  { id: "sen_crapo", fullName: "Mike Crapo", stateCode: "ID", party: "R", officialWebsite: "https://www.crapo.senate.gov/" },
  { id: "sen_cassidy", fullName: "Bill Cassidy", stateCode: "LA", party: "R", officialWebsite: "https://www.cassidy.senate.gov/" },
  { id: "sen_sanders", fullName: "Bernie Sanders", stateCode: "VT", party: "I", officialWebsite: "https://www.sanders.senate.gov/" },
  { id: "sen_collins", fullName: "Susan Collins", stateCode: "ME", party: "R", officialWebsite: "https://www.collins.senate.gov/" },
  { id: "sen_durbin", fullName: "Dick Durbin", stateCode: "IL", party: "D", officialWebsite: "https://www.durbin.senate.gov/" },
  { id: "sen_peters", fullName: "Gary Peters", stateCode: "MI", party: "D", officialWebsite: "https://www.peters.senate.gov/" },
  { id: "sen_grassley", fullName: "Chuck Grassley", stateCode: "IA", party: "R", officialWebsite: "https://www.grassley.senate.gov/" }
];

export const SAMPLE_MEMBERSHIPS = [
  membership("sen_wyden", "finance", "Chair / senior Democrat", "majority", "https://www.finance.senate.gov/about/membership"),
  membership("sen_crapo", "finance", "Ranking Member / senior Republican", "minority", "https://www.finance.senate.gov/about/membership"),
  membership("sen_cassidy", "help", "Chair / senior Republican", "majority", "https://www.help.senate.gov/about/members"),
  membership("sen_sanders", "help", "Ranking Member / senior Independent", "minority", "https://www.help.senate.gov/about/members"),
  membership("sen_collins", "appropriations_lhhs", "Appropriator", "majority", "https://www.appropriations.senate.gov/subcommittees/labor-health-and-human-services-education-and-related-agencies"),
  membership("sen_sanders", "aging", "Member", "minority", "https://www.aging.senate.gov/about/members"),
  membership("sen_grassley", "judiciary", "Senior member", "majority", "https://www.judiciary.senate.gov/about/members"),
  membership("sen_durbin", "judiciary", "Senior Democrat", "minority", "https://www.judiciary.senate.gov/about/members"),
  membership("sen_peters", "homeland_security", "Senior Democrat", "minority", "https://www.hsgac.senate.gov/about/members")
];

export const SAMPLE_SUBCOMMITTEES = [
  subcommittee("sen_collins", "appropriations_lhhs", "Labor, Health and Human Services, Education, and Related Agencies", "Member"),
  subcommittee("sen_grassley", "judiciary", "Competition Policy, Antitrust, and Consumer Rights", "Member"),
  subcommittee("sen_peters", "homeland_security", "Investigations", "Member")
];

export const SAMPLE_SOURCES = [
  source("src_finance_ma_pa", "https://www.finance.senate.gov/", "Finance Committee Medicare Advantage oversight materials", "Senate Finance Committee", "committee_page", "official", "Medicare Advantage prior authorization oversight has focused on patient access, denials, appeals, and plan accountability. Public materials also describe program integrity, fiscal accountability, and preserving access."),
  source("src_help_ai", "https://www.help.senate.gov/", "HELP Committee materials on AI and health care", "Senate HELP Committee", "committee_page", "official", "Committee oversight of AI in health care has emphasized transparency, human oversight, clinical safety, privacy, and accountability."),
  source("src_aging_access", "https://www.aging.senate.gov/", "Aging Committee prescription drug and access oversight", "Senate Special Committee on Aging", "committee_page", "official", "Aging Committee oversight emphasizes seniors, Medicare beneficiaries, patient access, affordability, and fraud prevention. Public appropriations materials support NIH funding and rural healthcare access."),
  source("src_judiciary_competition", "https://www.judiciary.senate.gov/", "Judiciary Committee competition policy materials", "Senate Judiciary Committee", "committee_page", "official", "Competition policy oversight includes consolidation, PBM market power, data privacy, consumer protection, and AI liability. Public materials indicate concern about consolidation, consumer prices, and market power. Public materials indicate interest in PBM transparency, competition, and drug price accountability."),
  source("src_hsgac_cyber", "https://www.hsgac.senate.gov/", "HSGAC health cybersecurity oversight", "Senate Homeland Security and Governmental Affairs Committee", "committee_page", "official", "Healthcare cybersecurity oversight focuses on resilience, incidents, federal operations, fraud, waste, and abuse."),
  source("src_kff_ma_pa", "https://www.kff.org/medicare/issue-brief/medicare-advantage-prior-authorization/", "Medicare Advantage prior authorization issue brief", "KFF", "issue_brief", "reputable_secondary", "Public evidence on Medicare Advantage prior authorization describes beneficiary access concerns, denials, appeals, and administrative burden.")
];

export const SAMPLE_EVIDENCE = [
  evidence("ev_wyden_ma_pa", "sen_wyden", "src_finance_ma_pa", "finance", "medicare_advantage_prior_authorization", "Medicare Advantage prior authorization", ["medicare_advantage", "prior_authorization", "patient_access"], "2024-06-12", "committee_letter", "Finance oversight on Medicare Advantage prior authorization", "Public committee materials show scrutiny of Medicare Advantage prior authorization, denials, appeals, and plan accountability.", "patient access, denials, appeals, and plan accountability", "concern", "access_safeguard", 0.85, 0.78),
  evidence("ev_crapo_ma_value", "sen_crapo", "src_finance_ma_pa", "finance", "ma_program_integrity", "Medicare Advantage program integrity", ["medicare_advantage", "fraud_waste_abuse", "prior_authorization"], "2024-05-09", "opening_statement", "Finance Republican interest in Medicare program integrity", "Public materials indicate interest in program integrity, fiscal accountability, and preserving access for beneficiaries.", "program integrity, fiscal accountability, and preserving access", "conditional_support", "fiscal_accountability", 0.75, 0.66),
  evidence("ev_cassidy_ai", "sen_cassidy", "src_help_ai", "help", "ai_healthcare_oversight", "AI in healthcare", ["ai_healthcare", "algorithmic_decision_support", "patient_safety", "health_data_privacy"], "2025-02-20", "hearing_questioning", "HELP oversight on AI in care delivery", "Public HELP materials connect AI in care delivery with transparency, human oversight, safety, and privacy.", "transparency, human oversight, clinical safety, privacy, and accountability", "concern", "safeguards_required", 0.9, 0.82),
  evidence("ev_sanders_drug_access", "sen_sanders", "src_aging_access", "aging", "senior_access_affordability", "Senior access and prescription affordability", ["patient_access", "drug_pricing", "medicare", "aging_in_place"], "2024-09-18", "opening_statement", "Aging and HELP priorities on affordability and access", "Public materials emphasize affordability, seniors, beneficiary access, and skepticism toward industry claims that lack patient impact evidence.", "seniors, Medicare beneficiaries, patient access, affordability", "concern", "patient_affordability", 0.75, 0.72),
  evidence("ev_collins_nih_rural", "sen_collins", "src_aging_access", "appropriations_lhhs", "nih_rural_health", "NIH funding and rural health access", ["nih_funding", "rural_health", "patient_access"], "2024-07-25", "official_press_release", "Appropriations focus on biomedical research and rural access", "Public appropriations materials support NIH funding and rural healthcare access.", "NIH funding and rural healthcare access", "support", "funding_access", 0.6, 0.62),
  evidence("ev_durbin_hospital_comp", "sen_durbin", "src_judiciary_competition", "judiciary", "hospital_consolidation", "Hospital consolidation and competition", ["hospital_consolidation", "patient_access", "price_transparency"], "2024-04-16", "hearing_questioning", "Judiciary oversight of healthcare competition", "Public Judiciary materials indicate concern about consolidation, consumer prices, and market power.", "consolidation, consumer prices, and market power", "concern", "competition_safeguard", 0.9, 0.76),
  evidence("ev_grassley_pbm", "sen_grassley", "src_judiciary_competition", "judiciary", "pbm_competition", "PBM consolidation and transparency", ["pbm", "drug_pricing", "billing_transparency"], "2024-03-05", "bill_sponsorship", "PBM transparency and competition interest", "Public materials indicate interest in PBM transparency, competition, and drug price accountability.", "PBM transparency, competition, and drug price accountability", "concern", "competition_transparency", 1.0, 0.84),
  evidence("ev_peters_cyber", "sen_peters", "src_hsgac_cyber", "homeland_security", "healthcare_cybersecurity", "Healthcare cybersecurity", ["cybersecurity", "health_data_privacy", "public_health_preparedness"], "2024-11-14", "hearing_questioning", "HSGAC healthcare cybersecurity oversight", "Public materials emphasize resilience, incident response, and protecting health systems from cyber disruption.", "resilience, incidents, federal operations, fraud, waste, and abuse", "concern", "cyber_resilience", 0.9, 0.8),
  evidence("ev_kff_ma_pa_context", "sen_wyden", "src_kff_ma_pa", "finance", "ma_prior_auth_secondary", "Medicare Advantage prior authorization context", ["medicare_advantage", "prior_authorization", "patient_access"], "2024-08-01", "reputable_secondary_quote", "KFF context on Medicare Advantage prior authorization", "Secondary context describes beneficiary access concerns, denials, appeals, and administrative burden.", "beneficiary access concerns, denials, appeals, and administrative burden", "context", "access_safeguard", 0.3, 0.55)
];

export const DEMO_INPUT = {
  hearingTitle: "AI, Prior Authorization, and Patient Access in Medicare Advantage",
  committees: ["finance", "help", "aging", "judiciary"],
  healthcareTopic: "AI prior authorization Medicare Advantage patient access",
  companyType: "AI healthcare company",
  ceoName: "Jordan Lee",
  organizationName: "CareRoute AI",
  testimonyText: "Our AI-enabled prior authorization platform automates routine decisions, reduces administrative burden, and ensures patients get faster access to medically necessary care."
};

function membership(senatorId, committeeCode, role, majorityStatus, sourceUrl) {
  return {
    id: stableId("mem", `${senatorId}:${committeeCode}`),
    senatorId,
    committeeCode,
    role,
    majorityStatus,
    sourceUrl,
    retrievedAt: "2026-05-04T00:00:00.000Z"
  };
}

function subcommittee(senatorId, committeeCode, subcommitteeName, role) {
  return {
    id: stableId("sub", `${senatorId}:${committeeCode}:${subcommitteeName}`),
    senatorId,
    committeeCode,
    subcommitteeName,
    role,
    sourceUrl: "configuration://healthcare-testimony/sample-subcommittee-fixtures",
    retrievedAt: "2026-05-04T00:00:00.000Z"
  };
}

function source(id, url, title, publisher, sourceType, reliability, rawText) {
  return {
    id,
    url,
    title,
    publisher,
    sourceType,
    reliability,
    retrievedAt: "2026-05-04T00:00:00.000Z",
    contentHash: contentHash(rawText),
    rawText
  };
}

function evidence(id, senatorId, sourceId, committeeCode, evidenceKey, topic, issueTags, evidenceDate, itemType, title, summary, quote, positionSignal, stanceDirection, evidenceWeight, confidence) {
  return {
    id,
    senatorId,
    sourceId,
    committeeCode,
    evidenceKey,
    topic,
    issueTags,
    evidenceDate,
    itemType,
    title,
    summary,
    quote,
    positionSignal,
    stanceDirection,
    evidenceWeight,
    confidence,
    createdAt: "2026-05-04T00:00:00.000Z"
  };
}
