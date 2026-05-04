import { auditCitations } from "./citationAuditor.mjs";
import { buildMarkdownReport } from "./reportBuilder.mjs";

export function llmAvailable(config) {
  return Boolean(config?.useLlm && config?.openaiApiKey);
}

export async function enhanceAnalysisWithLlm(config, analysis) {
  if (!llmAvailable(config)) {
    return annotateLlm(analysis, {
      enabled: Boolean(config?.useLlm),
      used: false,
      reason: "LLM generation is disabled or OPENAI_API_KEY is not configured."
    });
  }

  try {
    const enhancement = await requestLlmEnhancement(config, analysis);
    const validation = validateLlmEnhancement(enhancement, analysis);
    if (!validation.passed) {
      return annotateLlm(analysis, {
        enabled: true,
        used: false,
        blocked: true,
        reason: "OpenAI output failed citation validation; deterministic output was used.",
        errors: validation.errors
      });
    }

    const enhanced = applyEnhancement(analysis, enhancement);
    const audit = auditCitations({
      alignmentResults: enhanced.alignmentResults,
      questions: enhanced.questions,
      rewrites: enhanced.rewrites,
      evidence: enhanced.evidence,
      sources: enhanced.sources
    });
    if (!audit.passed) {
      return annotateLlm(analysis, {
        enabled: true,
        used: false,
        blocked: true,
        reason: "OpenAI output failed final citation audit; deterministic output was used.",
        errors: audit.errors
      });
    }

    enhanced.audit = {
      ...audit,
      warnings: [...new Set([...(audit.warnings || []), "OpenAI synthesis used only after citation validation passed."])]
    };
    enhanced.executiveSummary = {
      ...enhanced.executiveSummary,
      evidenceConfidenceWarning: audit.warnings?.length
        ? "OpenAI synthesis passed citation audit, but some evidence remains thin. Avoid overstating senator alignment."
        : "OpenAI synthesis passed citation audit."
    };
    enhanced.markdown = buildMarkdownReport(enhanced, "ceo_briefing_memo");
    return annotateLlm(enhanced, {
      enabled: true,
      used: true,
      model: config.openaiModel,
      blocked: false,
      warning: "OpenAI output is citation-gated and falls back to deterministic analysis if unsupported."
    });
  } catch (error) {
    return annotateLlm(analysis, {
      enabled: true,
      used: false,
      blocked: true,
      reason: "OpenAI request failed; deterministic output was used.",
      error: error.message
    });
  }
}

async function requestLlmEnhancement(config, analysis) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.openaiApiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: config.openaiModel,
      instructions: llmInstructions(),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(buildLlmContext(analysis))
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "healthcare_testimony_enhancement",
          strict: true,
          schema: enhancementSchema()
        }
      }
    })
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message || `OpenAI request failed with status ${response.status}`);
  }
  const text = body?.output_text || extractOutputText(body);
  if (!text) throw new Error("OpenAI response did not include output_text.");
  return JSON.parse(text);
}

function llmInstructions() {
  return [
    "You are a Senate healthcare testimony preparation analyst.",
    "Return only JSON matching the schema.",
    "Use only the supplied public evidence items and their evidence IDs.",
    "Do not invent senator positions, votes, quotes, or future behavior.",
    "Do not say a senator supports the CEO, company, or testimony unless the supplied evidence explicitly says so.",
    "Label thin evidence and recommendations clearly.",
    "Every senator-specific factual claim, question, answer frame, and rewrite must include at least one citedEvidenceItemId from the supplied evidence.",
    "If evidence is missing for a senator, write cautious guidance and do not assert a position.",
    "This is strategic communications support, not legal advice."
  ].join("\n");
}

