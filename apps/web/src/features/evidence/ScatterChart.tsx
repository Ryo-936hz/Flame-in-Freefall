import type { KeyboardEvent } from "react";
import type { Models } from "../../lib/client";
import { conditionLabel, metricLabel } from "../../lib/filters";
import { fmt, shortId } from "../../lib/format";

type Comparison = Models["ComparisonResponse"];
export type ChartStyle = "chart" | "lines" | "bars" | "table";

export function segmentSeries(comparison: Comparison, trials: Models["Trial"][]) {
  const sequences = new Map(trials.flatMap((trial) => (trial.segments ?? []).map((segment) => [segment.id, segment.sequence] as const)));
  const series = new Map<string, { point: Comparison["points"][number]; sequence: number }[]>();
  for (const point of comparison.points) {
    const sequence = point.segment_id ? sequences.get(point.segment_id) : undefined;
    if (sequence === undefined) continue;
    const group = series.get(point.trial_id) ?? [];
    group.push({ point, sequence });
    series.set(point.trial_id, group);
  }
  return [...series.values()].filter((points) => points.length > 1 && new Set(points.map(({ sequence }) => sequence)).size === points.length)
    .map((points) => points.sort((a, b) => a.sequence - b.sequence))
    .filter((points) => points.some(({ sequence }, index) => index > 0 && sequence === points[index - 1]!.sequence + 1));
}

const W = 640;
const H = 300;
const M = { l: 58, r: 18, t: 16, b: 46 };

function niceTicks(values: number[], includeZero: boolean): number[] {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const margin = (high - low || Math.abs(high) || 1) * 0.12;
  const min = includeZero ? Math.min(0, low) : low - margin;
  const max = includeZero ? Math.max(0, high) + margin : high + margin;
  const raw = ((max - min) || 1) / 5;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= raw) ?? raw;
  const first = Math.floor(min / step);
  const last = Math.max(first + 1, Math.ceil(max / step));
  return Array.from({ length: last - first + 1 }, (_, index) => Number(((first + index) * step).toPrecision(12)));
}

/**
 * Plots the points returned by the API exactly: x/y values, units and groups
 * come from the comparison response. With no measured x values, use the
 * observation order to display the metric without implying a second measurement.
 */
