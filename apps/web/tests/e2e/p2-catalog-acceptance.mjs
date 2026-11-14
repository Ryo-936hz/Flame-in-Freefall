import assert from "node:assert/strict";
import path from "node:path";

// Fixed coverage claims from docs/P2_NASA_24.md; source content comes only from
// the explicit, SHA-checked private input and the live API, never a mocked corpus.
const representatives = [
  ["psi:PSI-69", 265, 530, ["flex_burn_duration_s", "flex_visible_flame_extinction_diameter_mm"]],
  ["psi:PSI-102", 4, 4, ["same_reported_mass_loss_rate_mg_min"]],
  ["psi:PSI-101", 107, 428, ["samer_run_duration_s", "samer_primary_aging_time_s", "samer_primary_mixing_time_s", "samer_net_aging_time_s"]],
  ["psi:PSI-159", 333, 666, ["cfig_reported_run_duration_s", "peak_burner_temperature_k"]],
  ["psi:PSI-98", 2, 2, ["saffire_reported_burn_duration_s"]],
  ["psi:PSI-10", 327, 0, []],
  ["psi:PSI-47", 0, 0, []],
  ["psi:PSI-99", 0, 0, []],
  ["psi:PSI-100", 0, 0, []],
];
const sorted = (items) => [...items].sort();

export async function openSection(page, id) {
  const parent = { brief: "canvas", ranking: "canvas", synthesis: "canvas", "compare-studies": "lab", evidence: "catalog", saffire: "catalog" }[id];
  const link = page.locator(`.dashboard-subnav a[href="#${id}"], .dashboard-nav a[href="#${id}"]`).first();
  if (parent && !await link.isVisible()) await page.locator(`.dashboard-nav a[href="#${parent}"]`).click();
  await link.click();
  await page.waitForURL(`**/#${id}`);
}

