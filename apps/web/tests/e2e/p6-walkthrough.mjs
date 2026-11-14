#!/usr/bin/env node
// Recorrido E2E P6 con backend real (FastAPI + SQLite temporal + semilla sintética + proveedor demo)
// y navegador real (Playwright/Chromium). No es una dependencia del proyecto: se resuelve
// `playwright` instalado localmente o de forma global (ver README.md junto a este archivo).
//
// Uso:
//   node apps/web/tests/e2e/p6-walkthrough.mjs --host=harness|p5 [--api-port=8541] [--web-port=5541]
//        [--root=<repo>] [--db=<ruta.db>] [--headed] [--screenshots=<dir>]
//
// Recorrido: investigación → evidencia (expediente) → A/B y evidencia del corpus → vigencia
// (cambiar filtros tras comparar ⇒ resultado marcado como anterior) → consulta sin evidencia
// suficiente → informe y descarga (descargado == mostrado == GET /report) → recarga de página
// + reinicio de la API y recuperación del expediente → error recuperable (API parada ⇒ Retry).
// Todos los datos son fixtures sintéticos, no mediciones NASA. Código de salida ≠ 0 si algo falla.
import { spawn, execSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------- argumentos
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const match = /^--([^=]+)(?:=(.*))?$/.exec(arg);
  if (!match) throw new Error(`Unknown argument: ${arg}`);
  return [match[1], match[2] ?? "true"];
}));
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(args.root ?? path.join(HERE, "../../../.."));
const HOST = args.host ?? "harness";
const API_PORT = Number(args["api-port"] ?? process.env.P6_E2E_API_PORT ?? 8541);
const WEB_PORT = Number(args["web-port"] ?? process.env.P6_E2E_WEB_PORT ?? 5541);
const API = `http://127.0.0.1:${API_PORT}`;
const WEB = `http://127.0.0.1:${WEB_PORT}`;
const TIMEOUT = Number(args.timeout ?? 20000);
const workDir = mkdtempSync(path.join(process.env.P6_E2E_TMP ?? tmpdir(), "flamelab-p6-e2e-"));
const DB = path.resolve(args.db ?? path.join(workDir, "e2e.db"));
const SHOTS = args.screenshots ? path.resolve(args.screenshots) : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

function loadPlaywright() {
  const candidates = [path.join(ROOT, "package.json"), import.meta.url];
  if (process.env.PLAYWRIGHT_MODULE) candidates.unshift(process.env.PLAYWRIGHT_MODULE);
  for (const base of candidates) {
    try { return createRequire(base)("playwright"); } catch { /* siguiente */ }
  }
  try {
    const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
    return createRequire(path.join(globalRoot, "noop.js"))("playwright");
  } catch {
    throw new Error("playwright is not installed (locally or globally). See apps/web/tests/e2e/README.md.");
  }
}

// ---------------------------------------------------------------- adaptadores de host
// Solo estos pasos dependen del host. El resto usa roles y atributos de los paneles P6.
const hosts = {
  harness: {
    async ready(page) { await page.getByRole("heading", { name: /FlameLab SI/ }).first().waitFor(); },
    async investigate(page) { await page.getByRole("button", { name: "Investigar", exact: true }).click(); },
    async changeFilters(page) {
      const box = page.getByLabel(/RankingRequest/);
      const value = JSON.parse(await box.inputValue());
      value.limit = (value.limit ?? 3) === 2 ? 1 : 2;
      await box.fill(JSON.stringify(value, null, 2));
    },
    async restoreFilters(page) { await page.getByRole("button", { name: "Restaurar filtros sintéticos" }).click(); },
    viewer(page) { return page.locator("section", { has: page.getByRole("heading", { name: /Evidencia seleccionada/ }) }); },
    corpusMarker: "Leída del corpus activo actual",
    recordMarker: /Leída del expediente/
  },
  p5: {
    async ready(page) { await page.getByRole("heading", { name: "Mission Brief" }).waitFor(); },
    async investigate(page) { await page.getByRole("button", { name: "Investigate", exact: true }).click(); },
    async changeFilters(page) {
      const box = page.getByRole("spinbutton", { name: /Max\. trials/ });
      await box.fill((await box.inputValue()) === "2" ? "1" : "2");
    },
    async restoreFilters(page) { await page.getByRole("button", { name: "Reset demo query" }).click(); },
    viewer(page) { return page.locator("#evidence"); },
    corpusMarker: "Active corpus · not in this research record",
    recordMarker: null
  }
};
const host = hosts[HOST];
if (!host) throw new Error(`--host must be one of: ${Object.keys(hosts).join(", ")}`);

