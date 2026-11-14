import test from "node:test";
import assert from "node:assert/strict";
import { demoRanking, type RankingRequest } from "../src/lib/client.ts";
import {
  createRequestGuard, describeRequest, freshness, requestFingerprint, sameRequest
} from "../src/features/mission-lab/comparisonState.ts";
import { providerText, summarizeProvenance } from "../src/features/mission-lab/provenance.ts";

// Peticiones sintéticas de prueba: no describen mediciones NASA.

test("fingerprint applies contract defaults", () => {
  const minimal: RankingRequest = {};
  const explicit: RankingRequest = {
    condition_scope: "trial", target: {}, required_match: [], vary: [], weights: {}, study_ids: [],
    allow_synthetic: false, minimum_coverage: 0.6, limit: 3
  };
  assert.equal(requestFingerprint(minimal), requestFingerprint(explicit));
  assert.notEqual(requestFingerprint(minimal), requestFingerprint({ allow_synthetic: true }));
  assert.notEqual(requestFingerprint(minimal), requestFingerprint({ minimum_coverage: 0.7 }));
  assert.notEqual(requestFingerprint(minimal), requestFingerprint({ limit: 4 }));
  assert.notEqual(requestFingerprint(minimal), requestFingerprint({ condition_scope: "segment" }));
});

test("fingerprint ignores key order and set-list order but not values", () => {
  const a: RankingRequest = {
    target: { gravity_regime: "microgravity", oxygen_pct: 21, flow_velocity_cm_s: 5 },
    required_match: ["gravity_regime", "oxygen_pct"], vary: ["pressure_kpa", "material"],
    weights: { oxygen_pct: 2, flow_velocity_cm_s: 0 }, study_ids: ["synthetic:s2", "synthetic:s1"],
    allow_synthetic: true, limit: 5
  };
  const b: RankingRequest = {
    limit: 5, allow_synthetic: true, study_ids: ["synthetic:s1", "synthetic:s2"],
    weights: { flow_velocity_cm_s: 0, oxygen_pct: 2 }, vary: ["material", "pressure_kpa"],
    required_match: ["oxygen_pct", "gravity_regime"],
    target: { flow_velocity_cm_s: 5, oxygen_pct: 21, gravity_regime: "microgravity" }
  };
  assert.equal(requestFingerprint(a), requestFingerprint(b));
  assert.ok(sameRequest(a, b));
  assert.ok(!sameRequest(a, { ...b, target: { ...b.target, flow_velocity_cm_s: 2 } }));
  // Cero es un valor, no un peso ausente.
  assert.ok(!sameRequest(a, { ...b, weights: { oxygen_pct: 2 } }));
  assert.ok(!sameRequest({ target: { oxygen_pct: 0 } }, { target: {} }));
});

test("sameRequest handles null on either side", () => {
  assert.ok(sameRequest(null, null));
  assert.ok(!sameRequest(demoRanking, null));
  assert.ok(!sameRequest(null, demoRanking));
});

test("freshness is current, stale or unknown", () => {
  assert.equal(freshness(demoRanking, structuredClone(demoRanking)), "current");
  assert.equal(freshness(demoRanking, { ...demoRanking, vary: [...(demoRanking.vary ?? [])].reverse() }), "current");
  assert.equal(freshness(demoRanking, { ...demoRanking, allow_synthetic: false }), "stale");
  assert.equal(freshness(demoRanking, null), "unknown");
});

test("describeRequest is readable English with defaults applied", () => {
  assert.deepEqual(describeRequest(demoRanking), [
    "Target: gravity_regime = microgravity",
    "Required matches: gravity_regime",
    "Varied (not scored): flow_velocity_cm_s",
    "Weights: default (1 per scored target)",
    "Synthetic fixtures: allowed",
    "Minimum coverage: 0.6",
    "Limit: 3",
    "Studies: all"
  ]);
  const lines = describeRequest({ target: { flow_velocity_cm_s: 0 }, weights: { flow_velocity_cm_s: 0 }, condition_scope: "segment" });
  assert.ok(lines.includes("Target: flow_velocity_cm_s = 0"));
  assert.ok(lines.includes("Weights: flow_velocity_cm_s = 0"));
  assert.ok(lines.includes("Synthetic fixtures: not allowed"));
  assert.ok(lines.includes("Condition scope: segment"));
});

test("request guard lets only the latest request apply its late response", async () => {
  const guard = createRequestGuard();
  const applied: string[] = [];
  const run = (label: string, delay: number) => {
    const token = guard.begin();
    return new Promise<void>((resolve) => setTimeout(() => {
      if (guard.isCurrent(token)) applied.push(label);
      resolve();
    }, delay));
  };
  const slow = run("first", 30);
  const fast = run("second", 5);
  await Promise.all([slow, fast]);
  assert.deepEqual(applied, ["second"]);

  const token = guard.begin();
  guard.cancel();
  assert.equal(guard.isCurrent(token), false);
});

test("provenance summary: empty selection is no_evidence", () => {
  const summary = summarizeProvenance([]);
  assert.equal(summary.kind, "no_evidence");
  assert.deepEqual(summary.counts, {});
  assert.match(summary.text, /No selected evidence/);
});

test("provenance summary: all synthetic is labelled as fixtures, not NASA data", () => {
  const summary = summarizeProvenance(["synthetic", "synthetic", "synthetic"]);
  assert.equal(summary.kind, "synthetic");
  assert.deepEqual(summary.counts, { synthetic: 3 });
  assert.match(summary.text, /Synthetic fixtures only \(3\).*not NASA measurements/);
});

test("provenance summary: non-synthetic details published, digitized and derived", () => {
  const summary = summarizeProvenance(["derived", "published", "published", "digitized"]);
  assert.equal(summary.kind, "non_synthetic");
  assert.deepEqual(summary.counts, { derived: 1, published: 2, digitized: 1 });
  assert.match(summary.text, /2 published, 1 digitized, 1 derived/);
});

test("provenance summary: mixed selection counts both sides", () => {
  const summary = summarizeProvenance(["synthetic", "published"]);
  assert.equal(summary.kind, "mixed");
  assert.deepEqual(summary.counts, { synthetic: 1, published: 1 });
  assert.match(summary.text, /1 synthetic fixture \(not NASA measurements\) and 1 published/);
});

test("published provenance never claims review or validation", () => {
  for (const values of [["published"], ["published", "synthetic"], ["published", "digitized", "derived"]] as const) {
    const { text } = summarizeProvenance(values);
    assert.doesNotMatch(text, /\breviewed\b|\bvalidated\b|\bverified\b/i);
    assert.match(text, /review status is reported per evidence item/);
  }
});

test("provider text distinguishes the deterministic demo from an external model", () => {
  assert.match(providerText("demo"), /deterministic demo coordinator.*no external model/i);
  assert.match(providerText("openai"), /external model synthesis.*requires verification/i);
  assert.doesNotMatch(providerText("demo"), /AI|LLM|model inference/);
});
