import type { Models } from "./client";

// NASA/TM-20210011385, Table 5.1, PDF p.65 / printed p.57, M13.
export const M13_QUESTION = "What was the flame spread rate in each segment of BASS-II M13?";
export const M13_ROWS = [
  { segment: 1, flow: 6, rate: "0.047" },
  { segment: 2, flow: 5, rate: "0.035" },
  { segment: 3, flow: 4, rate: "0.033" },
] as const;
export function isM13Question(question: string): boolean {
  return /^what was the flame spread rate in each segment of bass?-ii m13$/i.test(
    question.trim().replace(/[–—]/g, "-").replace(/[?.!]+$/, "").replace(/\s+/g, " ")
  );
}
export const M13_REFERENCE: Models["ChatResponse"] = {
  provider: "catalog", elapsed_ms: 0,
  answer: "BASS-II trial M13 reports three successive flame-spread measurements for sample 169m. The rate decreases across the reported sequence as the imposed flow changes from 6 to 4 cm/s.",
  technical_details: [
    "Metric: flame spread rate, in mm/s. Values are transcribed from NASA/TM-20210011385, Table 5.1, M13; PDF page 65 / printed page 57.",
    "All three segments belong to trial M13 and sample 169m. They are successive observations, not three independent replicates. Sequence is source order, not elapsed time.",
    "Effective oxygen concentration is not measured per segment. This descriptive sequence does not establish that flow alone caused the rate change."
  ],
  sources: M13_ROWS.map(row => ({
    section: "evidence", study_id: "psi:PSI-25", evidence_id: `psi:PSI-25:M13:stage:${row.segment}:table51`,
    title: `M13 · segment ${row.segment} · ${row.rate} mm/s`,
    text: `NASA/TM-20210011385 · Table 5.1 · M13 · segment ${row.segment}: ${row.rate} mm/s at ${row.flow} cm/s. PDF p.65 / printed p.57.`
  }))
};