function buildLlmContext(analysis) {
  return {
    task: "Improve senator questions, answer frames, senator cards, and testimony rewrites using only cited evidence IDs.",
    hearing: analysis.input,
    committees: analysis.committees.map((committee) => ({
      code: committee.code,
      shortName: committee.shortName,
      jurisdictionSummary: committee.jurisdictionSummary
    })),
    claims: analysis.claims.map((claim) => ({
      id: claim.id,
      claimText: claim.claimText,
      claimType: claim.claimType,
      issueTags: claim.issueTags,
      riskLevel: claim.riskLevel,
      riskTerms: claim.riskTerms || []
    })),
    senators: analysis.senators.map((senator) => ({
      id: senator.id,
      name: senator.fullName,
      state: senator.stateCode,
      party: senator.party,
      committeeRoles: senator.committeeRoles || []
    })),
    alignmentResults: analysis.alignmentResults.map((result) => ({
      claimId: result.claimId,
      senatorId: result.senatorId,
      senatorName: result.senatorName,
      alignmentScore: result.alignmentScore,
      alignmentLabel: result.alignmentLabel,
      evidenceStrength: result.evidenceStrength,
      riskLevel: result.riskLevel,
      riskSummary: result.riskSummary,
      likelyQuestion: result.likelyQuestion,
      citedEvidenceItemIds: result.citedEvidenceItemIds
    })),
    evidence: analysis.evidence.map((item) => ({
      id: item.id,
      senatorId: item.senatorId,
      committeeCode: item.committeeCode,
      topic: item.topic,
      issueTags: item.issueTags,
      evidenceDate: item.evidenceDate,
      itemType: item.itemType,
      title: item.title,
      summary: item.summary,
      quote: item.quote,
      stanceDirection: item.stanceDirection,
      confidence: item.confidence,
      source: {
        title: item.source?.title,
        publisher: item.source?.publisher,
        reliability: item.source?.reliability,
        url: item.source?.url
      }
    })),
    requiredQuestionExample: {
      likelyQuestion: "How many patients were denied or delayed because of your algorithm?",
      answerFrame: ["Lead with human accountability.", "Describe appeal rights.", "Provide audit data."],
      badAnswerToAvoid: "Do not say the algorithm never affects care unless that is literally true and documented."
    }
  };
}

function enhancementSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["questions", "rewrites", "senatorCardUpdates", "caveats"],
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "senatorId",
            "claimId",
            "questionType",
            "likelyQuestion",
            "whyItMatters",
            "answerFrame",
            "badAnswerToAvoid",
            "citedEvidenceItemIds"
          ],
          properties: {
            senatorId: { type: "string" },
            claimId: { type: "string" },
            questionType: {
              type: "string",
              enum: ["hostile", "skeptical", "oversight", "fiscal", "patient_harm", "access", "competition", "privacy", "AI_safety", "implementation", "follow_the_money", "home_state_impact"]
            },
            likelyQuestion: { type: "string" },
            whyItMatters: { type: "string" },
            answerFrame: {
              type: "array",
              items: { type: "string" }
            },
            badAnswerToAvoid: { type: "string" },
            citedEvidenceItemIds: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      },
      rewrites: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "claimId",
            "originalText",
            "riskExplanation",
            "suggestedRewrite",
            "whySafer",
            "relevantSenatorIds",
            "citedEvidenceItemIds"
          ],
          properties: {
            claimId: { type: "string" },
            originalText: { type: "string" },
            riskExplanation: { type: "string" },
            suggestedRewrite: { type: "string" },
            whySafer: { type: "string" },
            relevantSenatorIds: {
              type: "array",
              items: { type: "string" }
            },
            citedEvidenceItemIds: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      },
      senatorCardUpdates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "senatorId",
            "evidenceSummary",
            "alignmentWithCeoTestimony",
            "likelyQuestions",
            "bestAnswerFrames",
            "phrasesToUse",
            "phrasesToAvoid",
            "confidenceLevel",
            "citedEvidenceItemIds"
          ],
          properties: {
            senatorId: { type: "string" },
            evidenceSummary: { type: "string" },
            alignmentWithCeoTestimony: { type: "string" },
            likelyQuestions: {
              type: "array",
              items: { type: "string" }
            },
            bestAnswerFrames: {
              type: "array",
              items: { type: "string" }
            },
            phrasesToUse: {
              type: "array",
              items: { type: "string" }
            },
            phrasesToAvoid: {
              type: "array",
              items: { type: "string" }
            },
            confidenceLevel: { type: "string" },
            citedEvidenceItemIds: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      },
      caveats: {
        type: "array",
        items: { type: "string" }
      }
    }
  };
}

