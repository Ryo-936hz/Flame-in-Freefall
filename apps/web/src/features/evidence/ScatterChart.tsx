import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "../../lib/motion";
import type { Models } from "../../lib/client";
import { conditionLabel, metricLabel } from "../../lib/filters";
import { fmt, shortId } from "../../lib/format";

type Comparison = Models["ComparisonResponse"];
type Point = Comparison["points"][number];
type SegmentPoint = { point: Point; sequence: number };

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

/** Only consecutive measurements in a single trial can form a line. */
export function segmentSeries(comparison: Comparison, trials: Models["Trial"][]): SegmentPoint[][] {
  const sequences = new Map(trials.flatMap((trial) => (trial.segments ?? []).map((segment) =>
    [segment.id, segment.sequence] as const)));
  const byTrial = new Map<string, SegmentPoint[]>();
  for (const point of comparison.points) {
    if (!point.segment_id) continue;
    const sequence = sequences.get(point.segment_id);
    if (sequence === undefined) continue;
    const series = byTrial.get(point.trial_id) ?? [];
    series.push({ point, sequence });
    byTrial.set(point.trial_id, series);
  }
  return [...byTrial.values()]
    .filter((series) => series.length > 1 && new Set(series.map(({ sequence }) => sequence)).size === series.length)
    .map((series) => series.sort((a, b) => a.sequence - b.sequence))
    .filter((series) => series.some(({ sequence }, index) =>
      index > 0 && sequence === series[index - 1]!.sequence + 1));
}

/**
 * Plots the points returned by the API exactly: x/y values, units and groups
 * come from the comparison response. With no measured X values, show the
 * measurements by observation order so the displayed position implies no axis value.
 */
/** How the same points are drawn: dots, dots joined per group, or one bar per point. */
export type ChartForm = "points" | "line" | "bars";
export const CHART_FORMS: { id: ChartForm; label: string }[] = [
  { id: "points", label: "Points" },
  { id: "line", label: "Line" },
  { id: "bars", label: "Bars" },
];

