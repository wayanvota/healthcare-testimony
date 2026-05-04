import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { runAnalysis } from "./lib/analysis.mjs";
import { buildMarkdownReport } from "./lib/reportBuilder.mjs";
import { markdownToPdfBuffer } from "./lib/pdfExport.mjs";
import { extractClaims } from "./lib/claimExtractor.mjs";
import { retrieveEvidence } from "./lib/retrieval.mjs";
import { scoreAlignment } from "./lib/alignmentScoring.mjs";
import { generateQuestions } from "./lib/questionGenerator.mjs";
import { rewriteTestimony } from "./lib/rewriteEngine.mjs";
import { getRoster } from "./lib/roster.mjs";
import { listCommittees } from "./lib/committees.mjs";
import { ingestCongress, ingestGovInfo } from "./lib/ingestion.mjs";
import { dbMode, getStoredJob, persistAnalysis } from "./lib/db.mjs";
import { startScheduler } from "./lib/scheduler.mjs";
import { DEMO_INPUT } from "./lib/fixtures.mjs";
import { envConfig, jsonResponse, nowIso, readJsonBody, stableId } from "./lib/utils.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = normalize(join(__dirname, ".."));
const publicDir = join(rootDir, "public");
const config = envConfig();
const jobs = new Map();
let lastAnalysis = null;

startScheduler(config);

export function createAppServer() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const path = stripBasePath(url.pathname, config.basePath);
      if (path === null) return notFound(res);
      if (path.startsWith("/api/")) return routeApi(req, res, path, url);
      return serveStatic(req, res, path);
    } catch (error) {
      jsonResponse(res, error.statusCode || 500, {
        error: error.message || "Internal server error",
        app: "healthcare-testimony"
      });
    }
  });
}

async function routeApi(req, res, path, url) {
  if (req.method === "GET" && path === "/api/health") {
    return jsonResponse(res, 200, {
      ok: true,
      app: "healthcare-testimony",
      standalone: true,
      basePath: config.basePath,
      dbMode: dbMode(config),
      llmEnabled: config.useLlm && Boolean(config.openaiApiKey),
      time: nowIso()
    });
  }
  if (req.method === "GET" && path === "/api/committees") return jsonResponse(res, 200, { committees: listCommittees() });
  if (req.method === "GET" && path === "/api/roster") {
    return jsonResponse(res, 200, getRoster({ committeeCode: url.searchParams.get("committee"), includeSenators: url.searchParams.get("include"), excludeSenators: url.searchParams.get("exclude") }));
  }
  if (req.method === "GET") {
    const jobMatch = path.match(/^\/api\/jobs\/([^/]+)$/);
    if (jobMatch) {
      if (jobs.has(jobMatch[1])) return jsonResponse(res, 200, jobs.get(jobMatch[1]));
      const stored = await getStoredJob(config, jobMatch[1]);
      return jsonResponse(res, stored ? 200 : 404, stored || { error: "Job not found." });
    }
  }

  if (req.method !== "POST") return notFound(res);
  const body = await readJsonBody(req);

  if (path === "/api/analyze") {
    lastAnalysis = runAnalysis(body);
    lastAnalysis.persistence = await safePersist(lastAnalysis);
    return jsonResponse(res, 200, lastAnalysis);
  }
  if (path === "/api/extract-claims") return jsonResponse(res, 200, extractClaims(body));
  if (path === "/api/retrieve-evidence") return jsonResponse(res, 200, retrieveEvidence(body));
  if (path === "/api/score-alignment") return jsonResponse(res, 200, scoreAlignment(body));
  if (path === "/api/generate-questions") return jsonResponse(res, 200, generateQuestions(body));
  if (path === "/api/rewrite-testimony") return jsonResponse(res, 200, rewriteTestimony(body));
  if (path === "/api/export/markdown") {
    const analysis = body.analysis || lastAnalysis || runAnalysis(DEMO_INPUT);
    const markdown = buildMarkdownReport(analysis, body.reportType || "ceo_briefing_memo");
    return jsonResponse(res, 200, { markdown, reportType: body.reportType || "ceo_briefing_memo" });
  }
  if (path === "/api/export/pdf") {
    const analysis = body.analysis || lastAnalysis || runAnalysis(DEMO_INPUT);
    const markdown = buildMarkdownReport(analysis, body.reportType || "ceo_briefing_memo");
    const pdf = markdownToPdfBuffer(markdown);
    res.writeHead(200, {
      "content-type": "application/pdf",
      "content-disposition": "attachment; filename=\"healthcare-testimony-report.pdf\"",
      "content-length": pdf.length
    });
    return res.end(pdf);
  }
  if (path === "/api/admin/refresh") return jsonResponse(res, 200, { status: "ok", refreshed: false, mode: "local_fixture" });
  if (path === "/api/ingest/congress") return jsonResponse(res, 200, await ingestCongress(body));
  if (path === "/api/ingest/govinfo") return jsonResponse(res, 200, await ingestGovInfo(body));
  if (path === "/api/jobs") {
    const analysis = runAnalysis(body.input || body || DEMO_INPUT);
    analysis.persistence = await safePersist(analysis);
    const id = analysis.id || stableId("job", `${Date.now()}:${JSON.stringify(body)}`);
    const job = { id, status: "completed", createdAt: nowIso(), completedAt: nowIso(), result: analysis };
    jobs.set(id, job);
    lastAnalysis = analysis;
    return jsonResponse(res, 200, job);
  }
  return notFound(res);
}

async function serveStatic(req, res, path) {
  if (req.method !== "GET" && req.method !== "HEAD") return notFound(res);
  let filePath = path === "/" || path === "" ? "/index.html" : path;
  if (filePath === "/healthcare-testimony") filePath = "/index.html";
  const target = normalize(join(publicDir, filePath));
  if (!target.startsWith(publicDir)) return notFound(res);
  try {
    if (filePath === "/index.html") return serveIndex(res);
    const data = await readFile(target);
    res.writeHead(200, {
      "content-type": contentType(extname(target)),
      "cache-control": filePath === "/index.html" ? "no-store" : "public, max-age=300"
    });
    if (req.method === "HEAD") return res.end();
    return res.end(data);
  } catch {
    if (!filePath.includes(".")) return serveIndex(res);
    return notFound(res);
  }
}

async function serveIndex(res) {
  const data = (await readFile(join(publicDir, "index.html"), "utf8")).replaceAll("%BASE_PATH%", config.basePath || "");
  res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  res.end(data);
}

function stripBasePath(pathname, basePath) {
  if (!basePath) return pathname || "/";
  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`)) return pathname.slice(basePath.length) || "/";
  return null;
}

function contentType(ext) {
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
  }[ext] || "application/octet-stream";
}

function notFound(res) {
  return jsonResponse(res, 404, { error: "Not found", app: "healthcare-testimony" });
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  createAppServer().listen(config.port, "0.0.0.0", () => {
    console.log(`Healthcare CEO Senate Testimony Alignment Tool running at http://localhost:${config.port}${config.basePath}`);
  });
}

async function safePersist(analysis) {
  try {
    return await persistAnalysis(config, analysis);
  } catch (error) {
    return {
      persisted: false,
      error: error.message,
      warning: "Analysis completed but database persistence failed."
    };
  }
}
