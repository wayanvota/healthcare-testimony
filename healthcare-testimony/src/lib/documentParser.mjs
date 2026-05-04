export function parseTestimonyInput(input = {}) {
  const testimonyText = String(input.testimonyText || input.text || "").trim();
  const testimonyUrl = String(input.testimonyUrl || "").trim();
  return {
    hearingTitle: String(input.hearingTitle || "Untitled healthcare testimony hearing").trim(),
    healthcareTopic: String(input.healthcareTopic || input.topic || "").trim(),
    companyType: String(input.companyType || "").trim(),
    ceoName: String(input.ceoName || "").trim(),
    organizationName: String(input.organizationName || input.organization || "").trim(),
    testimonyText,
    testimonyUrl,
    dateRange: String(input.dateRange || "").trim()
  };
}