function validateLlmEnhancement(enhancement, analysis) {
  const errors = [];
  const senatorIds = new Set(analysis.senators.map((senator) => senator.id));
  const claimIds = new Set(analysis.claims.map((claim) => claim.id));
  const evidenceById = new Map(analysis.evidence.map((item) => [item.id, item]));
  const senatorNames = new Map(analysis.senators.map((senator) => [senator.id, senator.fullName]));

  if (!enhancement || typeof enhancement !== "object") {
    return { passed: false, errors: ["OpenAI output was not an object."] };
  }

  for (const [index, question] of (enhancement.questions || []).entries()) {
    validateKnownId(question.senatorId, senatorIds, `questions[${index}].senatorId`, errors);
    validateKnownId(question.claimId, claimIds, `questions[${index}].claimId`, errors);
    validateEvidenceList(question.citedEvidenceItemIds, evidenceById, `questions[${index}]`, errors);
    validateEvidenceBelongsToSenator(question.citedEvidenceItemIds, question.senatorId, evidenceById, `questions[${index}]`, errors);
    validateNoUnsupportedSenatorText(question, senatorNames, question.citedEvidenceItemIds, `questions[${index}]`, errors);
  }

  for (const [index, rewrite] of (enhancement.rewrites || []).entries()) {
    validateKnownId(rewrite.claimId, claimIds, `rewrites[${index}].claimId`, errors);
    for (const senatorId of rewrite.relevantSenatorIds || []) validateKnownId(senatorId, senatorIds, `rewrites[${index}].relevantSenatorIds`, errors);
    validateEvidenceList(rewrite.citedEvidenceItemIds, evidenceById, `rewrites[${index}]`, errors);
    validateNoUnsupportedSenatorText(rewrite, senatorNames, rewrite.citedEvidenceItemIds, `rewrites[${index}]`, errors);
    if (!/recommendation|safer|avoid|strategic|not legal advice|cautious|unsupported/i.test(rewrite.whySafer || "")) {
      errors.push(`rewrites[${index}] does not clearly label the rewrite as a recommendation or safer framing.`);
    }
  }

  for (const [index, card] of (enhancement.senatorCardUpdates || []).entries()) {
    validateKnownId(card.senatorId, senatorIds, `senatorCardUpdates[${index}].senatorId`, errors);
    validateEvidenceList(card.citedEvidenceItemIds, evidenceById, `senatorCardUpdates[${index}]`, errors);
    validateEvidenceBelongsToSenator(card.citedEvidenceItemIds, card.senatorId, evidenceById, `senatorCardUpdates[${index}]`, errors);
    validateNoUnsupportedSenatorText(card, senatorNames, card.citedEvidenceItemIds, `senatorCardUpdates[${index}]`, errors);
  }

  return { passed: errors.length === 0, errors };
}

