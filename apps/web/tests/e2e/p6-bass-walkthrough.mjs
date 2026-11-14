#!/usr/bin/env node
// Optional real-source walkthrough. Never downloads, republishes or mutates the source bundle.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRuntime } from "./runtime.mjs";
import { askSI, chooseOption, openView, verifyCampaignResearch, verifyP2Catalog, verifySaffireContext } from "./p2-catalog-acceptance.mjs";

const EXPECTED_SHA256 = "cb8b782fd73dbe4df0576b8047f3dea781a37d7c06c962ad2e978e607a00191d";
const DATASET = "psi:nasa-local-corpus-v1";
const allowed = new Set(["bundle", "screenshots", "root", "headed", "timeout"]);
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const match = /^--([^=]+)(?:=(.*))?$/.exec(arg);
  if (!match || !allowed.has(match[1])) throw new Error(`Unknown argument: ${arg}`);
  return [match[1], match[2] ?? "true"];
}));
const ROOT = path.resolve(args.root ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../.."));
const bundleArgument = args.bundle ?? process.env.FLAMELAB_P2_DEMO_BUNDLE;
if (!bundleArgument || bundleArgument === "true") {
  console.error("Opt-in required: --bundle=<P2 1.1.1 bundle.json> or FLAMELAB_P2_DEMO_BUNDLE. No real source files are distributed with this test.");
  process.exit(2);
}
const BUNDLE = path.resolve(bundleArgument);
const TIMEOUT = Number(args.timeout ?? 30000);
if (!Number.isFinite(TIMEOUT) || TIMEOUT < 100 || TIMEOUT > 120000) {
  console.error("Invalid --timeout (100..120000 milliseconds)."); process.exit(2);
}
const SHOTS = args.screenshots ? path.resolve(args.screenshots) : null;
const cases = JSON.parse(readFileSync(path.join(ROOT, "data/catalog/p2-demo-cases-v1.1.0.json"), "utf8"));
const copy = JSON.parse(readFileSync(path.join(ROOT, "data/catalog/p2-demo-copy-v1.1.1.json"), "utf8"));
// Independent, reviewed expectations transcribed from docs/handoffs/P3_BASS_II_DECISION_DEMO.md.
const expected = {
  bass_6: [["M7", 2, "177m", 6, 0.099], ["M8", 2, "178m", 6, 0.056], ["M13", 1, "169m", 6, 0.047], ["M19", 2, "170m", 6, 0.0159]],
  bass_5: [["M4", 1, "171m", 5, 0.045], ["M7", 3, "177m", 5, 0.083], ["M8", 3, "178m", 5, 0.04], ["M13", 2, "169m", 5, 0.035], ["M16", 1, "164m", 5, 0.144], ["M17", 1, "166m", 5, 0.053]],
};
const ids = (entry) => {
  const [sample, sequence, unit] = entry;
  const trial = `psi:PSI-25:${sample}`;
  const segment = `${trial}:stage:${sequence}`;
  return { trial, segment, observation: `${segment}:spread`, evidence: `${segment}:table51`, unit: `psi:PSI-25:sample:${unit}` };
};
let bundle;
try {
  const bytes = readFileSync(BUNDLE);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), EXPECTED_SHA256, "Expected the reviewed P2 demo 1.1.1 artifact SHA-256.");
  bundle = JSON.parse(bytes.toString("utf8"));
  assert.equal(bundle.dataset_id, DATASET);
  assert.equal(bundle.schema_version, "1.1");
  assert.equal(bundle.studies.length, 24);
  for (const group of [bundle.trials, bundle.observations, bundle.evidence]) {
    assert(group.every((item) => item.provenance !== "synthetic"), "Real-source input must not contain synthetic items.");
  }
  const trials = new Map(bundle.trials.map((item) => [item.id, item]));
  const observations = new Map(bundle.observations.map((item) => [item.id, item]));
  const evidence = new Map(bundle.evidence.map((item) => [item.id, item]));
  for (const entry of [...expected.bass_6, ...expected.bass_5]) {
    const identity = ids(entry);
    const trial = trials.get(identity.trial);
    const observation = observations.get(identity.observation);
    const segment = trial?.segments.find((item) => item.id === identity.segment);
    assert.equal(trial?.independent_unit_id, identity.unit);
    assert.equal(trial?.independent_unit_status, "identified");
    assert.equal(segment?.conditions.flow_velocity_cm_s.value, entry[3]);
    assert.equal(segment?.conditions.oxygen_pct.value, null);
    assert.equal(segment?.conditions.oxygen_pct.status, "not_measured");
    assert.equal(observation?.trial_id, identity.trial);
    assert.equal(observation?.segment_id, identity.segment);
    assert.equal(observation?.value, entry[4]);
    assert.equal(observation?.unit, "mm/s");
    assert.equal(observation?.status, "known");
    assert(observation?.evidence_ids.includes(identity.evidence));
    if (entry[0] === "M8") {
      assert(evidence.get(identity.evidence)?.text.includes(copy.m8_notice), "Both M8 sources must include the approved discrepancy notice.");
      assert.equal(evidence.get(identity.evidence)?.reviewed, false);
    }
  }
  assert.equal(new Set([...expected.bass_6, ...expected.bass_5].map((entry) => ids(entry).unit)).size, 7);
  assert.deepEqual(cases.lunar.ranking.target, { gravity_regime: "lunar" });
  assert.deepEqual(cases.lunar.ranking.required_match, ["gravity_regime"]);
} catch (error) {
  console.error(`P2 input preflight failed: ${error instanceof assert.AssertionError ? error.message : "Cannot read the required reviewed bundle."}`);
  process.exit(2);
}
console.log(`P2 input preflight passed: dataset=${DATASET}, SHA-256=${EXPECTED_SHA256}, ten reviewed observations, seven identified units, M8 notices retained.`);

