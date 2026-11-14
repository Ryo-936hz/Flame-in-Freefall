import assert from "node:assert/strict";
import { ApiError, createApi, demoRanking } from "../src/lib/client.ts";

// Opt-in consumer integration: requires the running local demo API.
const base = process.env.FLAMELAB_API_URL ?? "http://127.0.0.1:8000";
const api = createApi(base);
const health = await api.health();
assert.equal(health.ai_provider, "demo", "This smoke must run against the credential-free demo.");
const profile = await api.profile();
assert.ok(profile.synthetic_trials > 0, "Seed the explicit synthetic fixture first.");
const response = await api.research({ question: "Recorrido del cliente técnico con fixtures sintéticos", ranking: demoRanking });
assert.equal(response.status, "completed");
assert.ok(response.ranking.items.length > 0);
assert.ok(response.ranking.items.every((item) => item.provenance === "synthetic"));
assert.ok(response.comparison?.points.length);
assert.ok(response.comparison.points.every((point) => point.provenance === "synthetic"));
for (const evidenceId of response.ranking.items[0]!.evidence_ids) {
  const evidence = await api.evidence(evidenceId);
  assert.equal(evidence.provenance, "synthetic");
}
const saved = await api.getResearch(response.id);
assert.deepEqual(saved, response);
assert.match(await api.report(response.id), /synthetic|sint[eé]tic/i);
assert.match(await api.events(response.id), /data:/);
const lunar = { ...demoRanking, target: { gravity_regime: "lunar" } };
const scenario = await api.scenarios({ scenario_a: demoRanking, scenario_b: lunar });
assert.ok(scenario.ranking_a.items.length > 0);
assert.equal(scenario.ranking_b.items.length, 0);
const noEvidence = await api.research({ question: "Escenario sin evidencia lunar", ranking: lunar });
assert.equal(noEvidence.status, "insufficient_evidence");
await assert.rejects(api.evidence("synthetic:missing"), (error: unknown) => error instanceof ApiError && error.status === 404);
console.log(JSON.stringify({ client_smoke: "passed", provider: health.ai_provider, data_mode: health.data_mode, run_id: response.id, synthetic_trials: profile.synthetic_trials, comparison_points: response.comparison.points.length, checks: ["health", "profile", "research", "provenance", "evidence", "persistence", "report", "replay", "scenario_change", "insufficient_evidence", "404"] }, null, 2));
