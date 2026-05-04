import { createHash } from "node:crypto";

export const DEFAULT_BASE_PATH = "/healthcare-testimony";

export function envConfig(env = process.env) {
  const basePath = normalizeBasePath(env.BASE_PATH || DEFAULT_BASE_PATH);
  return {
    port: Number(env.PORT || 4174),
    basePath,
    publicBaseUrl: env.PUBLIC_BASE_URL || `http://localhost:${env.PORT || 4174}${basePath}`,
    databaseUrl: env.DATABASE_URL || "",
    pgssl: String(env.PGSSL || "false").toLowerCase() === "true",
    congressApiKey: env.CONGRESS_API_KEY || "",
    govinfoApiKey: env.GOVINFO_API_KEY || "",
    openaiApiKey: env.OPENAI_API_KEY || "",
    openaiModel: env.OPENAI_MODEL || "gpt-5.4-mini",
    openaiEmbeddingModel: env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    useLlm: String(env.USE_LLM || "false").toLowerCase() === "true",
    runInlineJobs: String(env.RUN_INLINE_JOBS || "true").toLowerCase() === "true",
    enableScheduler: String(env.ENABLE_SCHEDULER || "false").toLowerCase() === "true",
    adminRefreshToken: env.ADMIN_REFRESH_TOKEN || "",
    workerMaxPages: Number(env.WORKER_MAX_PAGES || 1),
    workerIdleMs: Number(env.WORKER_IDLE_MS || 5000)
  };
}

export function normalizeBasePath(path) {
  if (!path || path === "/") return "";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/+$/, "");
}

export function jsonResponse(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers
  });
  res.end(body);
}

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
  if (!body.trim()) return {};
  try {
    return JSON.parse(body);
  } catch (error) {
    const err = new Error("Request body must be valid JSON.");
    err.statusCode = 400;
    throw err;
  }
}

export function stableId(prefix, value) {
  return `${prefix}_${createHash("sha1").update(String(value)).digest("hex").slice(0, 12)}`;
}

export function contentHash(value) {
  return createHash("sha256").update(String(value || "")).digest("hex");
}

export function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lower(value) {
  return String(value || "").toLowerCase();
}

export function splitSentencesWithSpans(text) {
  const source = String(text || "").replace(/\r\n/g, "\n");
  const results = [];
  const sentenceRegex = /[^.!?\n]+(?:[.!?]+|$)/g;
  let match;
  while ((match = sentenceRegex.exec(source)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (trimmed.length < 18) continue;
    const leading = raw.search(/\S/);
    const start = match.index + (leading < 0 ? 0 : leading);
    results.push({ text: trimmed, start, end: start + trimmed.length });
  }
  return results;
}

export function parseList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value || "")
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function nowIso() {
  return new Date().toISOString();
}
