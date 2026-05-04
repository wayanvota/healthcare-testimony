CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS senators (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  state_code TEXT NOT NULL,
  party TEXT NOT NULL,
  official_website TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS committees (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  chamber TEXT NOT NULL,
  official_url TEXT,
  jurisdiction_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS committee_memberships (
  id TEXT PRIMARY KEY,
  senator_id TEXT REFERENCES senators(id),
  committee_code TEXT REFERENCES committees(code),
  committee_name TEXT,
  role TEXT,
  majority_status TEXT,
  source_url TEXT,
  retrieved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS subcommittee_assignments (
  id TEXT PRIMARY KEY,
  senator_id TEXT REFERENCES senators(id),
  committee_code TEXT REFERENCES committees(code),
  subcommittee_name TEXT,
  role TEXT,
  source_url TEXT,
  retrieved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS healthcare_issue_taxonomy (
  id TEXT PRIMARY KEY,
  issue_tag TEXT UNIQUE NOT NULL,
  issue_label TEXT NOT NULL,
  description TEXT,
  primary_committee_codes TEXT[] DEFAULT '{}',
  secondary_committee_codes TEXT[] DEFAULT '{}',
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  publisher TEXT,
  source_type TEXT,
  reliability TEXT CHECK (reliability IN ('official', 'reputable_secondary', 'inferred', 'unsupported', 'user_submitted')),
  retrieved_at TIMESTAMPTZ,
  content_hash TEXT,
  raw_text TEXT
);

CREATE TABLE IF NOT EXISTS evidence_items (
  id TEXT PRIMARY KEY,
  senator_id TEXT REFERENCES senators(id),
  source_id TEXT REFERENCES sources(id),
  committee_code TEXT REFERENCES committees(code),
  evidence_key TEXT,
  topic TEXT,
  issue_tags TEXT[] DEFAULT '{}',
  evidence_date DATE,
  item_type TEXT,
  title TEXT,
  summary TEXT,
  quote TEXT,
  position_signal TEXT,
  stance_direction TEXT,
  evidence_weight NUMERIC,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimony_documents (
  id TEXT PRIMARY KEY,
  hearing_title TEXT,
  committee_codes TEXT[] DEFAULT '{}',
  healthcare_topic TEXT,
  company_type TEXT,
  ceo_name TEXT,
  organization_name TEXT,
  testimony_text TEXT,
  testimony_url TEXT,
  source_id TEXT REFERENCES sources(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS extracted_claims (
  id TEXT PRIMARY KEY,
  testimony_id TEXT REFERENCES testimony_documents(id),
  claim_text TEXT NOT NULL,
  claim_type TEXT CHECK (claim_type IN ('value_claim', 'factual_claim', 'policy_ask', 'defensive_claim', 'performance_claim', 'compliance_claim', 'patient_impact_claim', 'cost_claim', 'AI_claim', 'access_claim', 'quality_claim', 'safety_claim')),
  issue_tags TEXT[] DEFAULT '{}',
  risk_level TEXT,
  support_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS claim_alignment_results (
  id TEXT PRIMARY KEY,
  claim_id TEXT REFERENCES extracted_claims(id),
  senator_id TEXT REFERENCES senators(id),
  committee_code TEXT REFERENCES committees(code),
  topic TEXT,
  alignment_score INTEGER CHECK (alignment_score BETWEEN -2 AND 2),
  alignment_label TEXT,
  evidence_strength TEXT,
  risk_level TEXT,
  risk_summary TEXT,
  likely_question TEXT,
  answer_frame TEXT,
  recommended_rewrite TEXT,
  cited_evidence_item_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generated_questions (
  id TEXT PRIMARY KEY,
  testimony_id TEXT REFERENCES testimony_documents(id),
  senator_id TEXT REFERENCES senators(id),
  claim_id TEXT REFERENCES extracted_claims(id),
  question_text TEXT,
  question_type TEXT,
  evidence_basis TEXT,
  answer_frame TEXT,
  bad_answer_to_avoid TEXT,
  cited_evidence_item_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generated_reports (
  id TEXT PRIMARY KEY,
  testimony_id TEXT REFERENCES testimony_documents(id),
  report_type TEXT,
  markdown TEXT,
  source_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS topic_embeddings (
  id TEXT PRIMARY KEY,
  evidence_id TEXT REFERENCES evidence_items(id),
  model TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id TEXT PRIMARY KEY,
  hearing_title TEXT,
  topic TEXT,
  committee_codes TEXT[] DEFAULT '{}',
  status TEXT,
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  final_report JSONB,
  markdown TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS senator_analysis_jobs (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES analysis_runs(id),
  senator_id TEXT REFERENCES senators(id),
  senator_name TEXT,
  committee_code TEXT REFERENCES committees(code),
  topic TEXT,
  status TEXT,
  evidence_count INTEGER DEFAULT 0,
  confidence TEXT,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS evidence_items_senator_idx ON evidence_items(senator_id);
CREATE INDEX IF NOT EXISTS evidence_items_issue_tags_idx ON evidence_items USING gin(issue_tags);
CREATE INDEX IF NOT EXISTS claim_alignment_results_claim_idx ON claim_alignment_results(claim_id);
CREATE INDEX IF NOT EXISTS senator_analysis_jobs_run_idx ON senator_analysis_jobs(run_id);
