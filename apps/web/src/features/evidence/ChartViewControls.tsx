import type { Models } from "../../lib/client";
import type { ChartStyle } from "./ScatterChart";

export function medianRows(groups: Models["ComparisonResponse"]["groups"]) {
  return groups.flatMap((group, index) => group.median == null ? [] : [{
    label: `Group ${index + 1}`,
    value: group.median,
    detail: `${group.n_observations} observations`,
  }]);
}

export function ChartViewControls({ label, view, onChange, canShowLines, canShowBars }: {
  label: string;
  view: ChartStyle;
  onChange: (view: ChartStyle) => void;
  canShowLines: boolean;
  canShowBars: boolean;
}) {
  return <div className="seg" role="group" aria-label={label}>
    <button type="button" aria-pressed={view === "chart"} onClick={() => onChange("chart")}>Chart</button>
    <button type="button" disabled={!canShowLines} title={!canShowLines ? "Requires consecutive segments of the same trial" : undefined}
      aria-pressed={view === "lines"} onClick={() => onChange("lines")}>Lines</button>
    <button type="button" disabled={!canShowBars} aria-pressed={view === "bars"} onClick={() => onChange("bars")}>Bars</button>
    <button type="button" aria-pressed={view === "table"} onClick={() => onChange("table")}>Table</button>
  </div>;
}
