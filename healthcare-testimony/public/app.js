const basePath = detectBasePath();
const apiBase = `${basePath}/api`;
let currentAnalysis = null;

const demoInput = {
  hearingTitle: "AI, Prior Authorization, and Patient Access in Medicare Advantage",
  committees: ["finance", "help", "aging", "judiciary"],
  healthcareTopic: "AI prior authorization Medicare Advantage patient access",
  companyType: "AI healthcare company",
  ceoName: "Jordan Lee",
  organizationName: "CareRoute AI",
  testimonyText: "Our AI-enabled prior authorization platform automates routine decisions, reduces administrative burden, and ensures patients get faster access to medically necessary care."
};

const els = {
  form: document.querySelector("#setupForm"),
  health: document.querySelector("#healthStatus"),
  dashboard: document.querySelector("#executiveDashboard"),
  matrixBody: document.querySelector("#matrixBody"),
  matrixCount: document.querySelector("#matrixCount"),
  claimCount: document.querySelector("#claimCount"),
  claimAnalysis: document.querySelector("#claimAnalysis"),
  cardCount: document.querySelector("#cardCount"),
  senatorCards: document.querySelector("#senatorCards"),
  questionCount: document.querySelector("#questionCount"),
  questions: document.querySelector("#questions"),
  rewriteCount: document.querySelector("#rewriteCount"),
  rewrites: document.querySelector("#rewrites"),
  pathLabel: document.querySelector("#pathLabel")
};

els.pathLabel.textContent = basePath || "/";
bindEvents();
checkHealth();
runAnalysis(demoInput);

function bindEvents() {
  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    runAnalysis(collectForm());
  });
  document.querySelector("#loadDemoButton").addEventListener("click", () => {
    fillForm(demoInput);
    runAnalysis(demoInput);
  });
  document.querySelector("#refreshButton").addEventListener("click", refreshRosters);
  document.querySelector("#selectedButton").addEventListener("click", () => runAnalysis({ ...collectForm(), selectedOnly: true }));
  document.querySelector("#markdownButton").addEventListener("click", exportMarkdown);
  document.querySelector("#pdfButton").addEventListener("click", exportPdf);
}

async function checkHealth() {
  try {
    const health = await apiGet("/health");
    els.health.textContent = health.ok ? (health.llmEnabled ? `OpenAI synthesis: ${health.llmModel}` : "Local deterministic mode") : "Unavailable";
    els.health.classList.toggle("ok", Boolean(health.ok));
  } catch {
    els.health.textContent = "Unavailable";
  }
}

async function refreshRosters() {
  const committees = collectCommittees();
  await Promise.all((committees.length ? committees : ["finance"]).map((committee) => apiGet(`/roster?committee=${encodeURIComponent(committee)}&refresh=1`)));
  els.health.textContent = "Rosters loaded";
  els.health.classList.add("ok");
}

async function runAnalysis(payload) {
  setBusy(true);
  try {
    currentAnalysis = await apiPost("/analyze", payload);
    renderAnalysis(currentAnalysis);
  } catch (error) {
    renderError(error);
  } finally {
    setBusy(false);
  }
}

function renderAnalysis(analysis) {
  renderExecutiveDashboard(analysis);
  renderMatrix(analysis.matrix || []);
  renderClaims(analysis.claims || [], analysis.alignmentResults || []);
  renderSenatorCards(analysis.senatorCards || []);
  renderQuestions(analysis.questions || []);
  renderRewrites(analysis.rewrites || []);
}

function renderExecutiveDashboard(analysis) {
  const summary = analysis.executiveSummary || {};
  const cards = [
    ["Overall risk", `${summary.overallRiskScore ?? 0}/100`, summary.evidenceConfidenceWarning || ""],
    ["Aligned claims", summary.alignedClaims ?? 0, "Claims with at least partial public-record fit."],
    ["Risky claims", summary.riskyClaims ?? 0, "Claims needing tighter answer frames."],
    ["Highest-risk senators", summary.highestRiskSenators?.length ?? 0, (summary.highestRiskSenators || []).map((row) => row.senator).join(", ") || "None flagged"],
    ["Strong jurisdiction", (summary.strongestJurisdictionCommittees || []).join(", ") || "Auto-detect", "Committees selected from issue tags."],
    ["Top edit", summary.topRecommendedEdits?.[0] ? "Ready" : "None", summary.topRecommendedEdits?.[0] || "No high-risk rewrite generated."]
  ];
  els.dashboard.innerHTML = cards.map(([label, value, detail]) => `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <p>${escapeHtml(detail)}</p>
    </div>
  `).join("");
}

