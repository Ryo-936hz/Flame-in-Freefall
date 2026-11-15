// Curated published values, not a model-generated result. Authority: P3_BASS_II_DECISION_DEMO.md.
export const QUESTION = "Compare BASS-II flame spread at 6 and 5 cm/s. What can the evidence support?";
export const PDF = "https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65";
export const SOURCES = [
  { title: "NASA technical memorandum", locator: "NASA/TM-20210011385 · PDF p.65 / printed p.57", url: PDF, evidenceId: "psi:PSI-25:M13:stage:1:table51", note: "Table 5.1 reports successive conditions and flame spread measurements. Sequence indicates source order, not elapsed time." },
  { title: "BASS-II · Table 5.1", locator: "Rows M4, M7, M8, M13, M16, M17, M19", url: PDF, evidenceId: "psi:PSI-25:M8:stage:2:table51", note: "M8: the table reports 0.056 mm/s at 6 cm/s and 0.04 mm/s at 5 cm/s. Figure 5.2 gives fitted slopes of 0.0557 and 0.0391 mm/s. The discrepancy is retained, not averaged away." },
  { title: "M8 · sample & review notes", locator: "PSI-25_Experimental table_BASS-II.csv · physical line 35", url: "https://doi.org/10.60555/4qc4-de67", evidenceId: "psi:PSI-25:M8:operational", note: "M8 belongs to sample 178m. Initial/final oxygen is 19.1/18.2 vol% at trial level. Effective oxygen for each segment is not measured. Flame spread rates come from the NASA memorandum, not this operational CSV." }
] as const;
export const OBSERVATIONS = [
  { trial: "M7", segment: 2, sample: "177m", flow: 6, rate: 0.099 },
  { trial: "M8", segment: 2, sample: "178m", flow: 6, rate: 0.056 },
  { trial: "M13", segment: 1, sample: "169m", flow: 6, rate: 0.047 },
  { trial: "M19", segment: 2, sample: "170m", flow: 6, rate: 0.0159 },
  { trial: "M4", segment: 1, sample: "171m", flow: 5, rate: 0.045 },
  { trial: "M7", segment: 3, sample: "177m", flow: 5, rate: 0.083 },
  { trial: "M8", segment: 3, sample: "178m", flow: 5, rate: 0.04 },
  { trial: "M13", segment: 2, sample: "169m", flow: 5, rate: 0.035 },
  { trial: "M16", segment: 1, sample: "164m", flow: 5, rate: 0.144 },
  { trial: "M17", segment: 1, sample: "166m", flow: 5, rate: 0.053 }
] as const;
export const FINDING = "The 6 and 5 cm/s selections contain four and six published observations across seven identified samples. M7, M8 and M13 occur in both selections. Their tabulated rates are lower in the 5 cm/s records, but successive conditions do not isolate a causal effect of flow.";
export const CONTROLS = "PMMA sheets in microgravity and opposed flow. Thickness and width vary; two burning faces are reported but their identity is not. The selections are not geometrically equivalent groups.";
export const REVIEW_ITEMS = ["Keep the M8 table/figure discrepancy visible.", "Count seven samples; segments do not create independent replicates.", "Accept descriptive comparison only: effective oxygen per segment is not measured."];
export type Stage = "idle" | "plan" | "retrieve" | "analyze" | "review" | "write" | "complete";
export const STEPS: { id: Stage; label: string; agent: string; message: string; duration: number }[] = [
  { id: "plan", label: "Plan", agent: "Coordinator", message: "Scope: BASS-II, two flow conditions, original sample identities.", duration: 3000 },
  { id: "retrieve", label: "Sources", agent: "Scout", message: "Prepared source set: NASA Table 5.1 and the M8 operational record.", duration: 6000 },
  { id: "analyze", label: "Compare", agent: "Analyst", message: "Trace ten published observations to seven samples; preserve segment order.", duration: 6500 },
  { id: "review", label: "Review", agent: "Critic", message: "M8 has two published representations. Review the comparison scope.", duration: 0 },
  { id: "write", label: "Report", agent: "Writer", message: "Assemble the prepared finding, sources and your review decision.", duration: 4000 }
];
export function preparedReport(note: string): string {
  return ["# BASS-II · prepared research case", "", QUESTION, "", "## Finding", FINDING, "", CONTROLS,
    "", "## Scope acknowledged by the user", ...REVIEW_ITEMS.map(x => "- " + x),
    "", "Review note: " + (note.trim() || "No additional note."), "", "## Published values",
    "Trial | Segment | Sample | Flow (cm/s) | Spread (mm/s)", "---|---|---|---|---",
    ...OBSERVATIONS.map(o => `${o.trial}|${o.segment}|${o.sample}|${o.flow}|${o.rate}`),
    "", "## Sources", ...SOURCES.map(s => `${s.title} — ${s.locator}\n${s.url}\n${s.note}`),
    "", "Prepared workflow and curated published values. Agent motion is choreographed; no model execution is claimed. User acknowledgement does not validate the corpus or establish causality."
  ].join("\n");
}
