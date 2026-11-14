import assert from "node:assert/strict";
import test from "node:test";
import { demoRanking, type RankingRequest } from "../src/lib/client";
import { clockTime, previousNotice, resultStatus, scenarioAName } from "../src/features/mission-lab/resultStatus";

const at = new Date(2026, 10, 14, 9, 5, 30);
const earth: RankingRequest = { ...demoRanking, target: { gravity_regime: "earth" } };

test("A/B result is current only with the same filters and the same active research", () => {
  const ctx = { request: demoRanking, at, researchId: null };
  assert.equal(resultStatus(ctx, { ...demoRanking }, null), "current");
  assert.equal(resultStatus(ctx, earth, null), "filters_changed");
  assert.equal(resultStatus(ctx, null, null), "filters_unknown");
  assert.equal(resultStatus(ctx, demoRanking, "run-2"), "research_changed");
  assert.equal(resultStatus({ ...ctx, researchId: "run-1" }, demoRanking, "run-2"), "research_changed");
});

test("filters changed while pending are reported as previous on arrival", () => {
  const pending = { request: demoRanking, at, researchId: "run-1" };
  assert.notEqual(resultStatus(pending, earth, "run-1"), "current");
});

test("A is never named 'current filters' unless the result is current", () => {
  assert.equal(clockTime(at), "09:05");
  assert.equal(scenarioAName("current", at), "A · current filters");
  for (const status of ["filters_changed", "filters_unknown", "research_changed"] as const) {
    assert.equal(scenarioAName(status, at), "A · filters used at 09:05");
    assert.ok(previousNotice(status, "comparison")?.startsWith("Previous comparison"));
  }
  assert.equal(previousNotice("filters_changed", "comparison"), "Previous comparison — not computed with the current filters");
  assert.equal(previousNotice("filters_unknown", "query"), "Previous query — not computed with the current filters");
  assert.equal(previousNotice("current", "comparison"), null);
});