function renderMatrix(rows) {
  els.matrixCount.textContent = `${rows.length} senators`;
  els.matrixBody.innerHTML = rows.map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.senator)}</strong></td>
      <td>${escapeHtml(row.state)}</td>
      <td>${escapeHtml(row.party)}</td>
      <td>${escapeHtml(row.committeeRole)}</td>
      <td>${escapeHtml(row.relevantCommittee)}</td>
      <td>${escapeHtml(row.alignmentLabel)}</td>
      <td>${riskPill(row.riskLevel)}</td>
      <td>${escapeHtml(row.evidenceStrength)}</td>
      <td>${escapeHtml(row.likelyConcern)}</td>
      <td>${row.topCitedSource ? `<a class="source-link" href="${escapeAttr(row.topCitedSource.url)}" target="_blank" rel="noreferrer">${escapeHtml(row.topCitedSource.title)}</a>` : "Missing"}</td>
      <td><button class="ghost" type="button" data-senator="${escapeAttr(row.senatorId)}">Open</button></td>
    </tr>
  `).join("");
}

function renderClaims(claims, alignmentResults) {
  els.claimCount.textContent = `${claims.length} claims`;
  if (!claims.length) return renderEmpty(els.claimAnalysis);
  els.claimAnalysis.innerHTML = claims.map((claim) => {
    const related = alignmentResults.filter((result) => result.claimId === claim.id);
    const aligned = related.filter((result) => result.alignmentScore > 0).map((result) => result.senatorName);
    const tension = related.filter((result) => result.alignmentScore < 0).map((result) => result.senatorName);
    const firstRisk = related.find((result) => result.riskLevel === "high") || related[0];
    return `
      <div class="item-card">
        <p class="claim-text">${escapeHtml(claim.claimText)}</p>
        <div>${riskPill(claim.riskLevel)} <span class="pill">${escapeHtml(claim.claimType)}</span></div>
        <p>Tags: ${claim.issueTags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</p>
        <p>Support status: ${escapeHtml(claim.supportStatus)}.</p>
        <p>Senators aligned: ${escapeHtml(aligned.slice(0, 5).join(", ") || "None identified")}</p>
        <p>Senators in tension: ${escapeHtml(tension.slice(0, 5).join(", ") || "None identified")}</p>
        <p>Risk explanation: ${escapeHtml(firstRisk?.riskSummary || "Evidence is thin.")}</p>
      </div>
    `;
  }).join("");
}

function renderSenatorCards(cards) {
  els.cardCount.textContent = `${cards.length} cards`;
  if (!cards.length) return renderEmpty(els.senatorCards);
  els.senatorCards.innerHTML = cards.map((card) => `
    <div class="item-card" id="card-${escapeAttr(card.senatorId)}">
      <h3>${escapeHtml(card.name)} (${escapeHtml(card.party)}-${escapeHtml(card.state)})</h3>
      <p>${escapeHtml(card.committeeRole)}</p>
      <p>Priorities: ${card.healthcareIssuePriorities.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</p>
      <p>${escapeHtml(card.alignmentWithCeoTestimony)}</p>
      <ul>${(card.likelyQuestions || []).slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <p>Use: ${escapeHtml((card.phrasesToUse || []).join("; "))}</p>
      <p>Avoid: ${escapeHtml((card.phrasesToAvoid || []).join("; "))}</p>
      <p>Confidence: ${escapeHtml(card.confidenceLevel)}</p>
    </div>
  `).join("");
}

function renderQuestions(questions) {
  els.questionCount.textContent = `${questions.length} questions`;
  if (!questions.length) return renderEmpty(els.questions);
  els.questions.innerHTML = questions.map((question) => `
    <div class="item-card">
      <h3>${escapeHtml(question.senatorName)} · ${escapeHtml(question.questionType)}</h3>
      <p class="claim-text">${escapeHtml(question.likelyQuestion)}</p>
      <p>Trigger: ${escapeHtml(question.claimText)}</p>
      <p>Why it matters: ${escapeHtml(question.whyItMatters)}</p>
      <ul>${(question.answerFrame || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <p>Bad answer to avoid: ${escapeHtml(question.badAnswerToAvoid)}</p>
      <p>${citationLinks(question.citations)}</p>
    </div>
  `).join("");
}

function renderRewrites(rewrites) {
  els.rewriteCount.textContent = `${rewrites.length} rewrites`;
  if (!rewrites.length) return renderEmpty(els.rewrites);
  els.rewrites.innerHTML = rewrites.map((rewrite) => `
    <div class="item-card">
      <p class="rewrite-text">Original: ${escapeHtml(rewrite.originalText)}</p>
      <p>Risk: ${escapeHtml(rewrite.riskExplanation)}</p>
      <p class="rewrite-text">Suggested: ${escapeHtml(rewrite.suggestedRewrite)}</p>
      <p>${escapeHtml(rewrite.whySafer)}</p>
      <p>${citationLinks(rewrite.citations)}</p>
    </div>
  `).join("");
}

async function exportMarkdown() {
  const response = await apiPost("/export/markdown", { analysis: currentAnalysis, reportType: "ceo_briefing_memo" });
  downloadBlob(new Blob([response.markdown], { type: "text/markdown" }), "healthcare-testimony-ceo-briefing.md");
}

async function exportPdf() {
  const response = await fetch(`${apiBase}/export/pdf`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ analysis: currentAnalysis, reportType: "ceo_briefing_memo" })
  });
  if (!response.ok) throw new Error("PDF export failed.");
  downloadBlob(await response.blob(), "healthcare-testimony-report.pdf");
}

function collectForm() {
  const data = new FormData(els.form);
  return {
    hearingTitle: data.get("hearingTitle"),
    committees: collectCommittees(),
    healthcareTopic: data.get("healthcareTopic"),
    companyType: data.get("companyType"),
    ceoName: data.get("ceoName"),
    organizationName: data.get("organizationName"),
    dateRange: data.get("dateRange"),
    testimonyText: data.get("testimonyText"),
    testimonyUrl: data.get("testimonyUrl"),
    specificSenators: data.get("specificSenators"),
    excludeSenators: data.get("excludeSenators")
  };
}

function collectCommittees() {
  return [...els.form.querySelectorAll('input[name="committees"]:checked')].map((input) => input.value);
}

function fillForm(values) {
  Object.entries(values).forEach(([key, value]) => {
    const input = els.form.elements[key];
    if (input && typeof value === "string") input.value = value;
  });
}

async function apiGet(path) {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function apiPost(path, payload) {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload || {})
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function detectBasePath() {
  const marker = "/healthcare-testimony";
  return window.location.pathname.startsWith(marker) ? marker : "";
}

function setBusy(isBusy) {
  document.querySelector("#analyzeButton").disabled = isBusy;
  if (isBusy) els.health.textContent = "Analyzing";
}

function renderError(error) {
  els.dashboard.innerHTML = `<div class="metric"><span>Error</span><strong>Check input</strong><p>${escapeHtml(error.message)}</p></div>`;
}

function renderEmpty(target) {
  target.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
}

function riskPill(level) {
  return `<span class="pill risk-${escapeAttr(level || "medium")}">${escapeHtml(level || "medium")}</span>`;
}

function citationLinks(citations = []) {
  if (!citations.length) return "Citation: missing";
  return citations.slice(0, 2).map((citation) => `<a href="${escapeAttr(citation.url)}" target="_blank" rel="noreferrer">${escapeHtml(citation.title)}</a>`).join("; ");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
