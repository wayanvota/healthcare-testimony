import { lower } from "./utils.mjs";

export function generateQuestions({ claims = [], senators = [], alignmentResults = [], evidence = [] } = {}) {
  const questions = [];
  for (const result of alignmentResults) {
    const claim = claims.find((item) => item.id === result.claimId);
    const senator = senators.find((item) => item.id === result.senatorId);
    if (!claim || !senator) continue;
    if (result.riskLevel !== "high" && result.alignmentScore >= 0) continue;
    const cited = evidence.filter((item) => result.citedEvidenceItemIds.includes(item.id)).slice(0, 2);
    questions.push({
      id: `q_${questions.length + 1}`,
      senatorId: senator.id,
      senatorName: senator.fullName,
      claimId: claim.id,
      claimText: claim.claimText,
      questionType: questionTypeFor(claim),
      evidenceBasis: cited.map((item) => item.summary).join(" "),
      likelyQuestion: result.likelyQuestion,
      whyItMatters: whyItMattersFor(claim, senator, cited),
      answerFrame: result.answerFrame,
      badAnswerToAvoid: badAnswerFor(claim),
      citedEvidenceItemIds: cited.map((item) => item.id),
      citations: cited.flatMap((item) => item.citations || [])
    });
  }
  return { questions };
}

function questionTypeFor(claim) {
  const text = lower(claim.claimText);
  if (claim.issueTags.includes("ai_healthcare")) return "AI_safety";
  if (claim.issueTags.includes("prior_authorization")) return "access";
  if (claim.issueTags.includes("drug_pricing") || claim.issueTags.includes("pbm")) return "follow_the_money";
  if (claim.issueTags.includes("hospital_consolidation")) return "competition";
  if (claim.issueTags.includes("cybersecurity")) return "oversight";
  if (text.includes("cost")) return "fiscal";
  return "skeptical";
}

function whyItMattersFor(claim, senator, cited) {
  if (!cited.length) return `Evidence is thin for ${senator.fullName}; the safest answer is to offer documented follow-up instead of asserting alignment.`;
  if (claim.issueTags.includes("ai_healthcare")) return `The cited public record suggests ${senator.fullName} may press for human oversight, patient safety, privacy, and accountability.`;
  if (claim.issueTags.includes("prior_authorization")) return `The cited public record suggests concern about access, denials, delays, and appeal rights.`;
  return `The question is grounded in cited public materials and should be answered with source-backed limits.`;
}

function badAnswerFor(claim) {
  const text = lower(claim.claimText);
  if (text.includes("automates")) return "Do not say the algorithm never affects care unless that is literally true and documented.";
  if (claim.issueTags.includes("drug_pricing")) return "Do not imply patient savings without data showing patient out-of-pocket impact.";
  if (claim.issueTags.includes("hospital_consolidation")) return "Do not dismiss competition or local access concerns as theoretical.";
  return "Do not claim senator support or make uncited factual assertions.";
}
