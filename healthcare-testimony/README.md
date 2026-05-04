# Healthcare CEO Senate Testimony Alignment Tool

This is a standalone healthcare-focused tool. It does not depend on the Senate Appropriations testimony tool.

## Product Overview

The Healthcare CEO Senate Testimony Alignment Tool helps political strategists and healthcare public affairs teams prepare executives for U.S. Senate testimony. It analyzes draft testimony against cited public records for senators on committees that materially affect healthcare policy.

The tool identifies alignment, political risk, likely questions, safer answer frames, testimony rewrite suggestions, and evidence caveats. It is a committee intelligence and testimony alignment engine, not a generic persuasion chatbot.

## Why This Tool Exists

Healthcare testimony can trigger different concerns across Finance, HELP, Aging, Judiciary, Appropriations Labor-HHS, and Homeland Security. A CEO claim about AI-enabled prior authorization, for example, may raise Finance questions about Medicare Advantage denials, HELP questions about clinical oversight, Aging questions about seniors' access, and Judiciary questions about algorithmic accountability or competition.

## Difference From The Senate Appropriations Tool

This is a standalone healthcare-focused tool. It does not depend on the Senate Appropriations testimony tool.

It has a separate project directory, app name, routing base path, database schema, fixture set, healthcare issue taxonomy, analysis pipeline, and deployment target. Appropriations Labor-HHS is included only as one healthcare-relevant committee among several.

## Architecture

- Node.js 20+ plain HTTP server
- Browser dashboard at `/healthcare-testimony`
- Deterministic local analysis by default
- Optional future OpenAI integration behind environment variables
- PostgreSQL production schema with pgvector support
- Local fixture evidence for tests and no-key development
- Markdown and PDF export endpoints
- In-memory job support locally, with schema support for stored production jobs

## Setup

```bash
cd healthcare-testimony
npm install
npm test
npm start
```

Open:

```text
http://localhost:4174/healthcare-testimony
```

## Environment Variables

```bash
PORT=4174
BASE_PATH=/healthcare-testimony
PUBLIC_BASE_URL=https://wayan.com/healthcare-testimony
DATABASE_URL=
PGSSL=false
CONGRESS_API_KEY=
GOVINFO_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
USE_LLM=false
RUN_INLINE_JOBS=true
ENABLE_SCHEDULER=false
ADMIN_REFRESH_TOKEN=
WORKER_MAX_PAGES=1
WORKER_IDLE_MS=5000
```

The app runs locally without API keys. Without keys it uses deterministic extraction, local roster fixtures, and sample public-record evidence fixtures.

## Data Sources

Primary source priorities:

- Official Senate committee member pages
- Official Senate committee hearing pages
- Official senator websites
- Congress.gov API
- GovInfo API
- Senate roll-call votes
- Committee testimony, transcripts, witness lists, member statements, and questions for the record where available
- Official press releases and letters
- Bill sponsorship, cosponsorship, amendments, and roll-call votes

Secondary sources are supporting evidence only:

- KFF
- Public CRS reports
- C-SPAN
- Major reputable news outlets
- Federal Register
- CMS, FDA, HHS, FTC, DOJ, and OIG materials

## Committee Coverage

- Senate Finance Committee
- Senate HELP Committee
- Senate Appropriations Committee, Labor-HHS-Education
- Senate Special Committee on Aging
- Senate Judiciary Committee
- Senate Homeland Security and Governmental Affairs Committee

Additional committees can be added through `src/lib/committees.mjs` and taxonomy configuration rather than rewriting the analysis pipeline.

## Healthcare Issue Taxonomy

The taxonomy lives in `src/lib/healthcareTaxonomy.mjs` and includes Medicare, Medicare Advantage, Medicaid, CHIP, ACA, drug pricing, PBMs, hospital consolidation, reimbursement, prior authorization, patient access, patient safety, healthcare quality, AI in healthcare, algorithmic decision support, health data privacy, cybersecurity, telehealth, rural health, maternal health, behavioral health, long-term care, nursing homes, aging in place, NIH funding, CDC funding, FDA regulation, medical devices, pharmaceuticals, biotech, public health preparedness, workforce, value-based care, health equity, fraud/waste/abuse, billing transparency, and price transparency.

## API Endpoints

