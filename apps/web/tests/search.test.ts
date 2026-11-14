import assert from "node:assert/strict";
import test from "node:test";
import { normalize, searchItems } from "../src/lib/search";
import type { SearchItem } from "../src/lib/search";

const items: SearchItem[] = [
  { kind: "section", id: "catalog", title: "Catalog", detail: "Browse studies" },
  { kind: "section", id: "lab", title: "Mission Lab", detail: "Compare A/B" },
  { kind: "study", id: "psi:PSI-98", title: "Saffire burn tests", detail: "spacecraft fire", keywords: "large scale" },
  { kind: "study", id: "psi:PSI-69", title: "FLEX droplet combustion", detail: "droplets" },
  { kind: "trial", id: "synthetic:trial-1", title: "SYNTHETIC trial 1", detail: "synthetic:flow-study · synthetic" },
  { kind: "trial", id: "synthetic:trial-2", title: "SYNTHETIC trial 2", detail: "synthetic:flow-study · synthetic" },
];

test("an empty query lists only the sections", () => {
  assert.deepEqual(searchItems(items, "  ").map((item) => item.id), ["catalog", "lab"]);
});

test("every word must match, across title, detail, id and keywords", () => {
  assert.deepEqual(searchItems(items, "psi 98").map((item) => item.id), ["psi:PSI-98"]);
  assert.deepEqual(searchItems(items, "large scale").map((item) => item.id), ["psi:PSI-98"]);
  assert.deepEqual(searchItems(items, "saffire droplets"), []);
});

test("results are grouped sections, studies, trials and title starts rank first", () => {
  const ids = searchItems(items, "s").map((item) => item.id);
  // "Mission Lab" has the letter in its title, "Catalog" only in its detail.
  assert.deepEqual(ids, ["lab", "catalog", "psi:PSI-98", "psi:PSI-69", "synthetic:trial-1", "synthetic:trial-2"]);
  assert.deepEqual(searchItems(items, "trial 2").map((item) => item.id), ["synthetic:trial-2"]);
});

test("accents and case are ignored", () => {
  assert.equal(normalize("Catálogo"), "catalogo");
  assert.deepEqual(searchItems(items, "CATÁLOG").map((item) => item.id), ["catalog"]);
});

test("each group is capped", () => {
  assert.equal(searchItems(items, "synthetic", 1).filter((item) => item.kind === "trial").length, 1);
});
