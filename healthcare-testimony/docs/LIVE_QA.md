# Live QA Notes

Use Render for the live service and API. The `wayan.com` path is currently a static landing/about site that links to Render; it does not proxy `/api/*`.

## URLs

- Static landing page: `https://wayan.com/healthcare-testimony/`
- Static about page: `https://wayan.com/healthcare-testimony/about.html`
- Interactive Render app: `https://healthcare-testimony.onrender.com/healthcare-testimony`
- Render API base: `https://healthcare-testimony.onrender.com/healthcare-testimony/api`

## Manual API Smoke Checks

```bash
curl -sS https://healthcare-testimony.onrender.com/healthcare-testimony/api/health
curl -sS https://healthcare-testimony.onrender.com/healthcare-testimony/api/committees
curl -sS https://healthcare-testimony.onrender.com/healthcare-testimony/api/history?limit=5
```

Demo analysis:

```bash
curl -sS -X POST https://healthcare-testimony.onrender.com/healthcare-testimony/api/analyze \
  -H 'content-type: application/json' \
  -d '{"hearingTitle":"AI, Prior Authorization, and Patient Access in Medicare Advantage","healthcareTopic":"AI-enabled prior authorization in Medicare Advantage","companyType":"AI healthcare company","ceoName":"Jane Doe","organizationName":"Example Health AI","committeeCodes":["finance","help","aging","judiciary"],"testimonyText":"Our AI-enabled prior authorization platform automates routine decisions, reduces administrative burden, and ensures patients get faster access to medically necessary care."}'
```

## Automated Live Test

```bash
npm run test:live
```

Default environment:

```text
HEALTHCARE_TESTIMONY_STATIC_URL=https://wayan.com/healthcare-testimony/
HEALTHCARE_TESTIMONY_APP_URL=https://healthcare-testimony.onrender.com/healthcare-testimony
HEALTHCARE_TESTIMONY_API_BASE=https://healthcare-testimony.onrender.com/healthcare-testimony/api
```

Pass the test only if the Render app returns claim-specific analysis with cited or clearly labeled fixture/demo evidence. Do not treat `https://wayan.com/healthcare-testimony/api/*` failures as app failures unless a reverse proxy has been configured on `wayan.com`.