// ---------------------------------------------------------------- procesos
const children = new Set();
function start(name, command, commandArgs, env) {
  const child = spawn(command, commandArgs, { cwd: ROOT, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"], detached: true });
  const log = [];
  const keep = (chunk) => { log.push(String(chunk)); if (log.length > 200) log.shift(); };
  child.stdout.on("data", keep); child.stderr.on("data", keep);
  children.add(child);
  child.on("exit", () => children.delete(child));
  child.logTail = () => log.join("").split("\n").slice(-25).join("\n");
  child.label = name;
  return child;
}
async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode) return;
  const done = new Promise((resolve) => child.once("exit", resolve));
  try { process.kill(-child.pid, "SIGTERM"); } catch { child.kill("SIGTERM"); }
  const timer = setTimeout(() => { try { process.kill(-child.pid, "SIGKILL"); } catch { /* ya terminado */ } }, 5000);
  await done; clearTimeout(timer);
}
async function waitHttp(url, child, ms = 60000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (child.exitCode !== null) throw new Error(`${child.label} exited early:\n${child.logTail()}`);
    try { const response = await fetch(url); if (response.ok) return; } catch { /* aún no */ }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timeout waiting for ${url}:\n${child.logTail()}`);
}
function startApi() {
  // --no-sync: no reinstala el entorno (en un worktree con .venv enlazado no debe tocarse).
  // PYTHONPATH asegura que se ejecuta el código de ROOT y no el del paquete editable instalado.
  return start("api", "uv", ["run", "--no-sync", "uvicorn", "flamelab.main:app", "--host", "127.0.0.1", "--port", String(API_PORT)], {
    FLAMELAB_SEED_DEMO: "true",
    FLAMELAB_AI_PROVIDER: "demo",
    FLAMELAB_DATABASE_URL: `sqlite:///${DB}`,
    FLAMELAB_CORS_ORIGINS: JSON.stringify([WEB]),
    PYTHONPATH: [path.join(ROOT, "apps/api/src"), process.env.PYTHONPATH].filter(Boolean).join(path.delimiter)
  });
}

// ---------------------------------------------------------------- comprobaciones
const results = [];
let current = "setup";
function check(condition, message) {
  if (!condition) throw new Error(message);
  results.push({ step: current, ok: true, message });
}
async function step(name, fn) {
  current = name;
  const started = Date.now();
  try {
    await fn();
    console.log(`PASS  ${name} (${Date.now() - started} ms)`);
  } catch (error) {
    results.push({ step: name, ok: false, message: error instanceof Error ? error.message : String(error) });
    console.log(`FAIL  ${name}: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
    throw error;
  }
}
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${HOST}-${name}.png`), fullPage: true }); };

