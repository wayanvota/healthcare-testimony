# Healthcare CEO Senate Testimony Alignment Tool

Healthcare testimony preparation with cited Senate committee evidence, claim-level risk review, likely questions, and safer answer frames.

- [Public overview](https://wayan.com/healthcare-testimony/)
- [Interactive application](https://healthcare-testimony.onrender.com/healthcare-testimony)

## What it does

The tool compares draft healthcare testimony with cited public records for senators serving on committees that affect healthcare policy. It identifies alignment, political risk, likely questions, evidence gaps, and possible rewrites.

## Decision boundary

This is committee intelligence and testimony decision support. It does not predict a senator's behavior, replace public-affairs judgment, or turn an inference into a verified position. Senator-specific findings must remain tied to retrieved evidence.

## Repository structure

- `healthcare-testimony/`: Node.js application, API, tests, schema, and full technical documentation
- `healthcare-testimony-static/`: static public-site files

## Run locally

```bash
cd healthcare-testimony
npm install
npm test
npm start
```

Open `http://localhost:4174/healthcare-testimony`.

See [the application README](healthcare-testimony/README.md) for architecture, data sources, environment variables, API endpoints, deployment details, and the testing plan.