- `GET /api/health`
- `GET /api/committees`
- `GET /api/roster?committee=finance&refresh=1`
- `POST /api/analyze`
- `POST /api/extract-claims`
- `POST /api/retrieve-evidence`
- `POST /api/score-alignment`
- `POST /api/generate-questions`
- `POST /api/rewrite-testimony`
- `POST /api/export/markdown`
- `POST /api/export/pdf`
- `POST /api/admin/refresh`
- `POST /api/ingest/congress`
- `POST /api/ingest/govinfo`
- `GET /api/jobs/:jobId`
- `POST /api/jobs`

When deployed with `BASE_PATH=/healthcare-testimony`, these are served below `/healthcare-testimony/api/*`.

## Database Setup

The production schema is in `schema/schema.sql`.

It includes `CREATE EXTENSION IF NOT EXISTS vector;` and tables for senators, committees, memberships, subcommittees, healthcare issue taxonomy, sources, evidence items, testimony documents, extracted claims, claim alignment results, generated questions, generated reports, topic embeddings, analysis runs, and senator analysis jobs.

## Local Development

Local mode is deterministic and extractive:

- Claim extraction uses sentence splitting, cue words, issue terms, and high-risk language flags.
- Evidence retrieval uses fixture evidence with official/reputable reliability labels.
- Alignment scoring does not claim senator support unless cited evidence exists.
- LLM output is disabled unless `USE_LLM=true` and `OPENAI_API_KEY` is set.

## Production Deployment

The app is designed for:

```text
https://wayan.com/healthcare-testimony
```

It correctly serves:

- `/healthcare-testimony`
- `/healthcare-testimony/`
- `/healthcare-testimony/api/*`
- `/healthcare-testimony/assets/*`

Example Nginx config:

```nginx
location /healthcare-testimony/ {
  proxy_pass http://127.0.0.1:4174/healthcare-testimony/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

## Testing Plan

Run:

```bash
npm test
```

Tests verify taxonomy mappings, high-risk AI/prior authorization extraction, negative alignment scoring against cited evidence, thin-evidence warnings, citation auditing, red-team evidence grounding, Markdown citations, local no-key startup, `BASE_PATH=/healthcare-testimony`, and standalone independence.

## Demo Scenario

Hearing title:

```text
AI, Prior Authorization, and Patient Access in Medicare Advantage
```

Company type:

```text
AI healthcare company
```

CEO testimony excerpt:

```text
Our AI-enabled prior authorization platform automates routine decisions, reduces administrative burden, and ensures patients get faster access to medically necessary care.
```

Expected output:

- Claim extraction flags `automates routine decisions` as high risk.
- Issue tags include `ai_healthcare`, `prior_authorization`, `medicare_advantage`, and `patient_access`.
- Relevant committees include Finance, HELP, Aging, and Judiciary.
- The matrix identifies concerns around patient access, denials and delays, human oversight, appeal rights, and algorithmic accountability.
- Red-team Q&A includes: `How many patients were denied or delayed because of your algorithm?`
- Rewrite suggests: `Our platform supports clinical and administrative reviewers by flagging missing documentation and routing routine cases more efficiently, while final coverage decisions remain subject to human review, appeal rights, audit controls, and patient access safeguards.`

## Guardrails

The tool must not infer private beliefs, fabricate quotes, fabricate votes, imply senator support without evidence, provide legal lobbying compliance advice, promise future votes, recommend deception, hide material risks, or suggest misleading testimony.

Preferred language:

- “Based on public record...”
- “The cited evidence suggests...”
- “Evidence is thin...”
- “This is a strategic communications recommendation, not legal advice.”

Avoided language:

- “The senator secretly believes...”
- “This guarantees support...”
- “Say this to manipulate...”
- “Hide this weakness...”

## Known Limitations

- Local mode uses fixtures rather than live Senate, Congress.gov, or GovInfo retrieval.
- PDF export is intentionally dependency-light and optimized for simple report output.
- Public source retrieval adapters are stubs until API credentials and production ingestion scheduling are configured.
- The deterministic scorer is conservative and labels thin evidence rather than filling gaps.

## Future Enhancements

- Live committee roster refresh from official committee pages
- Congress.gov and GovInfo ingestion workers
- pgvector retrieval ranking for larger evidence collections
- Admin source review queue
- Citation quote verification against fetched page text
- Hearing-specific QFR ingestion
- Optional LLM drafting after citation audit passes
