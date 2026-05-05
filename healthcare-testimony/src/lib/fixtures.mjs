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
  source("src_kff_ma_pa", "https://www.kff.org/medicare/issue-brief/medicare-advantage-prior-authorization/", "Medicare Advantage prior authorization issue brief", "KFF", "issue_brief", "reputable_secondary", "Public evidence on Medicare Advantage prior authorization describes beneficiary access concerns, denials, appeals, and administrative burden."),
  source("src_wyden_official_ma", "https://www.wyden.senate.gov/", "Wyden official materials on Medicare oversight", "Office of Senator Ron Wyden", "official_senator_page", "official", "Senator Wyden official materials emphasize Medicare oversight, beneficiary access, denials, appeals, and accountability in Medicare Advantage."),
  source("src_crapo_official_ma", "https://www.crapo.senate.gov/", "Crapo official materials on Medicare program integrity", "Office of Senator Mike Crapo", "official_senator_page", "official", "Senator Crapo official materials emphasize Medicare program integrity, fiscal accountability, innovation, and preserving beneficiary access."),
  source("src_cassidy_official_ai", "https://www.cassidy.senate.gov/", "Cassidy official materials on health innovation and AI oversight", "Office of Senator Bill Cassidy", "official_senator_page", "official", "Senator Cassidy official materials connect health innovation with transparency, human oversight, privacy, safety, and accountability."),
  source("src_sanders_official_access", "https://www.sanders.senate.gov/", "Sanders official materials on health care affordability", "Office of Senator Bernie Sanders", "official_senator_page", "official", "Senator Sanders official materials emphasize affordability, patient access, Medicare beneficiaries, and skepticism toward industry claims without patient impact evidence."),
  source("src_collins_official_rural", "https://www.collins.senate.gov/", "Collins official materials on NIH and rural health", "Office of Senator Susan Collins", "official_senator_page", "official", "Senator Collins official materials emphasize NIH funding, biomedical research, older adults, and rural health access."),
  source("src_durbin_official_competition", "https://www.durbin.senate.gov/", "Durbin official materials on health care competition", "Office of Senator Dick Durbin", "official_senator_page", "official", "Senator Durbin official materials emphasize competition, consumer protection, consolidation, and affordability."),
  source("src_grassley_official_pbm", "https://www.grassley.senate.gov/", "Grassley official materials on PBM transparency", "Office of Senator Chuck Grassley", "official_senator_page", "official", "Senator Grassley official materials emphasize PBM transparency, drug price accountability, competition, and oversight."),
  source("src_peters_official_cyber", "https://www.peters.senate.gov/", "Peters official materials on cybersecurity oversight", "Office of Senator Gary Peters", "official_senator_page", "official", "Senator Peters official materials emphasize cybersecurity resilience, incident response, government operations, and protecting critical services.")
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
  evidence("ev_kff_ma_pa_context", "sen_wyden", "src_kff_ma_pa", "finance", "ma_prior_auth_secondary", "Medicare Advantage prior authorization context", ["medicare_advantage", "prior_authorization", "patient_access"], "2024-08-01", "reputable_secondary_quote", "KFF context on Medicare Advantage prior authorization", "Secondary context describes beneficiary access concerns, denials, appeals, and administrative burden.", "beneficiary access concerns, denials, appeals, and administrative burden", "context", "access_safeguard", 0.3, 0.55),
  evidence("ev_wyden_official_ma_access", "sen_wyden", "src_wyden_official_ma", "finance", "wyden_ma_access_accountability", "Medicare Advantage prior authorization", ["medicare_advantage", "prior_authorization", "patient_access"], "2025-03-18", "official_press_release", "Wyden official Medicare Advantage access focus", "Official senator materials emphasize Medicare oversight, beneficiary access, denials, appeals, and accountability.", "Medicare oversight, beneficiary access, denials, appeals, and accountability", "concern", "access_safeguard", 0.82, 0.82),
  evidence("ev_crapo_official_ma_integrity", "sen_crapo", "src_crapo_official_ma", "finance", "crapo_ma_integrity_access", "Medicare Advantage program integrity", ["medicare_advantage", "prior_authorization", "fraud_waste_abuse", "patient_access"], "2025-02-11", "official_press_release", "Crapo official Medicare program integrity focus", "Official senator materials emphasize program integrity, fiscal accountability, innovation, and preserving beneficiary access.", "program integrity, fiscal accountability, innovation, and preserving beneficiary access", "conditional_support", "fiscal_accountability", 0.78, 0.78),
  evidence("ev_cassidy_official_ai_safeguards", "sen_cassidy", "src_cassidy_official_ai", "help", "cassidy_ai_health_safeguards", "AI in healthcare decision support", ["ai_healthcare", "algorithmic_decision_support", "patient_safety", "health_data_privacy"], "2025-04-07", "official_press_release", "Cassidy official AI health oversight focus", "Official senator materials connect health innovation with transparency, human oversight, privacy, safety, and accountability.", "transparency, human oversight, privacy, safety, and accountability", "concern", "safeguards_required", 0.84, 0.84),
  evidence("ev_sanders_official_access_claims", "sen_sanders", "src_sanders_official_access", "help", "sanders_patient_access_industry_claims", "Patient access and affordability", ["patient_access", "medicare", "medicare_advantage", "drug_pricing"], "2025-01-30", "official_press_release", "Sanders official patient access and affordability focus", "Official senator materials emphasize affordability, patient access, Medicare beneficiaries, and skepticism toward industry claims without patient impact evidence.", "affordability, patient access, Medicare beneficiaries, and skepticism toward industry claims without patient impact evidence", "concern", "patient_affordability", 0.8, 0.8),
  evidence("ev_collins_official_rural_nih", "sen_collins", "src_collins_official_rural", "appropriations_lhhs", "collins_nih_rural_access", "NIH funding and rural health access", ["nih_funding", "rural_health", "patient_access"], "2025-02-25", "official_press_release", "Collins official NIH and rural health focus", "Official senator materials emphasize NIH funding, biomedical research, older adults, and rural health access.", "NIH funding, biomedical research, older adults, and rural health access", "support", "funding_access", 0.72, 0.76),
  evidence("ev_durbin_official_competition_access", "sen_durbin", "src_durbin_official_competition", "judiciary", "durbin_competition_consumer_protection", "Healthcare competition and consumer protection", ["hospital_consolidation", "patient_access", "price_transparency", "health_data_privacy"], "2025-02-04", "official_press_release", "Durbin official health care competition focus", "Official senator materials emphasize competition, consumer protection, consolidation, and affordability.", "competition, consumer protection, consolidation, and affordability", "concern", "competition_safeguard", 0.8, 0.78),
  evidence("ev_grassley_official_pbm_transparency", "sen_grassley", "src_grassley_official_pbm", "judiciary", "grassley_pbm_transparency", "PBM transparency and drug pricing", ["pbm", "drug_pricing", "billing_transparency"], "2025-03-06", "bill_sponsorship", "Grassley official PBM transparency focus", "Official senator materials emphasize PBM transparency, drug price accountability, competition, and oversight.", "PBM transparency, drug price accountability, competition, and oversight", "concern", "competition_transparency", 1, 0.86),
  evidence("ev_peters_official_health_cyber", "sen_peters", "src_peters_official_cyber", "homeland_security", "peters_health_cyber_resilience", "Healthcare cybersecurity", ["cybersecurity", "health_data_privacy", "public_health_preparedness"], "2025-04-14", "official_press_release", "Peters official cybersecurity resilience focus", "Official senator materials emphasize cybersecurity resilience, incident response, government operations, and protecting critical services.", "cybersecurity resilience, incident response, government operations, and protecting critical services", "concern", "cyber_resilience", 0.82, 0.84)
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
