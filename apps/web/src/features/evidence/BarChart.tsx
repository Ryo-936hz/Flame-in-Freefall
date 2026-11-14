import { fmt } from "../../lib/format";

export function BarChart({ title, unit, rows }: {
  title: string;
  unit: string;
  rows: { label: string; value: number; detail?: string }[];
}) {
  const max = Math.max(1e-12, ...rows.map(({ value }) => value));
  return <figure className="bar-chart" aria-label={title}>
    <figcaption>{title}{unit && ` (${unit})`}</figcaption>
    <dl>{rows.map(({ label, value, detail }, index) => <div key={`${label}-${index}`}>
      <dt>{label}{detail && <small>{detail}</small>}</dt>
      <dd><span className="bar-chart-track" aria-hidden="true"><i style={{ width: `${100 * value / max}%` }} /></span>
        <span>{fmt(value)}{unit && ` ${unit}`}</span></dd>
    </div>)}</dl>
  </figure>;
}
