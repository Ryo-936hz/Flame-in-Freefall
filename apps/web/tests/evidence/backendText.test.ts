import test from "node:test";
import assert from "node:assert/strict";
import { tx, txText } from "../../src/lib/backendText.ts";

test("known backend sentences are shown in English", () => {
  assert.equal(tx("Demostración determinista con datos sintéticos."), "Deterministic demonstration with synthetic data.");
  assert.equal(tx("Solicitud inválida: revisa campos, valores y restricciones del contrato."), "Invalid request: check fields, values and contract constraints.");
});

test("sentences with IDs and numbers keep their values", () => {
  assert.equal(tx("Perfil: 41 ensayos; 3 candidatos elegibles; 3 evidencias recuperadas."), "Profile: 41 trials; 3 eligible candidates; 3 evidence items retrieved.");
  assert.equal(
    tx("synthetic:trial-1: elegible bajo los filtros explícitos; cobertura=1.000. No implica equivalencia física ni riesgo."),
    "synthetic:trial-1: eligible under the explicit filters; coverage=1.000. This does not imply physical equivalence or risk.",
  );
  assert.equal(tx("SINTÉTICO ensayo 4"), "SYNTHETIC trial 4");
});

test("unknown text is returned unchanged, never guessed", () => {
  assert.equal(tx("Gower v1 uses fixed software scales."), "Gower v1 uses fixed software scales.");
  assert.equal(tx("Una frase nueva del backend"), "Una frase nueva del backend");
});

test("report Markdown is translated line by line", () => {
  const report = "# FlameLab SI — informe de investigación\n\n## Síntesis\n\nDemostración determinista con datos sintéticos.\n\n## Límites\n";
  assert.equal(txText(report), "# FlameLab SI — research report\n\n## Synthesis\n\nDeterministic demonstration with synthetic data.\n\n## Limits\n");
});
