import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "../../lib/motion";
import type { Models } from "../../lib/client";
import { conditionLabel, metricLabel } from "../../lib/filters";
import { fmt, shortId } from "../../lib/format";

type Comparison = Models["ComparisonResponse"];

const W = 640;
const H = 300;
const M = { l: 58, r: 18, t: 16, b: 46 };

function niceTicks(max: number, count = 5): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 1e-9; v += step) ticks.push(Number(v.toPrecision(12)));
  // The last tick must lie beyond the padded maximum so no point sits on the frame.
  while ((ticks[ticks.length - 1] ?? 0) < max) ticks.push(Number(((ticks[ticks.length - 1] ?? 0) + step).toPrecision(12)));
  return ticks;
}

/** Points of each group sorted by x, so a line runs left to right through them. */
function linesByGroup<T extends { group_id: string; x: number | null }>(points: T[]): { group: string; points: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const point of points) groups.set(point.group_id, [...(groups.get(point.group_id) ?? []), point]);
  return [...groups].map(([group, items]) => ({ group, points: [...items].sort((a, b) => (a.x ?? 0) - (b.x ?? 0)) }));
}

/**
 * Plots the points returned by the API exactly: x/y values, units and groups
 * come from the comparison response. Points without x are listed, not placed.
 */
/** How the same points are drawn: dots, dots joined per group, or one bar per point. */
export type ChartForm = "points" | "line" | "bars";
export const CHART_FORMS: { id: ChartForm; label: string }[] = [
  { id: "points", label: "Points" },
  { id: "line", label: "Line" },
  { id: "bars", label: "Bars" },
];

export default function ScatterChart({ comparison, groupIndex, selectedObservation, selectedTrial, onSelect, form = "points" }: {
  comparison: Comparison;
  groupIndex: Map<string, number>;
  selectedObservation: string | null;
  selectedTrial: string | null;
  onSelect: (observationId: string) => void;
  form?: ChartForm;
}) {
  const figure = useRef<HTMLElement>(null);
  // Selection ring contracts onto the chosen point.
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(".pt-ring", { scale: 2.4, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.55, ease: "expo.out" });
    gsap.fromTo(".pt[data-related=\"true\"] .pt-dot", { scale: 1.6, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.5, ease: "back.out(2)" });
  }, { scope: figure, dependencies: [selectedObservation, selectedTrial] });

  const placed = comparison.points.filter((point) => point.x !== null);
  const unplaced = comparison.points.filter((point) => point.x === null);
  const xTicks = niceTicks(Math.max(0, ...placed.map((point) => point.x as number)) * 1.08 || 1);
  const yTicks = niceTicks(Math.max(0, ...comparison.points.map((point) => point.y)) * 1.1 || 1);
  const xMax = xTicks[xTicks.length - 1] ?? 1;
  const yMax = yTicks[yTicks.length - 1] ?? 1;
  const sx = (v: number) => M.l + (v / xMax) * (W - M.l - M.r);
  const sy = (v: number) => H - M.b - (v / yMax) * (H - M.t - M.b);
  const xTitle = `${conditionLabel(comparison.x_condition ?? "")} (${comparison.x_unit ?? "no unit"})`;
  const yTitle = `${metricLabel(comparison.metric)} (${comparison.unit})`;

  // Repeated observations at the same x share a column; offset them slightly so both stay clickable.
  const stack = new Map<string, number>();
  const offsets = new Map<string, number>();
  for (const point of placed) {
    const key = `${point.x}:${point.y}`;
    const n = stack.get(key) ?? 0;
    stack.set(key, n + 1);
    offsets.set(point.observation_id, n * 7);
  }

  const onKey = (event: KeyboardEvent, id: string) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(id); }
  };

  return <figure className="chart" ref={figure}>
    <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`Scatter chart: ${yTitle} vs ${xTitle}. ${placed.length} points.`}>
      <g className="axis" aria-hidden="true">
        {xTicks.map((t) => <g key={`x${t}`}><line x1={sx(t)} x2={sx(t)} y1={M.t} y2={H - M.b} /><text x={sx(t)} y={H - M.b + 16} textAnchor="middle">{fmt(t)}</text></g>)}
        {yTicks.map((t) => <g key={`y${t}`}><line x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} /><text x={M.l - 8} y={sy(t) + 3.5} textAnchor="end">{fmt(t)}</text></g>)}
        <text className="axis-title" x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle">{xTitle}</text>
        <text className="axis-title" transform={`translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle">{yTitle}</text>
      </g>
      {form === "line" && <g aria-hidden="true">
        {linesByGroup(placed).map(({ group, points }) => <polyline key={group} className="pt-line" data-series={(groupIndex.get(group) ?? 0) % 4}
          points={points.map((point) => `${sx(point.x as number) + (offsets.get(point.observation_id) ?? 0)},${sy(point.y)}`).join(" ")} />)}
      </g>}
      {placed.map((point) => {
        const selected = point.observation_id === selectedObservation;
        const sameTrial = !selected && point.trial_id === selectedTrial;
        const x = sx(point.x as number) + (offsets.get(point.observation_id) ?? 0);
        const y = sy(point.y);
        const label = `${shortId(point.observation_id)} · ${shortId(point.trial_id)}: ${fmt(point.x)} ${comparison.x_unit ?? ""}, ${fmt(point.y)} ${comparison.unit}`;
        const pick = { onClick: () => onSelect(point.observation_id), onKeyDown: (event: KeyboardEvent) => onKey(event, point.observation_id) };
        return <g key={point.observation_id} className="pt" data-selected={selected} data-related={sameTrial}
          data-series={(groupIndex.get(point.group_id) ?? 0) % 4}>
          {selected && <circle className="pt-ring" cx={x} cy={y} r={12} />}
          {form === "bars"
            ? <rect className="pt-bar" x={x - 6} y={y} width={12} height={Math.max(0, sy(0) - y)} rx={2} tabIndex={0} role="button"
              aria-pressed={selected} aria-label={label} {...pick} />
            : <circle className="pt-dot" cx={x} cy={y} r={selected ? 6.5 : 5.5} tabIndex={0} role="button"
              aria-pressed={selected} aria-label={label} {...pick} />}
        </g>;
      })}
    </svg>
    {unplaced.length > 0 && <figcaption className="unplaced">
      <span className="cap">No X-axis value ({unplaced.length})</span>
      {unplaced.map((point) => <button type="button" key={point.observation_id} className="chip" aria-pressed={point.observation_id === selectedObservation}
        onClick={() => onSelect(point.observation_id)}>{shortId(point.observation_id)} · {fmt(point.y)} {comparison.unit}</button>)}
    </figcaption>}
  </figure>;
}
