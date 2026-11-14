import type { Models, ResearchResponse } from "../../lib/client";

const COLUMNS = [
  "research_id", "dataset_id", "observation_id", "trial_id", "independent_unit_id", "group_id",
  "x_condition", "x_value", "x_unit", "metric", "y_value", "y_unit", "provenance", "evidence_ids",
] as const;

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  // Quote fields with separators, quotes or line breaks; neutralise spreadsheet formulas.
  const safe = /^[=+\-@\t\r]/.test(text) && !/^-?\d/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * The comparison points exactly as returned by the API, one row per observation.
 * Provenance travels with every row so synthetic values cannot be mistaken for NASA data.
 * An empty x_value means the API returned no x (it is not zero).
 */
export function comparisonCsv(result: ResearchResponse, comparison: Models["ComparisonResponse"]): string {
  const rows = comparison.points.map((point) => [
    result.id, result.ranking.dataset_id, point.observation_id, point.trial_id, point.independent_unit_id, point.group_id,
    comparison.x_condition ?? "", point.x, comparison.x_unit ?? "", comparison.metric, point.y, comparison.unit,
    point.provenance, point.evidence_ids.join(" "),
  ].map(cell).join(","));
  return [COLUMNS.join(","), ...rows].join("\r\n") + "\r\n";
}

export function csvFileName(result: ResearchResponse): string {
  return `flamelab-${result.id.replace(/[^A-Za-z0-9-]+/g, "-")}.csv`;
}

/** Hand the CSV to the browser as a download; nothing is uploaded. */
export function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
