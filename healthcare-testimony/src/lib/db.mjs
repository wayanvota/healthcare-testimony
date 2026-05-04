import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listCommittees } from "./committees.mjs";
import { listIssues } from "./healthcareTaxonomy.mjs";

let poolPromise = null;
let schemaReady = false;

export function dbMode(config) {
  return config?.databaseUrl ? "postgres_configured" : "local_memory";
}

export async function getPool(config) {
  if (!config?.databaseUrl) return null;
  if (!poolPromise) {
    poolPromise = import("pg").then(({ Pool }) => new Pool({
      connectionString: config.databaseUrl,
      ssl: config.pgssl ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    }));
  }
  return poolPromise;
}

export async function query(config, text, params = []) {
  const pool = await getPool(config);
  if (!pool) return null;
  return pool.query(text, params);
}

export async function ensureSchema(config) {
  if (!config?.databaseUrl || schemaReady) return { enabled: Boolean(config?.databaseUrl), applied: false };
  const schemaPath = join(dirname(dirname(fileURLToPath(import.meta.url))), "..", "schema", "schema.sql");
  const schema = await readFile(schemaPath, "utf8");
  await query(config, schema);
  schemaReady = true;
  return { enabled: true, applied: true };
}

export async function persistAnalysis(config, analysis) {
  if (!config?.databaseUrl || !analysis) return { persisted: false, reason: "DATABASE_URL not configured" };
  await ensureSchema(config);

  await upsertCommittees(config);
  await upsertIssues(config);
  await upsertSenators(config, analysis.senators || []);
  await upsertMemberships(config, analysis.senators || []);
  await upsertSources(config, analysis.sources || []);
  await upsertEvidence(config, analysis.evidence || []);

  const testimonyId = analysis.id;
  await query(config, `
    INSERT INTO testimony_documents (
      id, hearing_title, committee_codes, healthcare_topic, company_type, ceo_name,
      organization_name, testimony_text, testimony_url, source_id, created_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
    ON CONFLICT (id) DO UPDATE SET
      hearing_title = EXCLUDED.hearing_title,
      committee_codes = EXCLUDED.committee_codes,
      healthcare_topic = EXCLUDED.healthcare_topic,
      company_type = EXCLUDED.company_type,
      ceo_name = EXCLUDED.ceo_name,
      organization_name = EXCLUDED.organization_name,
      testimony_text = EXCLUDED.testimony_text,
      testimony_url = EXCLUDED.testimony_url
  `, [
    testimonyId,
    analysis.input?.hearingTitle || "",
    analysis.committeeCodes || [],
    analysis.input?.healthcareTopic || "",
    analysis.input?.companyType || "",
    analysis.input?.ceoName || "",
    analysis.input?.organizationName || "",
    analysis.input?.testimonyText || "",
    analysis.input?.testimonyUrl || "",
    null
  ]);

  const claimIdMap = new Map();
  for (const claim of analysis.claims || []) {
    const claimId = `${testimonyId}_${claim.id}`;
    claimIdMap.set(claim.id, claimId);
    await query(config, `
      INSERT INTO extracted_claims (
        id, testimony_id, claim_text, claim_type, issue_tags, risk_level, support_status, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,now())
      ON CONFLICT (id) DO UPDATE SET
        claim_text = EXCLUDED.claim_text,
        claim_type = EXCLUDED.claim_type,
        issue_tags = EXCLUDED.issue_tags,
        risk_level = EXCLUDED.risk_level,
        support_status = EXCLUDED.support_status
    `, [
      claimId,
      testimonyId,
      claim.claimText,
      claim.claimType,
      claim.issueTags || [],
      claim.riskLevel,
      claim.supportStatus
    ]);
  }

  for (const result of analysis.alignmentResults || []) {
    const claimId = claimIdMap.get(result.claimId);
    if (!claimId) continue;
    const resultId = `${testimonyId}_${result.claimId}_${result.senatorId}_${result.committeeCode}`;
    await query(config, `
      INSERT INTO claim_alignment_results (
        id, claim_id, senator_id, committee_code, topic, alignment_score, alignment_label,
        evidence_strength, risk_level, risk_summary, likely_question, answer_frame,
        recommended_rewrite, cited_evidence_item_ids, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now())
      ON CONFLICT (id) DO UPDATE SET
        alignment_score = EXCLUDED.alignment_score,
        alignment_label = EXCLUDED.alignment_label,
        evidence_strength = EXCLUDED.evidence_strength,
        risk_level = EXCLUDED.risk_level,
        risk_summary = EXCLUDED.risk_summary,
        likely_question = EXCLUDED.likely_question,
        answer_frame = EXCLUDED.answer_frame,
        recommended_rewrite = EXCLUDED.recommended_rewrite,
        cited_evidence_item_ids = EXCLUDED.cited_evidence_item_ids
    `, [
      resultId,
      claimId,
      result.senatorId,
      result.committeeCode,
      result.topic || analysis.input?.healthcareTopic || "",
      result.alignmentScore,
      result.alignmentLabel,
      result.evidenceStrength,
      result.riskLevel,
      result.riskSummary,
      result.likelyQuestion,
      Array.isArray(result.answerFrame) ? result.answerFrame.join("\n") : String(result.answerFrame || ""),
      result.recommendedRewrite || "",
      result.citedEvidenceItemIds || []
    ]);
  }

  for (const question of analysis.questions || []) {
    const claimId = claimIdMap.get(question.claimId);
    if (!claimId) continue;
    await query(config, `
      INSERT INTO generated_questions (
        id, testimony_id, senator_id, claim_id, question_text, question_type,
        evidence_basis, answer_frame, bad_answer_to_avoid, cited_evidence_item_ids, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
      ON CONFLICT (id) DO UPDATE SET
        question_text = EXCLUDED.question_text,
        question_type = EXCLUDED.question_type,
        evidence_basis = EXCLUDED.evidence_basis,
        answer_frame = EXCLUDED.answer_frame,
        bad_answer_to_avoid = EXCLUDED.bad_answer_to_avoid,
        cited_evidence_item_ids = EXCLUDED.cited_evidence_item_ids
    `, [
      `${testimonyId}_${question.id}`,
      testimonyId,
      question.senatorId,
      claimId,
      question.likelyQuestion,
      question.questionType,
      question.evidenceBasis,
      Array.isArray(question.answerFrame) ? question.answerFrame.join("\n") : String(question.answerFrame || ""),
      question.badAnswerToAvoid,
      question.citedEvidenceItemIds || []
    ]);
  }

  const sourceIds = [...new Set((analysis.evidence || []).map((item) => item.sourceId).filter(Boolean))];
  await query(config, `
    INSERT INTO generated_reports (id, testimony_id, report_type, markdown, source_ids, created_at)
    VALUES ($1,$2,$3,$4,$5,now())
    ON CONFLICT (id) DO UPDATE SET
      markdown = EXCLUDED.markdown,
      source_ids = EXCLUDED.source_ids
  `, [`${testimonyId}_ceo_briefing_memo`, testimonyId, "ceo_briefing_memo", analysis.markdown || "", sourceIds]);

  await query(config, `
    INSERT INTO analysis_runs (
      id, hearing_title, topic, committee_codes, status, total_jobs, completed_jobs,
      failed_jobs, final_report, markdown, created_at, updated_at, completed_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now(),now())
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      total_jobs = EXCLUDED.total_jobs,
      completed_jobs = EXCLUDED.completed_jobs,
      failed_jobs = EXCLUDED.failed_jobs,
      final_report = EXCLUDED.final_report,
      markdown = EXCLUDED.markdown,
      updated_at = now(),
      completed_at = now()
  `, [
    testimonyId,
    analysis.input?.hearingTitle || "",
    analysis.input?.healthcareTopic || "",
    analysis.committeeCodes || [],
    "completed",
    analysis.senators?.length || 0,
    analysis.senators?.length || 0,
    0,
    JSON.stringify({
      executiveSummary: analysis.executiveSummary,
      matrix: analysis.matrix,
      audit: analysis.audit
    }),
    analysis.markdown || ""
  ]);

  for (const card of analysis.senatorCards || []) {
    await query(config, `
      INSERT INTO senator_analysis_jobs (
        id, run_id, senator_id, senator_name, committee_code, topic, status,
        evidence_count, confidence, result, error, created_at, started_at, completed_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),now(),now())
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        evidence_count = EXCLUDED.evidence_count,
        confidence = EXCLUDED.confidence,
        result = EXCLUDED.result,
        error = EXCLUDED.error,
        completed_at = now()
    `, [
      `${testimonyId}_${card.senatorId}`,
      testimonyId,
      card.senatorId,
      card.name,
      firstCommitteeCodeForCard(analysis, card.senatorId),
      analysis.input?.healthcareTopic || "",
      "completed",
      (analysis.evidence || []).filter((item) => item.senatorId === card.senatorId).length,
      card.confidenceLevel,
      JSON.stringify(card),
      null
    ]);
  }

  return { persisted: true, testimonyId, claimCount: analysis.claims?.length || 0, evidenceCount: analysis.evidence?.length || 0 };
}

