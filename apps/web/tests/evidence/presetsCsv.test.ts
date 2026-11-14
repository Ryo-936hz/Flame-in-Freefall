import test from "node:test";
import assert from "node:assert/strict";
import type { Models, ResearchResponse } from "../../src/lib/client.ts";
import { activeHabitat, applyHabitat, buildRanking, demoDraft } from "../../src/lib/filters.ts";
import { comparisonCsv } from "../../src/features/evidence/exportCsv.ts";

test("a habitat preset fills gravity, oxygen and pressure as explicit filters", () => {
  const draft = applyHabitat(demoDraft(), "moon");
  const { request } = buildRanking(draft);
  assert.deepEqual(request?.target, { gravity_regime: "lunar", oxygen_pct: 34, pressure_kpa: 56.5 });
  assert.deepEqual(request?.required_match, ["gravity_regime"]);
  assert.deepEqual(request?.vary, ["flow_velocity_cm_s"]);
  assert.equal(activeHabitat(draft), "moon");
});

test("editing a preset value makes it no longer active", () => {
  const draft = applyHabitat(demoDraft(), "mars");
  draft.conditions.oxygen_pct = { role: "similar", value: "31" };
  assert.equal(activeHabitat(draft), null);
});

const result = { id: "research:abc", ranking: { dataset_id: "synthetic:demo" } } as unknown as ResearchResponse;
const comparison = {
  metric: "flame_spread_rate_mm_s", unit: "mm/s", x_condition: "flow_velocity_cm_s", x_unit: "cm/s", groups: [], warnings: [],
  points: [
    { observation_id: "synthetic:o-1", trial_id: "synthetic:t-1", independent_unit_id: "synthetic:u-1", group_id: "group:a", x: 0, y: 0, provenance: "synthetic", evidence_ids: ["synthetic:e-1", "synthetic:e-2"] },
    { observation_id: "synthetic:o-2", trial_id: "synthetic:t-2", independent_unit_id: "synthetic:u-2", group_id: "group,\"b\"", x: null, y: 0.2, provenance: "synthetic", evidence_ids: [] },
  ],
} as unknown as Models["ComparisonResponse"];

test("CSV keeps one row per observation with units, provenance and evidence", () => {
  const lines = comparisonCsv(result, comparison).trim().split("\r\n");
  assert.equal(lines.length, 3);
  assert.match(lines[0]!, /^research_id,dataset_id,observation_id/);
  assert.equal(lines[1], "research:abc,synthetic:demo,synthetic:o-1,synthetic:t-1,synthetic:u-1,group:a,flow_velocity_cm_s,0,cm/s,flame_spread_rate_mm_s,0,mm/s,synthetic,synthetic:e-1 synthetic:e-2");
});

test("CSV leaves a missing x empty (not zero) and escapes separators and quotes", () => {
  const row = comparisonCsv(result, comparison).trim().split("\r\n")[2]!;
  assert.ok(row.includes(',"group,""b""",flow_velocity_cm_s,,cm/s,'));
});
