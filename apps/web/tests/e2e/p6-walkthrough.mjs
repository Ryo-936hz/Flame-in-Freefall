#!/usr/bin/env node
// Real browser + real demo API, isolated SQLite and owned processes on Windows/Linux.
// Synthetic fixtures only. No global npm/uv/Python or external AI credentials required.
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRuntime } from "./runtime.mjs";
import { verifySaffireContext } from "./p2-catalog-acceptance.mjs";

const allowed = new Set(["host", "root", "api-port", "web-port", "headed", "screenshots", "timeout"]);
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const match = /^--([^=]+)(?:=(.*))?$/.exec(arg);
  if (!match || !allowed.has(match[1])) throw new Error(`Unknown argument: ${arg}`);
  return [match[1], match[2] ?? "true"];
}));
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(args.root ?? path.join(HERE, "../../../.."));
const HOST = args.host ?? "p5";
if (HOST !== "p5") throw new Error("The integrated walkthrough supports --host=p5.");
const TIMEOUT = Number(args.timeout ?? 20000);
if (!Number.isFinite(TIMEOUT) || TIMEOUT < 100 || TIMEOUT > 120000) throw new Error("Invalid --timeout (100..120000 milliseconds).");
const port = (value) => value === undefined ? undefined : Number(value);
const runtime = await createRuntime(ROOT, {
  apiPort: port(args["api-port"] ?? process.env.P6_E2E_API_PORT),
  webPort: port(args["web-port"] ?? process.env.P6_E2E_WEB_PORT),
  tempBase: process.env.P6_E2E_TMP,
});
const { apiUrl: API, webUrl: WEB, directory: workDir, startApi, stop, waitHttp } = runtime;
const SHOTS = args.screenshots ? path.resolve(args.screenshots) : null;
const host = {
  async ready(page) { await page.getByRole("heading", { name: "Mission Brief" }).waitFor(); },
  async investigate(page) { await page.getByRole("button", { name: "Investigate", exact: true }).click(); },
  async changeFilters(page) {
    const box = page.getByRole("spinbutton", { name: /Max\. trials/ });
    await box.fill((await box.inputValue()) === "2" ? "1" : "2");
  },
  async restoreFilters(page) { await page.getByRole("button", { name: "Reset filters", exact: true }).click(); },
  viewer(page) { return page.locator("#evidence"); },
  corpusMarker: "Active corpus",
  recordMarker: null,
};

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
let api;
let browser;
let exitCode = 0;
let closing;
const pageErrors = [];
const heldReleases = [];
const cleanup = () => closing ??= (async () => {
  for (const release of heldReleases) release();
  await browser?.close().catch(() => {});
  await runtime.close();
})();
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => { void cleanup().finally(() => process.exit(130)); });
let fatal = false;
const fatalError = (error) => {
  if (fatal) return;
  fatal = true;
  console.error(`Fatal E2E error: ${error?.stack ?? error}`);
  void cleanup().catch((cleanupError) => console.error(String(cleanupError))).finally(() => process.exit(1));
};
process.once("unhandledRejection", fatalError);
process.once("uncaughtException", fatalError);
try {
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  api = startApi();
  const web = runtime.startWeb();
  await waitHttp(`${API}/api/v1/health`, api);
  await waitHttp(WEB, web);
  console.log(`Owned demo servers: api=${API} web=${WEB}`);
  browser = await runtime.chromium.launch({ headless: args.headed !== "true" });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
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
  const comparisonResult = () => lab.locator('[data-result-kind="comparison"]');
  const queryResult = () => lab.locator('[data-result-kind="query"]');
  const freshness = async (locator, expected) => {
    await locator.waitFor();
    await page.waitForFunction(({ element, value }) => element?.getAttribute("data-freshness") === value,
      { element: await locator.elementHandle(), value: expected });
  };
  const settle = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  async function holdNext(pathname, method = "GET") {
    let release, arrived, finished;
    const gate = new Promise((resolve) => { release = resolve; });
    const seen = new Promise((resolve) => { arrived = resolve; });
    const done = new Promise((resolve) => { finished = resolve; });
    heldReleases.push(release);
    const matcher = (url) => decodeURIComponent(url.pathname) === pathname;
    let claimed = false;
    let failure = null;
    const handler = async (route) => {
      if (route.request().method() !== method || claimed) { await route.continue(); return; }
      claimed = true;
      try {
        const response = await route.fetch();
        arrived();
        await gate;
        await route.fulfill({ response });
      } catch (error) {
        // Browser cancellation is also a valid outcome when Reset aborts a request.
        const networkFailure = route.request().failure()?.errorText ?? "";
        if (!closing && !/ERR_ABORTED|NS_BINDING_ABORTED/.test(networkFailure)) failure = error;
      } finally {
        arrived();
        // Remove the handler only after resolving its intercepted request.
        await page.unroute(matcher, handler).catch(() => {});
        finished();
      }
    };
    await page.route(matcher, handler);
    const bounded = async (promise, label) => {
      let timer;
      try {
        return await Promise.race([promise, new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Timeout holding ${label}: ${method} ${pathname}`)), TIMEOUT);
        })]);
      } finally { clearTimeout(timer); }
    };
    const checked = async (promise, label) => { await bounded(promise, label); if (failure) throw failure; };
    return { get seen() { return checked(seen, "request"); }, release, get done() { return checked(done, "response"); } };
  }

  await step("load host and P6 panels", async () => {
    await page.goto(WEB);
    await host.ready(page);
    await lab.waitFor(); await report.waitFor();
    check(await lab.getByText("Deterministic demo coordinator").count() === 0, "no provider text before a research");
  });

  await step("P2 catalog remains reachable", async () => {
    await page.locator(".p6-catalog summary").click();
    const title = page.locator("#catalog-title");
    await title.waitFor();
    check(await title.isVisible(), "the integrated host retains the study catalog");
    const studies = page.getByRole("combobox", { name: "Estudio", exact: true });
    await page.waitForFunction((select) => select?.options.length > 1, await studies.elementHandle());
    const studyId = await studies.locator("option").nth(1).getAttribute("value");
    const sources = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(`/studies/${encodeURIComponent(studyId)}/evidence`));
    await studies.selectOption(studyId);
    check((await sources).ok(), "catalog study evidence endpoint is reachable");
    await page.locator(".p6-catalog summary").first().click();
  });

  await step("Saffire documentary context never claims imported NASA data", async () => {
    await verifySaffireContext({ page, check, screenshots: SHOTS });
  });

  await step("A/B evidence opens before any research exists", async () => {
    const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/scenarios/compare"));
    await lab.getByRole("button", { name: /^Compare A vs B/ }).click();
    const body = await (await response).json();
    check(body.metric === "flame_spread_rate_mm_s", "A/B explicitly requests the selected metric");
    const button = lab.getByRole("button", { name: /\(current corpus\)$/ }).first();
    await button.waitFor();
    const evidenceId = /Open evidence (.+) \(current corpus\)/.exec(await button.getAttribute("aria-label") ?? "")?.[1];
    const sourceResponse = page.waitForResponse((r) => decodeURIComponent(new URL(r.url()).pathname).endsWith(`/evidence/${evidenceId}`));
    await button.click();
    const returnedSource = await sourceResponse;
    const sourceBody = await returnedSource.json();
    const url = new URL(returnedSource.url());
    check(!url.searchParams.has("research_id"), "pre-research evidence reads the active corpus");
    await host.viewer(page).getByText(host.corpusMarker, { exact: false }).first().waitFor();
    await host.viewer(page).getByText(evidenceId, { exact: true }).waitFor();
    check(await host.viewer(page).locator(".ev-text").textContent() === sourceBody.text, "corpus source text is displayed literally");
    check(await report.getByText(/No active research\./).isVisible(), "opening corpus evidence does not invent a research record");
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
    const sourceBody = await (await fetch(`${API}/api/v1/evidence/${encodeURIComponent(evidenceId)}?research_id=${encodeURIComponent(researchId)}`)).json();
    check(await viewer.locator(".ev-text").textContent() === sourceBody.text, "historical source text is displayed literally");
  });

  await step("Earth scenario selects the known-zero trial", async () => {
    await lab.getByRole("radio", { name: /Earth gravity/i }).check();
    const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/scenarios/compare"));
    await lab.getByRole("button", { name: /^Compare A vs B/ }).click();
    const body = await (await response).json();
    check(body.metric === "flame_spread_rate_mm_s", "Earth comparison retains the selected flame-spread metric");
    check(body.ranking_b.items.length === 1 && body.ranking_b.items[0].trial_id === "synthetic:trial-4",
      "the Earth fixture with a known zero remains eligible for the metric");
    await lab.locator(".ml-row-entered").getByText("synthetic:trial-4", { exact: true }).waitFor();
    check(await lab.locator(".ml-row-left").count() === 3, "the UI shows all three microgravity fixtures leaving");
  });

  await step("scored flow preserves trials and changes similarity only", async () => {
    await lab.getByRole("radio", { name: /flow 2 cm\/s scored/i }).check();
    const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/scenarios/compare"));
    await lab.getByRole("button", { name: /^Compare A vs B/ }).click();
    const body = await (await response).json();
    const expected = [["synthetic:trial-1", 1], ["synthetic:trial-2", 0.985], ["synthetic:trial-3", 0.96]];
    check(body.ranking_a.items.length === 3 && body.ranking_a.items.every((item) => item.similarity === 1), "varied-flow A has three similarity-1 candidates");
    check(body.ranking_b.items.length === 3 && expected.every(([id, value], index) => {
      const item = body.ranking_b.items[index];
      return item.trial_id === id && Math.abs(item.similarity - value) < 1e-12;
    }), "scored-flow B matches the independently specified fixture similarities");
    const row = lab.locator(".ml-row-kept").filter({ hasText: "synthetic:trial-2" });
    await row.locator('[data-label="Similarity B"]').getByText("0.985", { exact: true }).waitFor();
    check(await lab.locator(".ml-row-kept").count() === 3, "the UI labels the same three trials as kept");
  });

  await step("A/B comparison is an evidence comparison", async () => {
    await lab.getByRole("radio", { name: /lunar gravity/i }).check();
    const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/scenarios/compare"));
    await lab.getByRole("button", { name: /^Compare A vs B/ }).click();
    const body = await (await response).json();
    check(body.label === "evidence_comparison_not_physical_simulation", "API label evidence_comparison_not_physical_simulation");
    const result = lab.locator('[data-result-kind="comparison"]');
    await result.waitFor();
    check(await result.getAttribute("data-freshness") === "current", "fresh comparison is marked current");
    await lab.getByText("Evidence comparison · not a physical simulation").waitFor();
    await lab.getByText("A · current filters").first().waitFor();
    check(body.ranking_b.items.length === 0, "lunar B has no eligible synthetic trial");
    await lab.getByText("Insufficient applicable evidence.").first().waitFor();
    await shot(page, "2-ab");
  });

  await step("desktop themes and mobile layout keep P6 within the viewport", async () => {
    const noOverflow = async (label) => {
      await settle();
      const bounds = await page.evaluate(() => ({
        width: window.innerWidth, scroll: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("body *")].map((element) => {
          const rect = element.getBoundingClientRect();
          return { tag: element.tagName, class: element.className, width: rect.width, left: rect.left, right: rect.right, height: rect.height };
        }).filter((item) => item.height > 0 && item.right > window.innerWidth + 1).slice(-20),
      }));
      if (bounds.scroll > bounds.width + 1) {
        console.log(`LAYOUT ${label}: ${JSON.stringify(bounds)}`);
        if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "p5-overflow.png"), fullPage: true });
      }
      check(bounds.scroll <= bounds.width + 1, `${label}: no page horizontal overflow (${bounds.scroll}/${bounds.width}px)`);
    };
    await lab.scrollIntoViewIfNeeded();
    await noOverflow("desktop dark");
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "p5-desktop-dark.png") });
    await page.getByRole("switch", { name: "Night mode" }).click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
    const inputColors = async (label) => console.log(`THEME ${label}: ${JSON.stringify(await page.evaluate(() =>
      [...document.querySelectorAll('#brief [data-cond="gravity_regime"] input, #brief input[type="number"]')].map((element) => {
        const style = getComputedStyle(element);
        return { value: element.value, type: element.type, color: style.color, webkitTextFillColor: style.webkitTextFillColor, backgroundColor: style.backgroundColor };
      })))}`);
    await inputColors("light immediately");
    await page.waitForTimeout(1100);
    await inputColors("light after transition");
    await noOverflow("desktop light");
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "p5-desktop-light.png") });
    await page.getByRole("switch", { name: "Night mode" }).click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
    await page.setViewportSize({ width: 390, height: 844 });
    await lab.scrollIntoViewIfNeeded();
    await noOverflow("mobile 390px");
    if (SHOTS) {
      await page.screenshot({ path: path.join(SHOTS, "p5-mobile-390.png") });
      await page.screenshot({ path: path.join(SHOTS, "p5-mobile-full.png"), fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
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
    const result = lab.locator('[data-result-kind="comparison"]');
    await page.waitForFunction((el) => el?.getAttribute("data-freshness") === "filters_changed", await result.elementHandle());
    await lab.getByText("Previous comparison — not computed with the current filters").waitFor();
    await lab.getByRole("heading", { name: /^Previous A\/B result/ }).waitFor();
    check(await lab.getByText("A · current filters").count() === 0, "A is no longer named 'current filters'");
    await shot(page, "3-stale");
    await host.restoreFilters(page);
    await page.waitForFunction((el) => el?.getAttribute("data-freshness") === "current", await result.elementHandle());
    check(true, "restoring the same filters makes the comparison current again");
  });

  await step("metric changes invalidate A/B and recompute with the selected metric", async () => {
    const metric = page.getByRole("combobox", { name: "Metric", exact: true });
    await metric.selectOption("heat_release_w");
    await freshness(comparisonResult(), "metric_changed");
    const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/scenarios/compare"));
    await lab.getByRole("button", { name: /^Compare A vs B/ }).click();
    const body = await (await response).json();
    check(body.metric === "heat_release_w", "the recomputed A/B uses heat_release_w");
    check(body.ranking_a.items.length === 0 && body.ranking_b.items.length === 0, "missing metric is not replaced by flame-spread measurements");
    await freshness(comparisonResult(), "current");
    await metric.selectOption("flame_spread_rate_mm_s");
    await freshness(comparisonResult(), "metric_changed");
    const restored = page.waitForResponse((r) => r.url().endsWith("/api/v1/scenarios/compare"));
    await lab.getByRole("button", { name: /^Compare A vs B/ }).click();
    await restored;
    await freshness(comparisonResult(), "current");
  });

  await step("query without sufficient evidence", async () => {
    const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/research") && r.request().method() === "POST");
    await lab.getByRole("button", { name: "Run lunar evidence query" }).click();
    const body = await (await response).json();
    check(body.status === "insufficient_evidence", `status insufficient_evidence (got ${body.status})`);
    check(body.ranking.items.length === 0, "no eligible candidates");
    await lab.getByText("Insufficient evidence.", { exact: true }).waitFor();
    await lab.getByRole("heading", { name: /What is missing/ }).waitFor();
  });

  await step("question changes mark the prior query without invalidating numerical A/B", async () => {
    const question = page.getByRole("textbox", { name: /^Question/ });
    const original = await question.inputValue();
    await question.fill("A revised research description for the same explicit filters.");
    await freshness(queryResult(), "question_changed");
    await freshness(comparisonResult(), "current");
    await question.fill(original);
    await freshness(queryResult(), "current");
    check(true, "query freshness tracks question text independently of A/B");
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

  await step("saved events are an exact replay", async () => {
    await report.getByRole("button", { name: "Replay saved events", exact: true }).click();
    const events = report.locator(".rp-pre-events");
    await events.waitFor();
    const server = await (await fetch(`${API}/api/v1/research/${encodeURIComponent(researchId)}/events`)).text();
    check(await events.textContent() === server, "saved events match the API replay");
    await report.getByText("Replay · not live", { exact: true }).waitFor();
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

  await step("Reset cancels a pending recovery and A/B result", async () => {
    const pendingRecovery = await holdNext(`/api/v1/research/${researchId}`);
    await report.getByLabel("Research id", { exact: true }).fill(researchId);
    await report.getByRole("button", { name: "Recover", exact: true }).click();
    await pendingRecovery.seen;
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await report.getByText(/No active research\./).waitFor();
    pendingRecovery.release(); await pendingRecovery.done; await settle();
    check(await report.getByText(/No active research\./).isVisible(), "late recovery cannot reopen a record after Reset");
    check(await page.locator(".run-id").count() === 0, "Reset leaves no active host research");

    const pendingComparison = await holdNext("/api/v1/scenarios/compare", "POST");
    await lab.getByRole("button", { name: /^Compare A vs B/ }).click();
    await pendingComparison.seen;
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    pendingComparison.release(); await pendingComparison.done; await settle();
    check(await comparisonResult().count() === 0, "late A/B response cannot repopulate reset panels");
  });

  await step("a new investigation wins over an earlier pending recovery", async () => {
    const pendingRecovery = await holdNext(`/api/v1/research/${researchId}`);
    await report.getByLabel("Research id", { exact: true }).fill(researchId);
    await report.getByRole("button", { name: "Recover", exact: true }).click();
    await pendingRecovery.seen;
    await page.getByRole("textbox", { name: /^Question/ }).fill("New investigation after a pending recovery.");
    const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/research") && r.request().method() === "POST");
    await host.investigate(page);
    const body = await (await response).json();
    check(body.id !== researchId, "the later investigation has its own record");
    researchId = body.id;
    const pre = report.locator(`pre[data-research-id="${researchId}"]`).first();
    await pre.waitFor();
    pendingRecovery.release(); await pendingRecovery.done; await settle();
    check(await pre.isVisible(), "late recovery does not replace the newer research report");
    check((await page.locator(".run-id").textContent())?.includes(researchId), "the host retains the latest investigation");
    reportText = await pre.textContent() ?? "";
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

  await step("BASS-II presets cannot claim the approved source result on synthetic fixtures", async () => {
    const bass = lab.getByRole("region", { name: "BASS-II · approved source cases", exact: true });
    for (const [key, name] of [["bass_6", "Run BASS-II · 6 cm/s"], ["lunar", "Run BASS-II · lunar"]]) {
      const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/research") && r.request().method() === "POST");
      await bass.getByRole("button", { name, exact: true }).click();
      const body = await (await response).json();
      check(body.status === "insufficient_evidence" && body.ranking.items.length === 0, `${key}: the actual fixture-only corpus has no BASS-II selection`);
      const result = bass.locator(`[data-bass-case="${key}"]`);
      await result.waitFor();
      check(await result.getAttribute("data-approved-match") === "false", `${key}: no claim that the reviewed source package was reproduced`);
      check(await result.locator("[data-approved-copy]").count() === 0, `${key}: approved narrative is withheld on the wrong corpus`);
    }
    const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/scenarios/compare") && r.request().method() === "POST");
    await bass.getByRole("button", { name: "Compare BASS-II · 6 → 5 cm/s", exact: true }).click();
    await response;
    const comparison = bass.locator("[data-bass-comparison]");
    await comparison.waitFor();
    check(await comparison.getAttribute("data-approved-match") === "false" && await comparison.locator("[data-approved-copy]").count() === 0, "wrong-corpus A/B does not invent the four/six/seven-sample result");
  });

  await step("Reset cancels a pending approved-case request", async () => {
    const bass = lab.getByRole("region", { name: "BASS-II · approved source cases", exact: true });
    const pending = await holdNext("/api/v1/research", "POST");
    await bass.getByRole("button", { name: "Run BASS-II · 6 cm/s", exact: true }).click();
    await pending.seen;
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    pending.release(); await pending.done; await settle();
    check(await bass.locator("[data-bass-case], [data-bass-comparison]").count() === 0, "late source-case response cannot repopulate reset panels");
    check(await page.locator(".run-id").count() === 0 && await report.getByText(/No active research\./).isVisible(), "late source-case response cannot reopen the workspace research");
  });

  await step("no uncaught page errors", async () => {
    check(pageErrors.length === 0, `uncaught page errors: ${pageErrors.join(" | ") || "none"}`);
  });
} catch (error) {
  exitCode = 1;
  if (!results.some((r) => !r.ok)) results.push({ step: current, ok: false, message: String(error?.stack ?? error) });
} finally {
  try { await cleanup(); }
  catch (error) { exitCode = 1; results.push({ step: "cleanup", ok: false, message: String(error) }); }
}

const failed = results.filter((r) => !r.ok);
console.log("\n--- P6 walkthrough summary ---");
console.log(`host=${HOST} api=${API} web=${WEB} root=${ROOT}`);
console.log(`checks passed: ${results.filter((r) => r.ok).length} · failed: ${failed.length}`);
for (const failure of failed) console.log(`  [${failure.step}] ${failure.message}`);
console.log("Data: synthetic fixtures (not NASA measurements); AI: deterministic demo coordinator.");
process.exit(exitCode || failed.length ? 1 : 0);
