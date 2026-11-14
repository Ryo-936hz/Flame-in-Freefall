import assert from "node:assert/strict";
import test from "node:test";
import { demoRanking, type RankingRequest } from "../src/lib/client";
import { clockTime, previousNotice, resultStatus, scenarioAName } from "../src/features/mission-lab/resultStatus";

const metric = "flame_spread_rate_mm_s" as const;
const at = new Date(2026, 10, 14, 9, 5, 30);
const earth: RankingRequest = { ...demoRanking, target: { gravity_regime: "earth" } };

test("A/B result is current only with the same filters and the same active research", () => {
  const ctx = { request: demoRanking, metric, at, researchId: null };
  assert.equal(resultStatus(ctx, { ...demoRanking }, null, metric), "current");
  assert.equal(resultStatus(ctx, earth, null, metric), "filters_changed");
  assert.equal(resultStatus(ctx, null, null, metric), "filters_unknown");
  assert.equal(resultStatus(ctx, demoRanking, "run-2", metric), "research_changed");
  assert.equal(resultStatus({ ...ctx, researchId: "run-1" }, demoRanking, "run-2", metric), "research_changed");
});

test("filters changed while pending are reported as previous on arrival", () => {
  const pending = { request: demoRanking, metric, at, researchId: "run-1" };
  assert.notEqual(resultStatus(pending, earth, "run-1", metric), "current");
});

test("A is never named 'current filters' unless the result is current", () => {
  assert.equal(clockTime(at), "09:05");
  assert.equal(scenarioAName("current", at), "A · current filters");
  for (const status of ["filters_changed", "filters_unknown", "metric_changed", "question_changed", "variable_order_changed", "research_changed"] as const) {
    assert.equal(scenarioAName(status, at), "A · filters used at 09:05");
    assert.ok(previousNotice(status, "comparison")?.startsWith("Previous comparison"));
  }
  assert.equal(previousNotice("filters_changed", "comparison"), "Previous comparison — not computed with the current filters");
  assert.equal(previousNotice("filters_unknown", "query"), "Previous query — not computed with the current filters");
  assert.equal(previousNotice("current", "comparison"), null);
});


test("same filters with a different metric make a comparison previous", () => {
  const context = { request: demoRanking, metric, at, researchId: "run-1" };
  assert.equal(resultStatus(context, demoRanking, "run-1", "heat_release_w"), "metric_changed");
  assert.equal(resultStatus(context, demoRanking, "run-1", metric), "current");
  assert.match(previousNotice("metric_changed", "comparison") ?? "", /current metric/);
});

test("research context also tracks question and varied-variable order", () => {
  const question = "Which evidence applies?";
  const request: RankingRequest = { ...demoRanking, vary: ["flow_velocity_cm_s", "pressure_kpa"] };
  const context = { request, metric, question, at, researchId: null };
  assert.equal(resultStatus(context, request, null, metric, question), "current");
  assert.equal(resultStatus(context, request, null, metric, "A new question"), "question_changed");
  const reordered: RankingRequest = { ...request, vary: ["pressure_kpa", "flow_velocity_cm_s"] };
  assert.equal(resultStatus(context, reordered, null, metric, question), "variable_order_changed");
  const rankingOnly = { request, metric, at, researchId: null };
  assert.equal(resultStatus(rankingOnly, reordered, null, metric), "current");
  assert.match(previousNotice("question_changed", "query") ?? "", /current question/);
  assert.match(previousNotice("variable_order_changed", "query") ?? "", /another variable order/);
});