function applyEnhancement(analysis, enhancement) {
  const evidenceById = new Map(analysis.evidence.map((item) => [item.id, item]));
  const senatorById = new Map(analysis.senators.map((senator) => [senator.id, senator]));
  const claimById = new Map(analysis.claims.map((claim) => [claim.id, claim]));

  const questions = enhancement.questions.map((question, index) => {
    const senator = senatorById.get(question.senatorId);
    const claim = claimById.get(question.claimId);
    const cited = evidenceItems(question.citedEvidenceItemIds, evidenceById);
    return {
      id: `llm_q_${index + 1}`,
      senatorId: question.senatorId,
      senatorName: senator?.fullName || question.senatorId,
      claimId: question.claimId,
      claimText: claim?.claimText || "",
      questionType: question.questionType,
      evidenceBasis: cited.map((item) => item.summary).join(" "),
      likelyQuestion: question.likelyQuestion,
      whyItMatters: question.whyItMatters,
      answerFrame: question.answerFrame,
      badAnswerToAvoid: question.badAnswerToAvoid,
      citedEvidenceItemIds: question.citedEvidenceItemIds,
      citations: cited.flatMap((item) => item.citations || [])
    };
  });

  const rewrites = enhancement.rewrites.map((rewrite, index) => {
    const claim = claimById.get(rewrite.claimId);
    const cited = evidenceItems(rewrite.citedEvidenceItemIds, evidenceById);
    return {
      id: `llm_rw_${index + 1}`,
      originalText: rewrite.originalText || claim?.claimText || "",
      riskExplanation: rewrite.riskExplanation,
      suggestedRewrite: rewrite.suggestedRewrite,
      whySafer: rewrite.whySafer,
      relevantSenatorConcerns: rewrite.relevantSenatorIds.map((senatorId) => ({
        senatorName: senatorById.get(senatorId)?.fullName || senatorId,
        concern: "OpenAI-generated strategic concern based on cited evidence."
      })),
      citedEvidenceItemIds: rewrite.citedEvidenceItemIds,
      citations: cited.flatMap((item) => item.citations || [])
    };
  });

  const updatesBySenator = new Map(enhancement.senatorCardUpdates.map((card) => [card.senatorId, card]));
  const senatorCards = analysis.senatorCards.map((card) => {
    const update = updatesBySenator.get(card.senatorId);
    if (!update) return card;
    const cited = evidenceItems(update.citedEvidenceItemIds, evidenceById);
    return {
      ...card,
      evidenceSummary: update.evidenceSummary,
      alignmentWithCeoTestimony: update.alignmentWithCeoTestimony,
      likelyQuestions: update.likelyQuestions,
      bestAnswerFrames: update.bestAnswerFrames,
      phrasesToUse: update.phrasesToUse,
      phrasesToAvoid: update.phrasesToAvoid,
      confidenceLevel: update.confidenceLevel,
      citations: cited.flatMap((item) => item.citations || [])
    };
  });

  return {
    ...analysis,
    questions: questions.length ? questions : analysis.questions,
    rewrites: rewrites.length ? rewrites : analysis.rewrites,
    senatorCards,
    llmCaveats: enhancement.caveats || []
  };
}

function annotateLlm(analysis, llm) {
  return {
    ...analysis,
    llm
  };
}

function extractOutputText(body) {
  const parts = [];
  for (const item of body?.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("");
}

function validateKnownId(id, knownIds, label, errors) {
  if (!knownIds.has(id)) errors.push(`${label} references unknown id ${id}.`);
}

function validateEvidenceList(ids, evidenceById, label, errors) {
  if (!Array.isArray(ids) || !ids.length) {
    errors.push(`${label} lacks cited evidence IDs.`);
    return;
  }
  for (const id of ids) {
    if (!evidenceById.has(id)) errors.push(`${label} references unknown evidence item ${id}.`);
  }
}

function validateEvidenceBelongsToSenator(ids = [], senatorId, evidenceById, label, errors) {
  for (const id of ids) {
    const evidence = evidenceById.get(id);
    if (evidence && evidence.senatorId !== senatorId) {
      errors.push(`${label} cites ${id}, which belongs to ${evidence.senatorId}, not ${senatorId}.`);
    }
  }
}

function validateNoUnsupportedSenatorText(value, senatorNames, citedEvidenceItemIds, label, errors) {
  const text = JSON.stringify(value);
  for (const [senatorId, senatorName] of senatorNames) {
    if (text.includes(senatorName) && !hasSenatorEvidence(citedEvidenceItemIds, senatorId)) {
      errors.push(`${label} mentions ${senatorName} without evidence for that senator.`);
    }
  }
}

function hasSenatorEvidence(ids = [], senatorId) {
  return ids.length > 0 && Boolean(senatorId);
}

function evidenceItems(ids = [], evidenceById) {
  return ids.map((id) => evidenceById.get(id)).filter(Boolean);
}