export async function getStoredJob(config, jobId) {
  if (!config?.databaseUrl) return null;
  await ensureSchema(config);
  const result = await query(config, "SELECT * FROM analysis_runs WHERE id = $1", [jobId]);
  return result?.rows?.[0] || null;
}

export async function closeDb() {
  if (!poolPromise) return true;
  const pool = await poolPromise;
  await pool.end();
  poolPromise = null;
  schemaReady = false;
  return true;
}

async function upsertCommittees(config) {
  for (const committee of listCommittees()) {
    await query(config, `
      INSERT INTO committees (code, name, chamber, official_url, jurisdiction_summary, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,now(),now())
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        chamber = EXCLUDED.chamber,
        official_url = EXCLUDED.official_url,
        jurisdiction_summary = EXCLUDED.jurisdiction_summary,
        updated_at = now()
    `, [committee.code, committee.name, committee.chamber, committee.officialUrl, committee.jurisdictionSummary]);
  }
}

async function upsertIssues(config) {
  for (const item of listIssues()) {
    await query(config, `
      INSERT INTO healthcare_issue_taxonomy (
        id, issue_tag, issue_label, description, primary_committee_codes,
        secondary_committee_codes, source_url, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,now())
      ON CONFLICT (issue_tag) DO UPDATE SET
        issue_label = EXCLUDED.issue_label,
        description = EXCLUDED.description,
        primary_committee_codes = EXCLUDED.primary_committee_codes,
        secondary_committee_codes = EXCLUDED.secondary_committee_codes,
        source_url = EXCLUDED.source_url
    `, [
      `issue_${item.issueTag}`,
      item.issueTag,
      item.issueLabel,
      item.description,
      item.primaryCommitteeCodes || [],
      item.secondaryCommitteeCodes || [],
      item.sourceUrl
    ]);
  }
}