export default function ScatterChart({ comparison, groupIndex, selectedObservation, selectedTrial, onSelect, lines }: {
  comparison: Comparison;
  groupIndex: Map<string, number>;
  selectedObservation: string | null;
  selectedTrial: string | null;
  onSelect: (observationId: string) => void;
  lines?: ReturnType<typeof segmentSeries>;
}) {
  const paired = comparison.points.filter((point) => point.x != null);
  const metricOnly = !lines && paired.length === 0;
  const sequenceById = new Map(lines?.flatMap((series) => series.map(({ point, sequence }) => [point.observation_id, sequence] as const)));
  const seriesByTrial = new Map(lines?.map((series, index) => [series[0]!.point.trial_id, index] as const));
  const placed = lines ? lines.flatMap((series) => series.map(({ point }) => point)) : metricOnly ? comparison.points : paired;
  const unplaced = metricOnly || lines ? [] : comparison.points.filter((point) => point.x == null);
  const xTicks = lines ? [...new Set(sequenceById.values())].sort((a, b) => a - b) : metricOnly ? [] : niceTicks(paired.map((point) => point.x as number), false);
  const yTicks = niceTicks(placed.map((point) => point.y), true);
  const xMin = xTicks[0] ?? 0;
  const yMin = yTicks[0] ?? 0;
  const xMax = xTicks[xTicks.length - 1] ?? 1;
  const yMax = yTicks[yTicks.length - 1] ?? 1;
  const sx = (v: number) => M.l + ((v - xMin) / (xMax - xMin)) * (W - M.l - M.r);
  const sy = (v: number) => H - M.b - ((v - yMin) / (yMax - yMin)) * (H - M.t - M.b);
  const xTitle = lines ? "Reported segment sequence" : metricOnly ? "Observation order" : `${conditionLabel(comparison.x_condition ?? "")} (${comparison.x_unit ?? "no unit"})`;
  const yTitle = `${metricLabel(comparison.metric)} (${comparison.unit})`;

  const onKey = (event: KeyboardEvent, id: string) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(id); }
  };

  return <figure className="chart">
    <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`${lines ? "Line" : "Scatter"} chart: ${yTitle} vs ${xTitle}. ${placed.length} points.`}>
      <g className="axis" aria-hidden="true">
        <path className="chart-baseline" d={`M${M.l} ${M.t}V${H - M.b}H${W - M.r}`} />
        {xTicks.map((t) => <g key={`x${t}`}><line x1={sx(t)} x2={sx(t)} y1={H - M.b} y2={H - M.b + 5} /><text x={sx(t)} y={H - M.b + 19} textAnchor="middle">{fmt(t)}</text></g>)}
        {yTicks.map((t) => <g key={`y${t}`}><line x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} /><text x={M.l - 8} y={sy(t) + 3.5} textAnchor="end">{fmt(t)}</text></g>)}
        <text className="axis-title" x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle">{xTitle}</text>
        <text className="axis-title" transform={`translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle">{yTitle}</text>
      </g>
      {lines?.map((series, seriesIndex) => <g className="chart-series-line" data-series={seriesIndex % 4} key={series[0]!.point.trial_id} aria-hidden="true">
        {series.slice(1).map(({ point, sequence }, index) => {
          const previous = series[index]!;
          return sequence === previous.sequence + 1 && <line key={point.observation_id} x1={sx(previous.sequence)} y1={sy(previous.point.y)} x2={sx(sequence)} y2={sy(point.y)} />;
        })}
      </g>)}
      {placed.map((point, index) => {
        const selected = point.observation_id === selectedObservation;
        const sameTrial = !selected && point.trial_id === selectedTrial;
        const seq = sequenceById.get(point.observation_id);
        const x = seq !== undefined ? sx(seq) : metricOnly
          ? M.l + ((index + 0.5) / placed.length) * (W - M.l - M.r)
          : sx(point.x as number);
        const y = sy(point.y);
        const coordinates = seq !== undefined ? `Segment ${seq}, ${fmt(point.y)} ${comparison.unit}` : metricOnly
          ? `${fmt(point.y)} ${comparison.unit}`
          : `${fmt(point.x)} ${comparison.x_unit ?? ""}, ${fmt(point.y)} ${comparison.unit}`;
        return <g key={point.observation_id} className="pt" data-selected={selected} data-related={sameTrial}
          data-series={(seriesByTrial.get(point.trial_id) ?? groupIndex.get(point.group_id) ?? 0) % 4}>
          {selected && <circle className="pt-ring" cx={x} cy={y} r={12} />}
          <circle className="pt-dot" cx={x} cy={y} r={selected ? 6.5 : 5.5} tabIndex={0} role="button"
            aria-pressed={selected}
            aria-label={`${shortId(point.observation_id)} · ${shortId(point.trial_id)}: ${coordinates}`}
            onClick={() => onSelect(point.observation_id)} onKeyDown={(event) => onKey(event, point.observation_id)}>
            <title>{`${shortId(point.trial_id)} · ${coordinates}`}</title>
          </circle>
        </g>;
      })}
    </svg>
    {lines && <figcaption className="unplaced">Lines connect consecutive reported segments of the same trial. Segment sequence is not elapsed time.</figcaption>}
    {metricOnly && <figcaption className="unplaced">The horizontal position shows observation order because the comparison has no numeric X values.</figcaption>}
    {unplaced.length > 0 && <figcaption className="unplaced">
      <span className="cap">No X-axis value ({unplaced.length})</span>
      {unplaced.map((point) => <button type="button" key={point.observation_id} className="chip" aria-pressed={point.observation_id === selectedObservation}
        onClick={() => onSelect(point.observation_id)}>{shortId(point.observation_id)} · {fmt(point.y)} {comparison.unit}</button>)}
    </figcaption>}
  </figure>;
}