export default function ScatterChart({ comparison, groupIndex, selectedObservation, selectedTrial, onSelect, form = "points", lines = [] }: {
  comparison: Comparison;
  groupIndex: Map<string, number>;
  selectedObservation: string | null;
  selectedTrial: string | null;
  onSelect: (observationId: string) => void;
  form?: ChartForm;
  lines?: SegmentPoint[][];
}) {
  const figure = useRef<HTMLElement>(null);
  // Selection ring contracts onto the chosen point.
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(".pt-ring", { scale: 2.4, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.55, ease: "expo.out" });
    gsap.fromTo(".pt[data-related=\"true\"] .pt-dot", { scale: 1.6, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.5, ease: "back.out(2)" });
  }, { scope: figure, dependencies: [selectedObservation, selectedTrial] });

  const paired = comparison.points.filter((point) => point.x !== null);
  const isLine = form === "line" && lines.length > 0;
  const byOrder = !isLine && paired.length === 0;
  const placed = isLine ? lines.flatMap((series) => series.map(({ point }) => point)) : byOrder ? comparison.points : paired;
  const unplaced = isLine || byOrder ? [] : comparison.points.filter((point) => point.x === null);
  const linePoints = isLine ? lines.flat() : [];
  const sequenceById = new Map(linePoints.map(({ point, sequence }) => [point.observation_id, sequence]));
  const seriesByTrial = new Map((isLine ? lines : []).map((series, index) => [series[0]!.point.trial_id, index]));
  const xTicks = isLine ? [...new Set(sequenceById.values())].sort((a, b) => a - b)
    : byOrder ? [] : niceTicks(Math.max(0, ...paired.map((point) => point.x as number)) * 1.08 || 1);
  const yTicks = niceTicks(Math.max(0, ...comparison.points.map((point) => point.y)) * 1.1 || 1);
  const xMin = xTicks[0] ?? 0;
  const xMax = xTicks[xTicks.length - 1] ?? 1;
  const yMax = yTicks[yTicks.length - 1] ?? 1;
  const sx = (v: number) => M.l + ((v - xMin) / (xMax - xMin)) * (W - M.l - M.r);
  const sy = (v: number) => H - M.b - (v / yMax) * (H - M.t - M.b);
  const xTitle = isLine ? "Reported segment sequence" : byOrder ? "Observation order"
    : `${conditionLabel(comparison.x_condition ?? "")} (${comparison.x_unit ?? "no unit"})`;
  const yTitle = `${metricLabel(comparison.metric)} (${comparison.unit})`;
  const barWidth = byOrder ? Math.min(12, (W - M.l - M.r) / Math.max(placed.length, 1) * 0.75) : 12;

  // Repeated observations at the same x share a column; offset them slightly so both stay clickable.
  const stack = new Map<string, number>();
  const offsets = new Map<string, number>();
  for (const point of isLine || byOrder ? [] : placed) {
    const key = `${point.x}:${point.y}`;
    const n = stack.get(key) ?? 0;
    stack.set(key, n + 1);
    offsets.set(point.observation_id, n * 7);
  }

  const onKey = (event: KeyboardEvent, id: string) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(id); }
  };

  return <figure className="chart" ref={figure}>
    <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`${form === "bars" ? "Bar" : isLine ? "Line" : "Scatter"} chart: ${yTitle} vs ${xTitle}. ${placed.length} observations.`}>
      <g className="axis" aria-hidden="true">
        {xTicks.map((t) => <g key={`x${t}`}><line x1={sx(t)} x2={sx(t)} y1={M.t} y2={H - M.b} /><text x={sx(t)} y={H - M.b + 16} textAnchor="middle">{fmt(t)}</text></g>)}
        {yTicks.map((t) => <g key={`y${t}`}><line x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} /><text x={M.l - 8} y={sy(t) + 3.5} textAnchor="end">{fmt(t)}</text></g>)}
        <text className="axis-title" x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle">{xTitle}</text>
        <text className="axis-title" transform={`translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle">{yTitle}</text>
      </g>
      {isLine && <g aria-hidden="true">
        {lines.flatMap((series, seriesIndex) => series.slice(1).map(({ point, sequence }, index) => {
          const previous = series[index]!;
          return sequence === previous.sequence + 1 && <line key={point.observation_id} className="pt-line" data-series={seriesIndex % 4}
            x1={sx(previous.sequence)} y1={sy(previous.point.y)} x2={sx(sequence)} y2={sy(point.y)} />;
        }))}
      </g>}
      {placed.map((point, index) => {
        const selected = point.observation_id === selectedObservation;
        const sameTrial = !selected && point.trial_id === selectedTrial;
        const sequence = sequenceById.get(point.observation_id);
        const x = sequence !== undefined ? sx(sequence) : byOrder
          ? M.l + ((index + 0.5) / placed.length) * (W - M.l - M.r)
          : sx(point.x as number) + (offsets.get(point.observation_id) ?? 0);
        const y = sy(point.y);
        const lead = sequence !== undefined ? `Segment ${sequence}, ` : byOrder ? "" : `${fmt(point.x)} ${comparison.x_unit ?? ""}, `;
        const label = `${shortId(point.observation_id)} · ${shortId(point.trial_id)}: ${lead}${fmt(point.y)} ${comparison.unit}`;
        const pick = { onClick: () => onSelect(point.observation_id), onKeyDown: (event: KeyboardEvent) => onKey(event, point.observation_id) };
        return <g key={point.observation_id} className="pt" data-selected={selected} data-related={sameTrial}
          data-series={(seriesByTrial.get(point.trial_id) ?? groupIndex.get(point.group_id) ?? 0) % 4}>
          {selected && <circle className="pt-ring" cx={x} cy={y} r={12} />}
          {form === "bars" && point.y > 0
            ? <rect className="pt-bar" x={x - barWidth / 2} y={y} width={barWidth} height={sy(0) - y} rx={2} tabIndex={0} role="button"
              aria-pressed={selected} aria-label={label} {...pick} />
            : <circle className="pt-dot" cx={x} cy={y} r={selected ? 6.5 : 5.5} tabIndex={0} role="button"
              aria-pressed={selected} aria-label={label} {...pick} />}
        </g>;
      })}
    </svg>
    {byOrder && <figcaption className="unplaced">The horizontal position shows observation order because no numeric X values are available.</figcaption>}
    {isLine && <figcaption className="unplaced">Lines connect consecutive reported segments of the same trial. Sequence does not measure time.</figcaption>}
    {unplaced.length > 0 && <figcaption className="unplaced">
      <span className="cap">No X-axis value ({unplaced.length})</span>
      {unplaced.map((point) => <button type="button" key={point.observation_id} className="chip" aria-pressed={point.observation_id === selectedObservation}
        onClick={() => onSelect(point.observation_id)}>{shortId(point.observation_id)} · {fmt(point.y)} {comparison.unit}</button>)}
    </figcaption>}
  </figure>;
}