async function upsertSenators(config, senators) {
  for (const senator of senators) {
    await query(config, `
      INSERT INTO senators (id, full_name, state_code, party, official_website, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,now(),now())
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        state_code = EXCLUDED.state_code,
        party = EXCLUDED.party,
        official_website = EXCLUDED.official_website,
        updated_at = now()
    `, [senator.id, senator.fullName, senator.stateCode, senator.party, senator.officialWebsite || null]);
  }
}

async function upsertMemberships(config, senators) {
  for (const senator of senators) {
    for (const membership of senator.memberships || []) {
      await query(config, `
        INSERT INTO committee_memberships (
          id, senator_id, committee_code, committee_name, role, majority_status, source_url, retrieved_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE SET
          committee_name = EXCLUDED.committee_name,
          role = EXCLUDED.role,
          majority_status = EXCLUDED.majority_status,
          source_url = EXCLUDED.source_url,
          retrieved_at = EXCLUDED.retrieved_at
      `, [
        membership.id,
        senator.id,
        membership.committeeCode,
        membership.committeeName,
        membership.role,
        membership.majorityStatus,
        membership.sourceUrl,
        membership.retrievedAt
      ]);
    }
    for (const assignment of senator.subcommittees || []) {
      await query(config, `
        INSERT INTO subcommittee_assignments (
          id, senator_id, committee_code, subcommittee_name, role, source_url, retrieved_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET
          subcommittee_name = EXCLUDED.subcommittee_name,
          role = EXCLUDED.role,
          source_url = EXCLUDED.source_url,
          retrieved_at = EXCLUDED.retrieved_at
      `, [
        assignment.id,
        senator.id,
        assignment.committeeCode,
        assignment.subcommitteeName,
        assignment.role,
        assignment.sourceUrl,
        assignment.retrievedAt
      ]);
    }
  }
}

async function upsertSources(config, sources) {
  for (const source of sources) {
    await query(config, `
      INSERT INTO sources (
        id, url, title, publisher, source_type, reliability, retrieved_at, content_hash, raw_text
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (id) DO UPDATE SET
        url = EXCLUDED.url,
        title = EXCLUDED.title,
        publisher = EXCLUDED.publisher,
        source_type = EXCLUDED.source_type,
        reliability = EXCLUDED.reliability,
        retrieved_at = EXCLUDED.retrieved_at,
        content_hash = EXCLUDED.content_hash,
        raw_text = EXCLUDED.raw_text
    `, [
      source.id,
      source.url,
      source.title,
      source.publisher,
      source.sourceType,
      source.reliability,
      source.retrievedAt,
      source.contentHash,
      source.rawText
    ]);
  }
}

async function upsertEvidence(config, evidence) {
  for (const item of evidence) {
    await query(config, `
      INSERT INTO evidence_items (
        id, senator_id, source_id, committee_code, evidence_key, topic, issue_tags,
        evidence_date, item_type, title, summary, quote, position_signal, stance_direction,
        evidence_weight, confidence, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now())
      ON CONFLICT (id) DO UPDATE SET
        source_id = EXCLUDED.source_id,
        committee_code = EXCLUDED.committee_code,
        evidence_key = EXCLUDED.evidence_key,
        topic = EXCLUDED.topic,
        issue_tags = EXCLUDED.issue_tags,
        evidence_date = EXCLUDED.evidence_date,
        item_type = EXCLUDED.item_type,
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        quote = EXCLUDED.quote,
        position_signal = EXCLUDED.position_signal,
        stance_direction = EXCLUDED.stance_direction,
        evidence_weight = EXCLUDED.evidence_weight,
        confidence = EXCLUDED.confidence
    `, [
      item.id,
      item.senatorId,
      item.sourceId,
      item.committeeCode,
      item.evidenceKey,
      item.topic,
      item.issueTags || [],
      item.evidenceDate,
      item.itemType,
      item.title,
      item.summary,
      item.quote,
      item.positionSignal,
      item.stanceDirection,
      item.evidenceWeight,
      item.confidence
    ]);
  }
}

function firstCommitteeCodeForCard(analysis, senatorId) {
  return analysis.alignmentResults?.find((result) => result.senatorId === senatorId)?.committeeCode || analysis.committeeCodes?.[0] || null;
}