const runtime = await createRuntime(ROOT, { fixturePath: BUNDLE });
const { apiUrl: API, webUrl: WEB, startApi, stop, waitHttp } = runtime;
const results = [];
let api, browser, closing, exitCode = 0, current = "setup";
const cleanup = () => closing ??= (async () => { await browser?.close().catch(() => {}); await runtime.close(); })();
let fatal = false;
const fatalError = (error) => {
  if (fatal) return;
  fatal = true;
  console.error(`Fatal BASS-II E2E error: ${error?.stack ?? error}`);
  void cleanup().catch((cleanupError) => console.error(String(cleanupError))).finally(() => process.exit(1));
};
process.once("unhandledRejection", fatalError);
process.once("uncaughtException", fatalError);
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => { void cleanup().finally(() => process.exit(130)); });
function check(value, message) { if (!value) throw new Error(message); results.push({ step: current, ok: true, message }); }
async function step(name, action) {
  current = name;
  try { await action(); console.log(`PASS  ${name}`); }
  catch (error) { results.push({ step: name, ok: false, message: String(error?.message ?? error) }); throw error; }
}
const sorted = (items) => [...items].sort();
function verifyRun(key, run) {
  const rows = expected[key];
  check(run.provider === "demo" && run.ranking.dataset_id === DATASET, `${key}: deterministic coordinator on the expected real corpus`);
  check(run.status === "completed" && run.hypotheses.length === 0, `${key}: completed with no generated hypothesis`);
  assert.deepEqual(sorted(run.ranking.items.map((item) => item.trial_id)), sorted(rows.map((entry) => ids(entry).trial)));
  check(run.comparison.metric === "flame_spread_rate_mm_s" && run.comparison.unit === "mm/s" && run.comparison.x_unit === "cm/s", `${key}: canonical metric and axis units`);
  const points = run.comparison.points;
  check(points.length === rows.length, `${key}: exact observation count ${rows.length}`);
  const byId = new Map(points.map((point) => [point.observation_id, point]));
  for (const entry of rows) {
    const identity = ids(entry);
    const point = byId.get(identity.observation);
    assert(point, `Missing reviewed observation ${identity.observation}`);
    assert.equal(point.trial_id, identity.trial);
    assert.equal(point.segment_id, identity.segment);
    assert.equal(point.independent_unit_id, identity.unit);
    assert.equal(point.independent_unit_status, "identified");
    assert.equal(point.x, entry[3]); assert.equal(point.y, entry[4]);
    assert.equal(point.original_unit, "mm/s");
    assert(point.evidence_ids.includes(identity.evidence));
    assert.equal(point.provenance, "published");
  }
  check(run.ranking.items.every((item) => item.provenance !== "synthetic") && points.every((point) => point.trial_id.startsWith("psi:PSI-25:")), `${key}: only published BASS-II observations with preserved identity`);
  return points;
}

