import test from "node:test";
import assert from "node:assert/strict";
import { demoRanking } from "../../src/lib/client.ts";
import { buildRanking, demoDraft, describeRanking } from "../../src/lib/filters.ts";
import { createLatest } from "../../src/lib/latest.ts";

test("the demo form produces exactly the documented demo filters", () => {
  const { request, errors } = buildRanking(demoDraft());
  assert.deepEqual(errors, {});
  assert.deepEqual(request, demoRanking);
});

test("roles map to target, required_match and vary without overlap", () => {
  const draft = demoDraft();
  draft.conditions.oxygen_pct = { role: "similar", value: "34,5" };
  draft.conditions.material = { role: "match", value: " PMMA " };
  const { request } = buildRanking(draft);
  assert.equal(request?.target?.oxygen_pct, 34.5);
  assert.equal(request?.target?.material, "PMMA");
  assert.ok(request?.required_match?.includes("material"));
  assert.ok(!request?.required_match?.includes("oxygen_pct"));
  assert.deepEqual(request?.vary, ["flow_velocity_cm_s"]);
  assert.equal(request?.target?.flow_velocity_cm_s, undefined);
});

test("zero is a value, not an empty field", () => {
  const draft = demoDraft();
  draft.conditions.flow_velocity_cm_s = { role: "similar", value: "0" };
  assert.equal(buildRanking(draft).request?.target?.flow_velocity_cm_s, 0);
});

test("empty or non-numeric inputs are reported per field and nothing is sent", () => {
  const draft = demoDraft();
  draft.conditions.oxygen_pct = { role: "match", value: "abc" };
  draft.conditions.material = { role: "similar", value: "  " };
  const { request, errors } = buildRanking(draft);
  assert.equal(request, null);
  assert.ok(errors.oxygen_pct);
  assert.ok(errors.material);
});

test("the interpreted summary states synthetic inclusion and the studied variable", () => {
  const lines = describeRanking(demoRanking);
  assert.ok(lines.some((line) => line.includes("synthetic")));
  assert.ok(lines.some((line) => line.includes("Flow velocity")));
});

test("a late response from an older request is not current", () => {
  const latest = createLatest();
  const first = latest.begin();
  const second = latest.begin();
  assert.equal(latest.isCurrent(first), false);
  assert.equal(latest.isCurrent(second), true);
  latest.cancel();
  assert.equal(latest.isCurrent(second), false);
});
