import type { Models } from "../../lib/client";
import { fmt, shortId } from "../../lib/format";
import { ProvenanceTag } from "../../components/ui";
import { conditionLabel, metricLabel } from "../../lib/filters";

/** Text alternative to the chart: every plotted value, with units and independence unit. */
export default function PointsTable({ comparison, labels, groupIndex, selectedObservation, selectedTrial, onSelect }: {
  comparison: Models["ComparisonResponse"];
  labels: ReadonlyMap<string, string>;
  groupIndex: Map<string, number>;
  selectedObservation: string | null;
  selectedTrial: string | null;
  onSelect: (observationId: string) => void;
}) {
  return <div className="table-wrap">
    <table className="data">
      <caption className="sr-only">Observations plotted in the chart</caption>
      <thead><tr>
        <th>Observation</th><th>{comparison.x_condition ? conditionLabel(comparison.x_condition) : "Condition"}{comparison.x_unit ? ` (${comparison.x_unit})` : ""}</th>
        <th>{metricLabel(comparison.metric)} ({comparison.unit})</th>
        <th>Independent unit</th><th>Group</th><th>Provenance</th>
      </tr></thead>
      <tbody>{comparison.points.map((point) => {
        const selected = point.observation_id === selectedObservation;
        return <tr key={point.observation_id} className="row" data-trial-id={point.trial_id} data-selected={selected} data-related={!selected && point.trial_id === selectedTrial}>
          <td><button type="button" className="row-link" title={point.observation_id} aria-pressed={selected} onClick={() => onSelect(point.observation_id)}>
            <b>{labels.get(point.trial_id) ?? shortId(point.trial_id)}</b>
            {point.segment_id && <span title={point.segment_id}>Segment {point.segment_id.split(":").at(-1)}</span>}
          </button></td>
          <td className="num">{point.x === null ? <span className="muted">not available</span> : fmt(point.x)}</td>
          <td className="num">{fmt(point.y)}</td>
          <td className="num" title={point.independent_unit_id}>{point.independent_unit_status === "identified" ? point.independent_unit_id.split(":").at(-1) : "Unresolved"}</td>
          <td><span className="swatch" data-series={(groupIndex.get(point.group_id) ?? 0) % 4} aria-hidden="true" /> G{(groupIndex.get(point.group_id) ?? 0) + 1}</td>
          <td><ProvenanceTag value={point.provenance} /></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
