export const COMMITTEES = {
  finance: {
    code: "finance",
    shortName: "Finance",
    name: "Senate Finance Committee",
    chamber: "senate",
    officialUrl: "https://www.finance.senate.gov/",
    jurisdictionSummary: "Medicare, Medicaid, CHIP, ACA financing, reimbursement, Medicare Advantage, PBMs, drug pricing, and tax-related healthcare policy.",
    relevantFor: ["medicare", "medicaid", "chip", "aca", "reimbursement", "medicare advantage", "pbm", "drug pricing", "tax"]
  },
  help: {
    code: "help",
    shortName: "HELP",
    name: "Senate Health, Education, Labor, and Pensions Committee",
    chamber: "senate",
    officialUrl: "https://www.help.senate.gov/",
    jurisdictionSummary: "Public health, FDA, CDC, NIH, workforce, employer health plans, health insurance statutes, AI in care delivery, clinical regulation, and preparedness.",
    relevantFor: ["public health", "fda", "cdc", "nih", "workforce", "ai", "clinical", "preparedness", "insurance"]
  },
  appropriations_lhhs: {
    code: "appropriations_lhhs",
    shortName: "Appropriations Labor-HHS",
    name: "Senate Appropriations Committee, Labor-HHS-Education",
    chamber: "senate",
    officialUrl: "https://www.appropriations.senate.gov/",
    jurisdictionSummary: "HHS, NIH, CDC, FDA, annual program funding, and oversight through funding conditions.",
    relevantFor: ["hhs funding", "nih funding", "cdc funding", "fda appropriations", "program funding"]
  },
  aging: {
    code: "aging",
    shortName: "Aging",
    name: "Senate Special Committee on Aging",
    chamber: "senate",
    officialUrl: "https://www.aging.senate.gov/",
    jurisdictionSummary: "Seniors, Medicare beneficiaries, long-term care, nursing homes, prescription drug affordability, aging in place, senior fraud, and patient access.",
    relevantFor: ["seniors", "medicare beneficiaries", "long-term care", "nursing homes", "drug affordability", "aging in place", "patient access"]
  },
  judiciary: {
    code: "judiciary",
    shortName: "Judiciary",
    name: "Senate Judiciary Committee",
    chamber: "senate",
    officialUrl: "https://www.judiciary.senate.gov/",
    jurisdictionSummary: "Antitrust, hospital consolidation, PBM consolidation, market power, data privacy, AI liability, consumer protection, and competition policy.",
    relevantFor: ["antitrust", "consolidation", "pbm consolidation", "market power", "privacy", "ai liability", "competition"]
  },
  homeland_security: {
    code: "homeland_security",
    shortName: "Homeland Security",
    name: "Senate Homeland Security and Governmental Affairs Committee",
    chamber: "senate",
    officialUrl: "https://www.hsgac.senate.gov/",
    jurisdictionSummary: "Healthcare cybersecurity, federal procurement, fraud, waste, abuse, pandemic preparedness, and government operations.",
    relevantFor: ["cybersecurity", "procurement", "fraud", "waste", "abuse", "pandemic preparedness", "government operations"]
  }
};

export function listCommittees() {
  return Object.values(COMMITTEES);
}

export function getCommittee(code) {
  return COMMITTEES[code] || null;
}

export function normalizeCommitteeCodes(input = []) {
  const aliases = {
    "appropriations labor-hhs": "appropriations_lhhs",
    "labor-hhs": "appropriations_lhhs",
    hsgac: "homeland_security",
    homeland: "homeland_security",
    "homeland security": "homeland_security"
  };
  return [...new Set(input.map((code) => {
    const normalized = String(code || "").trim().toLowerCase().replace(/\s+/g, "_");
    return COMMITTEES[normalized] ? normalized : aliases[String(code || "").trim().toLowerCase()] || null;
  }).filter(Boolean))];
}
