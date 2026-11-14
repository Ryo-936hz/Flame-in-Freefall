import test from "node:test";
import assert from "node:assert/strict";
import type { ResearchResponse } from "../../src/lib/client.ts";
import { evidenceFor, selectObservation, selectTrial } from "../../src/features/evidence/selection.ts";

// Minimal response shaped like the API output; IDs are deliberately out of
// array order so a positional link would pick the wrong evidence.
const result = {
  id: "synthetic:run",
  ranking: {
    items: [
      { trial_id: "synthetic:trial-3", evidence_ids: ["synthetic:evidence-3"] },
      { trial_id: "synthetic:trial-1", evidence_ids: ["synthetic:evidence-1", "synthetic:evidence-1b"] },
    ],
    excluded: [{ trial_id: "synthetic:trial-4", evidence_ids: ["synthetic:evidence-4"] }],
  },
  comparison: {
    points: [
      { observation_id: "synthetic:observation-1-2", trial_id: "synthetic:trial-1", evidence_ids: ["synthetic:evidence-1"] },
      { observation_id: "synthetic:observation-3-1", trial_id: "synthetic:trial-3", evidence_ids: ["synthetic:evidence-3"] },
    ],
  },
  evidence: [],
} as unknown as ResearchResponse;

test("a point selects its own trial and evidence by identity", () => {
  const selection = selectObservation(result, "synthetic:observation-3-1");
  assert.deepEqual(selection, {
    trialId: "synthetic:trial-3", observationId: "synthetic:observation-3-1", evidenceId: "synthetic:evidence-3",
  });
});

test("a ranking row selects the trial and its first evidence, without a point", () => {
  const selection = selectTrial(result, "synthetic:trial-1");
  assert.equal(selection.observationId, null);
  assert.equal(selection.evidenceId, "synthetic:evidence-1");
  assert.deepEqual(evidenceFor(result, selection), ["synthetic:evidence-1", "synthetic:evidence-1b"]);
});

test("excluded trials remain inspectable", () => {
  assert.equal(selectTrial(result, "synthetic:trial-4").evidenceId, "synthetic:evidence-4");
});

test("an unknown observation clears the selection instead of guessing", () => {
  assert.deepEqual(selectObservation(result, "synthetic:missing"), { trialId: null, observationId: null, evidenceId: null });
});