try {
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  api = startApi();
  const web = runtime.startWeb();
  await waitHttp(`${API}/api/v1/health`, api);
  await waitHttp(WEB, web);
  browser = await runtime.chromium.launch({ headless: args.headed !== "true" });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const bass = page.getByRole("region", { name: "BASS-II · approved source cases", exact: true });
  const report = page.getByRole("region", { name: "Report and recovery", exact: true });
  const runs = {};
  let firstReport = "";
  const isPost = (response, suffix) => response.url().endsWith(suffix) && response.request().method() === "POST";
  async function runPreset(key, label) {
    await openView(page, "lab");
    const responsePromise = page.waitForResponse((response) => isPost(response, "/api/v1/research"));
    await bass.getByRole("button", { name: label, exact: true }).click();
    const response = await responsePromise;
    assert.deepEqual(response.request().postDataJSON(), cases[key], `${key} must send the exact approved request`);
    check(response.ok(), `${key}: real research endpoint succeeded`);
    const run = await response.json();
    await bass.locator(`[data-bass-case="${key}"][data-research-id="${run.id}"]`).waitFor();
    runs[key] = run;
    return run;
  }
  async function openM8(key, sequence) {
    const run = runs[key];
    const evidenceId = `psi:PSI-25:M8:stage:${sequence}:table51`;
    const responsePromise = page.waitForResponse((response) => decodeURIComponent(new URL(response.url()).pathname).endsWith(`/evidence/${evidenceId}`));
    await bass.getByRole("button", { name: new RegExp(`^Open evidence ${evidenceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).first().click();
    const response = await responsePromise;
    const source = await response.json();
    check(new URL(response.url()).searchParams.get("research_id") === run.id, `${key}: M8 source uses the saved research snapshot`);
    await page.locator("#evidence .ev-text").filter({ hasText: copy.m8_notice }).waitFor();
    check(await page.locator("#evidence .ev-text").textContent() === source.text, `${key}: M8 source and discrepancy notice are literal`);
    check(source.reviewed === false && source.provenance === "published", `${key}: source remains published and unreviewed`);
  }

  await step("real corpus status and approved-case panel", async () => {
    const health = await (await fetch(`${API}/api/v1/health`)).json();
    const profile = await (await fetch(`${API}/api/v1/datasets/profile`)).json();
    check(health.data_mode === "scientific_unverified" && health.ai_provider === "demo", "real corpus remains scientific_unverified in deterministic mode");
    check(profile.dataset_id === DATASET && profile.n_studies === 24 && profile.synthetic_trials === 0, "24-study corpus contains no synthetic trials");
    await page.goto(`${WEB}/#/dashboard/investigate`);
    await page.getByRole("heading", { name: "Mission Brief", exact: true }).waitFor();
    await openView(page, "report");
    await report.waitFor();
    await openView(page, "lab");
    await bass.waitFor();
  });

  await verifyP2Catalog({ page, apiUrl: API, bundle, check, step, screenshots: SHOTS });
  await step("Ask SI opens the requested published-study comparison", async () => {
    const answer = await askSI(page, "Plot BASS-II and FLEX");
    assert.deepEqual(answer.comparison_studies, ["psi:PSI-25", "psi:PSI-69"]);
    const charts = answer.comparison_studies.map((id) => page.waitForResponse((response) =>
      decodeURIComponent(new URL(response.url()).pathname) === `/api/v1/studies/${id}/chart`));
    await page.getByRole("button", { name: "Open study comparison", exact: true }).click();
    await page.waitForURL(/#\/dashboard\/lab\?study=/);
    await page.getByRole("heading", { name: "Study comparison", exact: true }).waitFor();
    const data = await Promise.all(charts.map(async (pending) => (await pending).json()));
    check(data.every((item, index) => item.study.id === answer.comparison_studies[index] && item.metrics.length > 0),
      "the selected studies load their documented measurements inside Mission Lab");
  });
  await step("documentary Saffire context stays separate from imported BASS points", async () => {
    await verifySaffireContext({ page, check, screenshots: SHOTS });
  });
  await verifyCampaignResearch({ page, apiUrl: API, bundle, check, step, screenshots: SHOTS });

  await step("approved 6 cm/s preset preserves four source observations", async () => {
    // Fixed, disclosed presets must not inherit unrelated current-form edits.
    await openView(page, "investigate");
    await chooseOption(page, page.getByRole("combobox", { name: "Metric", exact: true }), "Heat release");
    await page.getByRole("spinbutton", { name: /Max\. trials/ }).fill("1");
    const run = await runPreset("bass_6", "Run BASS-II · 6 cm/s");
    verifyRun("bass_6", run);
    await openM8("bass_6", 2);
    await openView(page, "report");
    const pre = report.locator(`pre[data-research-id="${run.id}"]`).first();
    await pre.waitFor();
    firstReport = await pre.textContent();
    const server = await (await fetch(`${API}/api/v1/research/${encodeURIComponent(run.id)}/report`)).text();
    check(firstReport === server && server.includes(copy.m8_notice), "6 cm/s report preserves the server text and M8 discrepancy notice");
    const downloadPromise = page.waitForEvent("download");
    await report.getByRole("button", { name: "Download report (.md)", exact: true }).click();
    const download = await downloadPromise;
    const destination = path.join(runtime.directory, "bass-report.md");
    await download.saveAs(destination);
    check(readFileSync(destination, "utf8") === server, "downloaded BASS-II report exactly matches the API");
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "bass-6-m8.png") });
  });

  await step("approved 5 cm/s preset preserves six source observations", async () => {
    verifyRun("bass_5", await runPreset("bass_5", "Run BASS-II · 5 cm/s"));
    await openM8("bass_5", 3);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "bass-5-m8.png") });
  });

  await step("A/B preserves ten observations from seven samples and the approved limitations", async () => {
    const responses = ["bass_6", "bass_5"].map((key) => page.waitForResponse((response) => isPost(response, "/api/v1/research") && response.request().postDataJSON()?.question === cases[key].question));
    const scenarioResponse = page.waitForResponse((response) => isPost(response, "/api/v1/scenarios/compare"));
    await bass.getByRole("button", { name: "Compare BASS-II · 6 → 5 cm/s", exact: true }).click();
    const [responseA, responseB, responseAB] = await Promise.all([...responses, scenarioResponse]);
    assert.deepEqual(responseA.request().postDataJSON(), cases.bass_6);
    assert.deepEqual(responseB.request().postDataJSON(), cases.bass_5);
    const pointsA = verifyRun("bass_6", await responseA.json());
    const pointsB = verifyRun("bass_5", await responseB.json());
    const payload = responseAB.request().postDataJSON();
    assert.deepEqual(payload.scenario_a, cases.bass_6.ranking);
    assert.deepEqual(payload.scenario_b, cases.bass_5.ranking);
    assert.equal(payload.metric, "flame_spread_rate_mm_s");
    const result = await responseAB.json();
    const a = new Set(result.ranking_a.items.map((item) => item.trial_id));
    const b = new Set(result.ranking_b.items.map((item) => item.trial_id));
    assert.deepEqual(sorted([...b].filter((id) => !a.has(id))), ["psi:PSI-25:M16", "psi:PSI-25:M17", "psi:PSI-25:M4"]);
    assert.deepEqual([...a].filter((id) => !b.has(id)), ["psi:PSI-25:M19"]);
    assert.deepEqual(sorted([...a].filter((id) => b.has(id))), ["psi:PSI-25:M13", "psi:PSI-25:M7", "psi:PSI-25:M8"]);
    const points = [...pointsA, ...pointsB];
    check(points.length === 10 && new Set(points.map((point) => point.independent_unit_id)).size === 7, "ten records correspond to seven identified physical samples, not ten replicas");
    const comparison = bass.locator("[data-bass-comparison]");
    await comparison.waitFor();
    await comparison.getByText(copy.bass_comparison, { exact: true }).waitFor();
    check(true, "the approved descriptive limitation is displayed verbatim");
    await comparison.scrollIntoViewIfNeeded();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "BASS-II desktop has no page horizontal overflow");
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "bass-comparison-desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await comparison.scrollIntoViewIfNeeded();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "BASS-II mobile 390px has no page horizontal overflow");
    if (SHOTS) {
      await page.screenshot({ path: path.join(SHOTS, "bass-comparison-mobile-390.png") });
      await bass.screenshot({ path: path.join(SHOTS, "bass-panel-mobile-full.png") });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  });

  await step("lunar preset removes the flow restriction and states only the approved absence", async () => {
    const run = await runPreset("lunar", "Run BASS-II · lunar");
    check(run.status === "insufficient_evidence" && run.ranking.items.length === 0 && run.comparison === null, "no BASS-II flame-spread observation is retrieved under lunar gravity");
    check(run.claims.length === 0 && run.hypotheses.length === 0, "no unsupported claims or hypotheses fill the absence");
    await bass.locator('[data-bass-case="lunar"]').getByText(copy.lunar_insufficient, { exact: true }).waitFor();
    check(true, "the lunar statement stays within the imported BASS-II corpus");
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "bass-lunar.png") });
  });

  await step("saved BASS-II report and M8 notice survive API restart and browser reload", async () => {
    await openView(page, "report");
    const run = runs.bass_6;
    await report.getByLabel("Research id", { exact: true }).fill(run.id);
    await report.getByRole("button", { name: "Recover", exact: true }).click();
    const pre = report.locator(`pre[data-research-id="${run.id}"]`).first();
    await pre.waitFor();
    check(await pre.textContent() === firstReport, "original BASS-II report is recovered before restart");
    await stop(api); api = startApi();
    await waitHttp(`${API}/api/v1/health`, api);
    await page.reload();
    await openView(page, "report");
    await report.getByText(/No active research\./).waitFor();
    await report.getByRole("button", { name: "Reopen last research", exact: true }).click();
    await pre.waitFor();
    check(await pre.textContent() === firstReport && firstReport.includes(copy.m8_notice), "reopened historical report and M8 notice remain byte-for-byte equal");
    check((await (await fetch(`${API}/api/v1/health`)).json()).data_mode === "scientific_unverified", "restart retains the real corpus without synthetic reseeding");
  });
  await step("no uncaught browser errors", async () => { check(pageErrors.length === 0, pageErrors.join(" | ") || "no page errors"); });
} catch (error) {
  exitCode = 1;
  if (!results.some((result) => !result.ok)) results.push({ step: current, ok: false, message: String(error?.stack ?? error) });
} finally {
  try { await cleanup(); }
  catch (error) { exitCode = 1; results.push({ step: "cleanup", ok: false, message: String(error) }); }
}
console.log("\n--- P6 BASS-II opt-in walkthrough ---");
console.log(`checks passed: ${results.filter((result) => result.ok).length} · failed: ${results.filter((result) => !result.ok).length}`);
for (const result of results.filter((result) => !result.ok)) console.log(`[${result.step}] ${result.message}`);
console.log("Published source data remain scientific_unverified. This checks software, identity and provenance; it is not scientific validation of the whole NASA corpus. No external AI calls.");
process.exit(exitCode || results.some((result) => !result.ok) ? 1 : 0);
