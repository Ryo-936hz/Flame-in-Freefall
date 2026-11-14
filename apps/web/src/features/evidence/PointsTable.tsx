import type { Models } from "../../lib/client";
import { fmt, shortId } from "../../lib/format";
import { ProvenanceTag } from "../../components/ui";

/** Text alternative to the chart: every plotted value, with units and independence unit. */
export default function PointsTable({ comparison, groupIndex, selectedObservation, selectedTrial, onSelect }: {
  comparison: Models["ComparisonResponse"];
  groupIndex: Map<string, number>;
  selectedObservation: string | null;
  selectedTrial: string | null;
  onSelect: (observationId: string) => void;
}) {
  return <div className="table-wrap">
    <table className="data">
      <caption className="sr-only">Observaciones representadas en el gráfico</caption>
      <thead><tr>
        <th>Observación</th><th>X ({comparison.x_unit ?? "sin unidad"})</th><th>Y ({comparison.unit})</th>
        <th>Unidad independiente</th><th>Grupo</th><th>Procedencia</th>
      </tr></thead>
      <tbody>{comparison.points.map((point) => {
        const selected = point.observation_id === selectedObservation;
        return <tr key={point.observation_id} className="row" data-selected={selected} data-related={!selected && point.trial_id === selectedTrial}>
          <td><button type="button" className="row-link" aria-pressed={selected} onClick={() => onSelect(point.observation_id)}>
            <b>{shortId(point.observation_id)}</b><span className="id">{point.trial_id}</span>
          </button></td>
          <td className="num">{point.x === null ? <span className="muted">no disponible</span> : fmt(point.x)}</td>
          <td className="num">{fmt(point.y)}</td>
          <td className="id">{point.independent_unit_id}</td>
          <td><span className="swatch" data-series={(groupIndex.get(point.group_id) ?? 0) % 4} aria-hidden="true" /> G{(groupIndex.get(point.group_id) ?? 0) + 1}</td>
          <td><ProvenanceTag value={point.provenance} /></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