// ---------------------------------------------------------------- recorrido
let api = startApi();
const web = start("web", "npx", ["vite", "--config", "apps/web/vite.config.ts", "--port", String(WEB_PORT), "--strictPort", "--host", "127.0.0.1"], {
  VITE_API_BASE_URL: API
});
let browser;
let exitCode = 0;
const pageErrors = [];
try {
  await waitHttp(`${API}/api/v1/health`, api);
  await waitHttp(WEB, web);
  const { chromium } = loadPlaywright();
  browser = await chromium.launch({ headless: args.headed !== "true" });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const lab = page.getByRole("region", { name: "Mission Lab · evidence scenarios" });
  const report = page.getByRole("region", { name: "Report and recovery" });
  // Todas las lecturas de evidencia: el host puede no repetir una petición si ya mostraba esa evidencia.
  const evidenceRequests = [];
  page.on("request", (request) => { if (/\/api\/v1\/evidence\//.test(request.url())) evidenceRequests.push(new URL(request.url())); });
  async function lastEvidenceRequest(evidenceId) {
    const until = Date.now() + TIMEOUT;
    while (Date.now() < until) {
      const hits = evidenceRequests.filter((url) => decodeURIComponent(url.pathname).endsWith(`/evidence/${evidenceId}`));
      if (hits.length) return hits[hits.length - 1];
      await page.waitForTimeout(100);
    }
    throw new Error(`no request for evidence ${evidenceId}`);
  }
  let researchId = "";
  let reportText = "";

  await step("load host and P6 panels", async () => {
    await page.goto(WEB);
    await host.ready(page);
    await lab.waitFor(); await report.waitFor();
    check(await lab.getByText("Deterministic demo coordinator").count() === 0, "no provider text before a research");
  });

  await step("investigate (POST /research)", async () => {
    const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/research") && r.request().method() === "POST");
    await host.investigate(page);
    const body = await (await response).json();
    researchId = body.id;
    check(typeof researchId === "string" && researchId.length > 0, `research id returned: ${researchId}`);
    check(body.provider === "demo", "provider is the deterministic demo coordinator");
    await lab.getByText("Deterministic demo coordinator · no external model").waitFor();
    await lab.getByText(researchId, { exact: true }).first().waitFor();
    check(await lab.getByText(/prepared demo hypothesis|Prepared demo hypothesis/i).count() > 0 || body.hypotheses.length === 0,
      "hypotheses keep their backend label");
    await shot(page, "1-research");
  });

  await step("open evidence from the saved research (record)", async () => {
    const button = lab.getByRole("button", { name: /\(saved research\)$/ }).first();
    check(await button.count() > 0, "a hypothesis exposes an evidence reference");
    const name = await button.getAttribute("aria-label");
    const evidenceId = /Open evidence (.+) \(saved research\)/.exec(name ?? "")?.[1] ?? "";
    await button.click();
    const viewer = host.viewer(page);
    await viewer.getByText(evidenceId).first().waitFor();
    const url = await lastEvidenceRequest(evidenceId);
    check(url.searchParams.get("research_id") === researchId, `record evidence requested with research_id=${researchId}`);
    await page.waitForTimeout(200);
    check(!(await viewer.getByText(host.corpusMarker).isVisible().catch(() => false)), "record evidence is not labelled as active corpus");
    if (host.recordMarker) await viewer.getByText(host.recordMarker).waitFor();
  });

  await step("A/B comparison is an evidence comparison", async () => {
    await lab.getByRole("radio", { name: /lunar gravity/i }).check();
    const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/scenarios/compare"));
    await lab.getByRole("button", { name: /^Compare A vs B/ }).click();
    const body = await (await response).json();
    check(body.label === "evidence_comparison_not_physical_simulation", "API label evidence_comparison_not_physical_simulation");
    const result = lab.locator(".ml-result[data-freshness]").first();
    await result.waitFor();
    check(await result.getAttribute("data-freshness") === "current", "fresh comparison is marked current");
    await lab.getByText("Evidence comparison · not a physical simulation").waitFor();
    await lab.getByText("A · current filters").first().waitFor();
    check(body.ranking_b.items.length === 0, "lunar B has no eligible synthetic trial");
    await lab.getByText("Insufficient applicable evidence.").first().waitFor();
    await shot(page, "2-ab");
  });

  await step("open evidence of an A/B row from the active corpus", async () => {
    const button = lab.getByRole("button", { name: /\(current corpus\)$/ }).first();
    check(await button.count() > 0, "an A/B row exposes evidence");
    const name = await button.getAttribute("aria-label");
    const evidenceId = /Open evidence (.+) \(current corpus\)/.exec(name ?? "")?.[1] ?? "";
    const before = evidenceRequests.length;
    await button.click();
    await host.viewer(page).getByText(host.corpusMarker).first().waitFor();
    await host.viewer(page).getByText(evidenceId).first().waitFor();
    const url = evidenceRequests.slice(before).filter((u) => decodeURIComponent(u.pathname).endsWith(`/evidence/${evidenceId}`)).pop();
    check(url !== undefined && !url.searchParams.has("research_id"), "corpus evidence requested without research_id");
  });

  await step("changing filters after comparing marks the result as previous", async () => {
    await host.changeFilters(page);
    const result = lab.locator(".ml-result[data-freshness]").first();
    await page.waitForFunction((el) => el?.getAttribute("data-freshness") === "filters_changed", await result.elementHandle());
    await lab.getByText("Previous comparison — not computed with the current filters").waitFor();
    await lab.getByRole("heading", { name: /^Previous A\/B result/ }).waitFor();
    check(await lab.getByText("A · current filters").count() === 0, "A is no longer named 'current filters'");
    await shot(page, "3-stale");
    await host.restoreFilters(page);
    await page.waitForFunction((el) => el?.getAttribute("data-freshness") === "current", await result.elementHandle());
    check(true, "restoring the same filters makes the comparison current again");
  });

  await step("query without sufficient evidence", async () => {
    const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/research") && r.request().method() === "POST");
    await lab.getByRole("button", { name: "Run query without sufficient evidence" }).click();
    const body = await (await response).json();
    check(body.status === "insufficient_evidence", `status insufficient_evidence (got ${body.status})`);
    check(body.ranking.items.length === 0, "no eligible candidates");
    await lab.getByText("Insufficient evidence.", { exact: true }).waitFor();
    await lab.getByRole("heading", { name: /What is missing/ }).waitFor();
  });

  await step("report shown == GET /report == downloaded file", async () => {
    const pre = report.locator(`pre[data-research-id="${researchId}"]`).first();
    await pre.waitFor();
    reportText = await pre.textContent() ?? "";
    const server = await (await fetch(`${API}/api/v1/research/${encodeURIComponent(researchId)}/report`)).text();
    check(reportText.length > 0 && reportText === server, "shown report equals GET /report byte for byte");
    await report.getByText("Markdown source · not rendered").waitFor();
    const expectedName = (await report.locator(".rp-actions code").first().textContent())?.trim();
    const download = page.waitForEvent("download");
    await report.getByRole("button", { name: "Download report (.md)" }).click();
    const file = await download;
    check(file.suggestedFilename() === expectedName && /^flamelab-report-[A-Za-z0-9._-]+\.md$/.test(expectedName ?? ""),
      `download name ${file.suggestedFilename()}`);
    const saved = path.join(workDir, "download.md");
    await file.saveAs(saved);
    check(readFileSync(saved, "utf8") === server, "downloaded file equals GET /report");
    await shot(page, "4-report");
  });

  await step("page reload + API restart, then recover the same research", async () => {
    await stop(api);
    api = startApi();
    await waitHttp(`${API}/api/v1/health`, api);
    await page.reload();
    await host.ready(page);
    await report.getByText("No active research.").first().waitFor();
    await report.getByRole("button", { name: "Reopen last research" }).click();
    const pre = report.locator(`pre[data-research-id="${researchId}"]`).first();
    await pre.waitFor();
    check(await pre.textContent() === reportText, "recovered report equals the report shown before restart");
    await lab.getByText(researchId, { exact: true }).first().waitFor();
  });

  await step("unknown research id gives a 404 message", async () => {
    await report.getByLabel("Research id").fill("research-does-not-exist-p6-e2e");
    await report.getByRole("button", { name: "Recover", exact: true }).click();
    const alert = report.getByRole("alert").filter({ hasText: "not found" });
    await alert.waitFor();
    check(true, "404 shown in an alert");
  });

  await step("recoverable error: API down ⇒ alert with Retry; API back ⇒ Retry works", async () => {
    await stop(api);
    await report.getByRole("button", { name: "Reload", exact: true }).click();
    const alert = report.getByRole("alert").filter({ hasText: /unreachable|could not return/ });
    await alert.waitFor();
    const retry = alert.getByRole("button", { name: "Retry report" });
    await retry.waitFor();
    await shot(page, "5-error");
    api = startApi();
    await waitHttp(`${API}/api/v1/health`, api);
    await retry.click();
    const pre = report.locator(`pre[data-research-id="${researchId}"]`).first();
    await pre.waitFor();
    check(await pre.textContent() === reportText, "report restored after Retry");
  });

  await step("no uncaught page errors", async () => {
    check(pageErrors.length === 0, `uncaught page errors: ${pageErrors.join(" | ") || "none"}`);
  });
} catch (error) {
  exitCode = 1;
  if (!results.some((r) => !r.ok)) results.push({ step: current, ok: false, message: String(error?.stack ?? error) });
} finally {
  await browser?.close().catch(() => {});
  for (const child of [...children]) await stop(child);
  if (!args.db) rmSync(workDir, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.ok);
console.log("\n--- P6 walkthrough summary ---");
console.log(`host=${HOST} api=${API} web=${WEB} root=${ROOT}`);
console.log(`checks passed: ${results.filter((r) => r.ok).length} · failed: ${failed.length}`);
for (const failure of failed) console.log(`  [${failure.step}] ${failure.message}`);
console.log("Data: synthetic fixtures (not NASA measurements); AI: deterministic demo coordinator.");
process.exit(exitCode || failed.length ? 1 : 0);