export async function verifySaffireContext({ page, check, screenshots }) {
  await openSection(page, "saffire");
  const card = page.getByRole("region", { name: "Saffire documentary context", exact: true });
  await card.waitFor();
  check(await card.getAttribute("data-saffire-context") !== null, "Saffire is a separate documentary context node");
  await card.getByText(/Su presencia no confirma que el corpus NASA esté importado/).waitFor();
  check(true, "documentary Saffire presence does not claim that source data are imported");
  check(await card.getByRole("button").count() === 0, "documentary Saffire context has no research or comparison action");
  const links = await card.getByRole("link").evaluateAll((items) => items.map((item) => ({ href: item.href, rel: item.rel })));
  check(links.length >= 2 && links.every(({ href, rel }) => {
    const url = new URL(href);
    return url.protocol === "https:" && ["ntrs.nasa.gov", "doi.org", "psi.nasa.gov"].includes(url.hostname) && rel.includes("noreferrer");
  }), "Saffire citations use attributed official HTTPS sources");
  check(await card.locator("canvas, svg, [data-bass-case], [data-bass-comparison]").count() === 0, "documentary context does not render numerical BASS points or a simulation");
  if (screenshots) await card.screenshot({ path: path.join(screenshots, "saffire-context-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Saffire context has no page horizontal overflow at 390px");
  if (screenshots) await card.screenshot({ path: path.join(screenshots, "saffire-context-mobile.png") });
  await page.setViewportSize({ width: 1440, height: 1000 });
}

export async function verifyCampaignResearch({ page, apiUrl, bundle, check, step, screenshots }) {
  const campaigns = [
    ["psi:PSI-69", "flex_burn_duration_s", "s", "methanol"],
    ["psi:PSI-102", "same_reported_mass_loss_rate_mg_min", "mg/min", "teflon"],
    ["psi:PSI-101", "samer_run_duration_s", "s", "kapton"],
    ["psi:PSI-159", "peak_burner_temperature_k", "K", "ethane"],
    ["psi:PSI-98", "saffire_reported_burn_duration_s", "s", "sibal fabric"],
  ];
  const report = page.getByRole("region", { name: "Report and recovery", exact: true });
  const observations = new Map(bundle.observations.map((item) => [item.id, item]));
  const trials = new Map(bundle.trials.map((item) => [item.id, item]));
  await step("chart metric changes use their own campaign instead of the gravity filters", async () => {
    await openSection(page, "canvas");
    for (const [studyId, metric] of campaigns) {
      const metricSelect = page.getByRole("combobox", { name: "Chart metric", exact: true });
      await metricSelect.selectOption(metric);
      const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/research" && response.request().method() === "POST");
      await page.getByRole("button", { name: "Update chart", exact: true }).click();
      const response = await responsePromise;
      const request = response.request().postDataJSON();
      assert.deepEqual(request.ranking.study_ids, [studyId]);
      assert.equal(request.ranking.target.gravity_regime, undefined);
      const run = await response.json();
      check(response.ok() && run.status === "completed" && run.comparison.points.length > 0, `${metric}: displays recorded measurements`);
      await page.locator(".canvas .chart .pt-dot").first().waitFor();
    }
    await openSection(page, "brief");
    await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  });
  await step("an empty target remains insufficient even at zero minimum coverage", async () => {
    await openSection(page, "brief");
    await page.locator("#role-gravity_regime").selectOption("off");
    await page.locator("#role-flow_velocity_cm_s").selectOption("off");
    await page.getByRole("slider", { name: "Minimum coverage", exact: true }).press("Home");
    await page.getByRole("combobox", { name: "Metric", exact: true }).selectOption("flex_burn_duration_s");
    const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/research" && response.request().method() === "POST");
    await page.getByRole("button", { name: "Investigate", exact: true }).click();
    const response = await responsePromise;
    assert(response.ok());
    assert.deepEqual(response.request().postDataJSON().ranking.target, {});
    const run = await response.json();
    check(run.status === "insufficient_evidence" && run.ranking.items.length === 0 && run.comparison === null, "no target does not create an ungrounded ranking");
    check(run.ranking.excluded.some((item) => item.reasons.includes("no_active_target_weights")), "the saved result states the missing active target explicitly");
    const filters = page.getByRole("combobox", { name: "Chart filters", exact: true });
    await filters.waitFor();
    check(await filters.inputValue() === "current", "the selector reflects the custom filters actually used");
  });
  for (const [studyId, metric, unit, material] of campaigns) {
    await step(`P2 ${studyId} metric travels through investigation, values and saved report`, async () => {
      await openSection(page, "brief");
      await page.locator("#role-gravity_regime").selectOption("off");
      await page.locator("#role-flow_velocity_cm_s").selectOption("off");
      await page.getByRole("checkbox", { name: /Include synthetic demo data/ }).uncheck();
      // One source-reported control activates ranking; no gravity is inferred from the campaign name.
      await page.locator("#role-material").selectOption("similar");
      await page.getByLabel("Value for Material", { exact: true }).fill(material);
      await page.getByRole("slider", { name: "Minimum coverage", exact: true }).press("Home");
      await page.getByRole("combobox", { name: "Metric", exact: true }).selectOption(metric);
      await page.getByRole("textbox", { name: /^Question/ }).fill(`Browse reported ${metric} from ${studyId}, with material similarity to ${material}; preserve campaign boundaries.`);
      const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/research" && response.request().method() === "POST");
      await page.getByRole("button", { name: "Investigate", exact: true }).click();
      const response = await responsePromise;
      assert(response.ok());
      const payload = response.request().postDataJSON();
      assert.equal(payload.metric, metric);
      assert.equal(payload.ranking.allow_synthetic, false);
      assert.deepEqual(payload.ranking.required_match, []);
      assert.deepEqual(payload.ranking.target, { material });
      assert.equal(payload.ranking.minimum_coverage, 0);
      const run = await response.json();
      assert.equal(run.provider, "demo");
      assert(run.ranking.items.length > 0 && run.comparison?.points.length > 0, `${metric} must return its own known observations`);
      assert.equal(run.comparison.metric, metric); assert.equal(run.comparison.unit, unit);
      assert(run.ranking.items.every((item) => trials.get(item.trial_id)?.study_id === studyId));
      for (const point of run.comparison.points) {
        const observation = observations.get(point.observation_id);
        assert.equal(trials.get(point.trial_id)?.study_id, studyId);
        assert.equal(observation?.metric, metric); assert.equal(observation?.unit, unit);
        assert.equal(point.y, observation?.value); assert.equal(point.trial_id, observation?.trial_id);
        assert.equal(point.provenance, observation?.provenance);
      }
      check(true, `${metric}: eligible trials and values stay within ${studyId}, with ${unit} units`);
      if (run.comparison.points.every((point) => point.x == null)) {
        const chart = page.getByRole("group", { name: /Scatter chart: .* vs Observation order/ });
        await chart.waitFor();
        check(await chart.getByRole("button").count() === run.comparison.points.length,
          `${metric}: the chart shows measured values with observation order and no fabricated X values`);
      }
      await page.getByRole("group", { name: "Comparison view", exact: true }).getByRole("button", { name: "Table", exact: true }).click();
      const table = page.getByRole("table", { name: "Observations plotted in the chart", exact: true });
      await table.getByRole("columnheader", { name: `Y (${unit})`, exact: true }).waitFor();
      const rows = await table.locator("tbody tr").evaluateAll((items) => items.map((row) => Array.from(row.cells, (cell) => cell.textContent)));
      assert.equal(rows.length, run.comparison.points.length);
      rows.forEach((row, index) => {
        const point = run.comparison.points[index];
        assert(row[0].includes(point.trial_id));
        assert(Math.abs(Number(row[2]) - point.y) <= 0.00051, "UI rounding must preserve the API value to three decimal places");
        assert.equal(row[3], point.independent_unit_id);
      });
      check(true, `${metric}: every visible table value, physical unit ID and Y unit matches the API`);
      if (screenshots) await table.screenshot({ path: path.join(screenshots, `p2-${studyId.replace(":", "-")}-metric.png`) });
      await openSection(page, "lab");
      const pre = report.locator(`pre[data-research-id="${run.id}"]`).first();
      await pre.waitFor();
      const reportResponse = await fetch(`${apiUrl}/api/v1/research/${encodeURIComponent(run.id)}/report`, { signal: AbortSignal.timeout(30000) });
      assert(reportResponse.ok);
      const server = await reportResponse.text();
      assert.equal(await pre.textContent(), server);
      assert(server.includes(metric) && server.includes(`(${unit})`));
      assert(run.ranking.items.every((item) => server.includes(item.trial_id)));
      check(true, `${metric}: persisted report is literal, retains campaign trial IDs and canonical units`);
    });
  }
  await openSection(page, "brief");
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
}

export async function verifyP2Catalog({ page, apiUrl, bundle, check, step, screenshots }) {
  const catalog = page.getByRole("region", { name: "Catálogo de estudios", exact: true });
  const selector = catalog.getByRole("combobox", { name: "Estudio", exact: true });
  const evidenceDetails = () => catalog.locator("details").filter({ has: page.locator("summary", { hasText: /^Fuentes y registros/ }) });
  const observationDetails = () => catalog.locator("details").filter({ has: page.locator("summary", { hasText: /^Observaciones normalizadas/ }) });
  const studyPath = (id, kind) => `/api/v1/studies/${id}/${kind}`;
  const pathname = (response) => decodeURIComponent(new URL(response.url()).pathname);
  const pageResponse = (id, kind, offset = 0) => page.waitForResponse((response) => pathname(response) === studyPath(id, kind) && new URL(response.url()).searchParams.get("offset") === String(offset));
  const apiGet = async (suffix) => {
    const response = await fetch(`${apiUrl}${suffix}`, { signal: AbortSignal.timeout(30000) });
    assert(response.ok, `Real API request failed: ${suffix} (${response.status})`);
    return response.json();
  };
  const expectedTrials = (id) => bundle.trials.filter((item) => item.study_id === id);
  const expectedEvidence = (id) => bundle.evidence.filter((item) => item.study_id === id);
  const expectedObservations = (id) => {
    const trialIds = new Set(expectedTrials(id).map((item) => item.id));
    return bundle.observations.filter((item) => trialIds.has(item.trial_id));
  };
  async function openCatalog() {
    await openSection(page, "catalog");
    const summary = page.locator(".p6-catalog > details > summary");
    if (await summary.evaluate((element) => !element.parentElement.open)) await summary.click();
    await catalog.waitFor();
  }
  async function verifyPages(id, evidence, observations, offset) {
    const wantedEvidence = expectedEvidence(id);
    const wantedObservations = expectedObservations(id);
    assert.equal(evidence.total, wantedEvidence.length);
    assert.equal(observations.total, wantedObservations.length);
    assert.equal(evidence.offset, offset); assert.equal(observations.offset, offset);
    assert.deepEqual(evidence.items, wantedEvidence.slice(offset, offset + 20));
    assert.deepEqual(observations.items, wantedObservations.slice(offset, offset + 20));
    await catalog.getByText(`Fuentes y registros (${evidence.total})`, { exact: true }).waitFor();
    await catalog.getByText(`Observaciones normalizadas (${observations.total})`, { exact: true }).waitFor();
    assert.deepEqual(await evidenceDetails().locator("li button").allTextContents(), evidence.items.map((item) => item.title));
    const observationsPanel = observationDetails();
    if (!(await observationsPanel.getAttribute("open"))) {
      if (!(await observationsPanel.evaluate((element) => element.open))) await observationsPanel.locator("summary").click();
    }
    for (const observation of observations.items) {
      const row = observationsPanel.locator(`[data-observation-id="${observation.id}"]`);
      await row.waitFor();
      const fields = await row.locator("dl").evaluate((element) => Object.fromEntries(Array.from(element.querySelectorAll("dt"), (term) => [term.textContent, term.nextElementSibling.textContent])));
      assert.equal(fields.Observación, observation.id);
      assert.equal(fields["Ensayo o registro"], observation.trial_id);
      assert.equal(fields.Segmento, observation.segment_id ?? "Sin segmento asignado");
      assert.equal(fields.Métrica, observation.metric);
      assert.equal(fields["Estado del valor"], observation.status ?? "known");
      assert.equal(fields["Valor original"], observation.original_value == null ? "No disponible" : JSON.stringify(observation.original_value));
      assert.equal(fields["Unidad original"], observation.original_unit == null ? "No disponible" : JSON.stringify(observation.original_unit));
      assert.equal(fields["Valor normalizado"].trim(), `${observation.value == null ? "Sin valor numérico" : observation.value} ${observation.unit}`.trim());
    }
    assert.equal(await observationsPanel.locator("li").count(), observations.items.length);
    check(true, `${id}: UI and real API preserve evidence and observation page ${offset}`);
  }
  async function selectStudy(id) {
    const pending = [pageResponse(id, "evidence"), pageResponse(id, "observations")];
    await selector.selectOption(id);
    const responses = await Promise.all(pending);
    assert(responses.every((response) => response.ok()));
    const [evidence, observations] = await Promise.all(responses.map((response) => response.json()));
    await verifyPages(id, evidence, observations, 0);
    return { evidence, observations };
  }
  async function withTransientFailure(endpoint, action) {
    let failed = false;
    let blocked = true;
    const matcher = (url) => decodeURIComponent(url.pathname) === endpoint;
    const handler = async (route) => {
      if (blocked && route.request().method() === "GET") {
        failed = true;
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ code: "service_unavailable", message: "Temporary E2E transport failure" }) });
      } else await route.fallback();
    };
    await page.route(matcher, handler);
    try { await action(() => { blocked = false; }); assert(failed, "Expected the deliberate transport failure to be exercised."); }
    finally { await page.unroute(matcher, handler); }
  }

  const network = [];
  const recordResponse = (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith("/api/v1/")) {
      network.push(`${response.status()} ${decodeURIComponent(url.pathname)}${url.search}`);
      if (network.length > 16) network.shift();
    }
  };
  page.on("response", recordResponse);
  let researchCalls = 0;
  const watchResearch = (request) => { if (request.method() === "POST" && new URL(request.url()).pathname === "/api/v1/research") researchCalls++; };
  page.on("request", watchResearch);
  try {
    await step("P2 catalog retries a transient failure and lists all 24 real studies", async () => {
      await withTransientFailure("/api/v1/studies", async (resume) => {
        await page.reload(); await openCatalog();
        await catalog.getByRole("button", { name: "Reintentar catálogo", exact: true }).waitFor();
        resume();
        await catalog.getByRole("button", { name: "Reintentar catálogo", exact: true }).click();
        await selector.locator('option[value="psi:PSI-159"]').waitFor({ state: "attached" });
      });
      const studies = await apiGet("/api/v1/studies");
      assert.equal(studies.length, 24);
      assert.deepEqual(sorted(studies.map((item) => item.id)), sorted(bundle.studies.map((item) => item.id)));
      const options = await selector.locator("option").evaluateAll((items) => items.filter((item) => item.value).map((item) => ({ id: item.value, title: item.textContent })));
      assert.deepEqual(options, studies.map((item) => ({ id: item.id, title: item.title })));
      check(true, "all 24 study IDs and titles are selectable after retry, with no synthetic substitution");
    });

    await step("P2 numerical, configuration and documentary representatives remain distinct", async () => {
      for (const [id, nTrials, nObservations, metrics] of representatives) {
        const { evidence, observations } = await selectStudy(id);
        const trials = await apiGet(`/api/v1/trials?study_id=${encodeURIComponent(id)}`);
        assert.equal(trials.length, nTrials); assert.equal(observations.total, nObservations);
        assert(trials.every((trial) => trial.study_id === id && trial.provenance !== "synthetic"));
        const metricsInSource = [...new Set(expectedObservations(id).map((item) => item.metric))];
        assert.deepEqual(sorted(metricsInSource), sorted(metrics));
        for (const metric of metrics) {
          const filtered = await apiGet(`${studyPath(id, "observations")}?offset=0&limit=200&metric=${metric}`);
          assert.equal(filtered.total, expectedObservations(id).filter((item) => item.metric === metric).length);
          assert(filtered.items.every((item) => item.metric === metric && trials.some((trial) => trial.id === item.trial_id)));
        }
        if (id.startsWith("psi:PSI-9") || id === "psi:PSI-100") {
          const spread = await apiGet(`${studyPath(id, "observations")}?metric=flame_spread_rate_mm_s`);
          assert.equal(spread.total, 0);
        }
        check(true, `${id}: ${nTrials} records, ${nObservations} observations and only campaign-specific metrics`);
        await evidenceDetails().locator("li button").first().click();
        await catalog.locator("article pre").waitFor();
        assert.equal(await catalog.locator("article pre").textContent(), evidence.items[0].text);
        check(true, `${id}: source content is literal and belongs to the selected study`);
      }
    });

    await step("P2 evidence and observation pagination retries without losing identity or sources", async () => {
      const id = "psi:PSI-25";
      await withTransientFailure(studyPath(id, "evidence"), async (resume) => {
        await selector.selectOption(id);
        await catalog.getByRole("button", { name: "Reintentar página", exact: true }).waitFor();
        assert.equal(await catalog.locator("article").count(), 0, "Switching study must clear its old source.");
        const pending = [pageResponse(id, "evidence"), pageResponse(id, "observations")];
        resume();
        await catalog.getByRole("button", { name: "Reintentar página", exact: true }).click();
        const [evidence, observations] = await Promise.all((await Promise.all(pending)).map((response) => response.json()));
        await verifyPages(id, evidence, observations, 0);
      });
      const observation = expectedObservations(id)[0];
      const evidenceId = observation.evidence_ids[0];
      const row = observationDetails().locator("li").filter({ has: page.getByText(observation.id, { exact: true }) });
      await withTransientFailure(`/api/v1/evidence/${evidenceId}`, async (resume) => {
        await row.getByRole("button", { name: "Abrir registro", exact: true }).first().click();
        await catalog.getByRole("button", { name: "Reintentar fuente", exact: true }).waitFor();
        const responsePromise = page.waitForResponse((response) => pathname(response) === `/api/v1/evidence/${evidenceId}`);
        resume();
        await catalog.getByRole("button", { name: "Reintentar fuente", exact: true }).click();
        const source = await (await responsePromise).json();
        await catalog.locator("article pre").waitFor();
        assert.equal(source.study_id, id);
        assert.equal(await catalog.locator("article pre").textContent(), source.text);
        check(true, "observation source retry opens the same referenced evidence verbatim");
      });
      for (const [label, offset] of [["Siguiente", 20], ["Anterior", 0]]) {
        const pending = [pageResponse(id, "evidence", offset), pageResponse(id, "observations", offset)];
        await catalog.getByRole("button", { name: label, exact: true }).click();
        const [evidence, observations] = await Promise.all((await Promise.all(pending)).map((response) => response.json()));
        await verifyPages(id, evidence, observations, offset);
        assert.equal(await catalog.locator("article").count(), 0, "Changing page must clear the prior source.");
      }
      check(await catalog.getByRole("button", { name: "Anterior", exact: true }).isDisabled(), "previous page is disabled at offset zero");
      check(researchCalls === 0, "browsing P2 studies, sources and observations never starts a research run or mixes BASS points");
      if (screenshots) await catalog.screenshot({ path: path.join(screenshots, "p2-catalog-bass-page.png") });
      await page.locator(".p6-catalog > details > summary").click();
    });
  } catch (error) {
    if (screenshots) await page.screenshot({ path: path.join(screenshots, "p2-catalog-failure.png") }).catch(() => {});
    console.error("Catalog request diagnostics:\n" + network.join("\n"));
    throw error;
  } finally { page.off("request", watchResearch); page.off("response", recordResponse); }
}
