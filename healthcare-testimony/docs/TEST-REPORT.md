# Healthcare Testimony End-to-End Test Report

## Test run summary

- Date: 2026-09-11
- Scope: local browser, HTTP API, exports, jobs, validation, and security boundaries
- Environment: Node.js 22.16.0, Chromium, deterministic fixture mode
- External dependencies: none
- OpenAI mode: disabled for reproducibility; one optional credential-gated request validates the live provider boundary
- Categories: 20 total, exactly `U01`-`U10` and `A01`-`A10`
- Unit tests: 11 passed, 0 failed
- Deterministic E2E tests: 20 passed, 0 failed
- Live OpenAI smoke: passed; citation-gated synthesis accepted
- Dependency audit: 0 vulnerabilities
- Build and lint: no build or lint scripts are defined; the app runs directly as Node.js modules

## User-behavior categories

| ID | Scenario | Expected result |
| --- | --- | --- |
| U01 | Open dashboard | Default analysis completes and visible results populate |
| U02 | Submit risky testimony | Claim and high-risk output reflect the submitted text |
| U03 | Select committee | Resulting roster follows the committee choice |
| U04 | Include/exclude senator | Selected-senator run honors both controls |
| U05 | Refresh roster | Refresh succeeds without erasing form state |
| U06 | Load history | Local mode is disclosed and empty history is clear |
| U07 | Export Markdown | Download contains the sources section |
| U08 | Export PDF | Download begins with the PDF signature |
| U09 | Check health | API reports standalone deterministic local mode |
| U10 | Create and retrieve job | Completed job can be fetched by ID |

## Adversarial categories

| ID | Scenario | Expected result |
| --- | --- | --- |
| A01 | Malformed JSON | Controlled 400 without a stack trace |
| A02 | Oversized JSON | 1 MiB boundary returns 413 |
| A03 | Unsupported method | Route returns 404 and does not execute |
| A04 | Wrong base path | Request is rejected |
| A05 | Path traversal | Files outside public assets cannot be read |
| A06 | HTML injection | Markup is escaped and does not execute |
| A07 | Unknown committee | No committee or senator is invented |
| A08 | Unknown job | Controlled 404 |
| A09 | Credential leakage | Deterministic response does not contain an API key |
| A10 | Missing browser protections | App and API return baseline security headers |

## Findings and fixes

| Finding | Cause | Fix | Retest |
| --- | --- | --- | --- |
| Unbounded request bodies | The JSON reader buffered the entire request | Reject bodies larger than 1 MiB with 413 | A02 |
| Missing baseline response headers | Server responses did not set browser security headers | Add CSP, no-referrer, nosniff, and frame denial | A10 |
| Internal persistence detail exposed | Database exceptions were returned in analysis JSON | Return a generic persistence error | Existing tests plus full E2E suite |
| Malformed JSON crashed the server | The async API route promise was returned without being awaited inside the error boundary | Await API and static route handlers so rejected promises reach the controlled error response | A01 followed by A02-A10 in the same server process |
| Unit command collected Playwright specs | The broad Node test discovery included `test/e2e` and `test/live` | Limit the unit command to `test/*.test.mjs` | 11 unit tests plus 20 Playwright tests |

## Reproduction

```bash
cd healthcare-testimony
npm ci
npx playwright install chromium
npm run test:ci
```

CI runs the same command on Node.js 22.16.0 and uploads Playwright traces, screenshots, videos, and the HTML report when a test fails.
