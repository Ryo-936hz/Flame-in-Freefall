import { useId, useMemo, useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/motion";
import type { RankingRequest } from "../lib/client";
import { CONDITIONS, HABITATS, METRICS, ROLE_LABELS, activeHabitat, applyHabitat, buildRanking, describeRanking } from "../lib/filters";
import type { BriefDraft, ConditionKey, ConditionRole } from "../lib/filters";
import { Panel } from "./ui";
import Select from "./Select";
import type { SelectOption } from "./Select";

const ROLES: ConditionRole[] = ["off", "match", "similar", "vary"];
const ROLE_OPTIONS: SelectOption[] = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));
const METRIC_OPTIONS: SelectOption[] = METRICS.map((metric) => ({ value: metric.key, label: metric.label }));
const PRESET_GRAVITY = [...new Set(HABITATS.map((habitat) => habitat.gravity))];

/**
 * Categorical values offered for a condition: those present in the active corpus,
 * plus preset gravity labels and the current value, which are marked when the
 * corpus does not contain them (they cannot match until it does).
 */
function valueOptions(key: ConditionKey, current: string, inCorpus: string[]): SelectOption[] {
  const extra = key === "gravity_regime" ? PRESET_GRAVITY : [];
  const values = [...new Set([...inCorpus, ...extra, ...(current.trim() ? [current.trim()] : [])])];
  return values.map((value) => ({ value, label: value, hint: inCorpus.includes(value) ? undefined : "not in corpus" }));
}

export default function MissionBrief({ draft, onChange, onSubmit, onReset, busy, suggestions }: {
  draft: BriefDraft;
  onChange: (draft: BriefDraft) => void;
  onSubmit: (request: RankingRequest) => void;
  onReset: () => void;
  busy: boolean;
  /** Categorical values present in the active corpus, for datalist hints. */
  suggestions: Partial<Record<ConditionKey, string[]>>;
}) {
  const coverageId = useId();
  const metricId = useId();
  const built = useMemo(() => buildRanking(draft), [draft]);
  const setCondition = (key: ConditionKey, patch: Partial<BriefDraft["conditions"][ConditionKey]>) =>
    onChange({ ...draft, conditions: { ...draft.conditions, [key]: { ...draft.conditions[key], ...patch } } });
  const canSubmit = !busy && built.request !== null && draft.question.trim().length >= 3;
  const form = useRef<HTMLFormElement>(null);
  const roles = CONDITIONS.map(({ key }) => draft.conditions[key].role).join("|");
  const previous = useRef(roles);
  // A value field that just appeared drops in; the rest of the form stays still.
  useGSAP(() => {
    const before = previous.current.split("|");
    previous.current = roles;
    if (prefersReducedMotion()) return;
    CONDITIONS.forEach(({ key }, index) => {
      const was = before[index];
      const now = draft.conditions[key].role;
      const shown = (role?: string) => role === "match" || role === "similar";
      if (!shown(was) && shown(now)) gsap.from(`[data-cond="${key}"] .input, [data-cond="${key}"] .cond-value`,{ height: 0, opacity: 0, y: -6, duration: 0.4, ease: "expo.out", clearProps: "height,opacity,transform" });
    });
  }, { scope: form, dependencies: [roles] });

  return <Panel id="brief" title="Mission Brief" className="brief">
    <form ref={form} className="panel-b" onSubmit={(event) => { event.preventDefault(); if (canSubmit && built.request) onSubmit(built.request); }}>
      <label className="field">
        <span className="cap">Question</span>
        <textarea value={draft.question} rows={3} maxLength={4000}
          onChange={(event) => onChange({ ...draft, question: event.target.value })}
          onKeyDown={(event) => {
            // Ctrl/Cmd + Enter runs the investigation without leaving the keyboard.
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
          }} />
        <small className="hint">The filters below drive the analysis; written constraints are not interpreted.</small>
      </label>

      <div className="field">
        <span className="cap">Habitat presets</span>
        <div className="presets" role="group" aria-label="Habitat presets"
          title="Fills gravity, O₂ and pressure. Gravity must exist in the data to match.">
          {HABITATS.map((h) => <button type="button" key={h.id} className="preset" aria-pressed={activeHabitat(draft) === h.id}
            onClick={() => onChange(applyHabitat(draft, h.id))}>
            {h.label}<small>{h.note}</small>
          </button>)}
        </div>
      </div>

      <fieldset className="conditions">
        <legend className="cap">Conditions</legend>
        {CONDITIONS.map((meta) => {
          const { key, label, unit, numeric } = meta;
          const range = "range" in meta ? meta.range : undefined;
          const condition = draft.conditions[key];
          const error = built.errors[key];
          const needsValue = condition.role === "match" || condition.role === "similar";
          return <div className="cond" key={key} data-cond={key} data-role={condition.role}>
            <label className="cond-name" htmlFor={`role-${key}`}>{label}{unit && <span className="unit"> {unit}</span>}</label>
            <Select id={`role-${key}`} value={condition.role} options={ROLE_OPTIONS}
              onChange={(role) => setCondition(key, { role: role as ConditionRole })} />
            {needsValue && <>
              {numeric
                ? <input aria-label={`Value for ${label}`} className="input" value={condition.value} inputMode="decimal"
                  aria-invalid={Boolean(error)} aria-describedby={error ? `err-${key}` : undefined} placeholder="0"
                  onChange={(event) => setCondition(key, { value: event.target.value })} />
                : <Select ariaLabel={`Value for ${label}`} className="cond-value" value={condition.value}
                  options={valueOptions(key, condition.value, suggestions[key] ?? [])} placeholder="Choose a value"
                  invalid={Boolean(error)} describedBy={error ? `err-${key}` : undefined}
                  onChange={(value) => setCondition(key, { value })} />}
              {range && (() => {
                const parsed = Number(condition.value.replace(",", "."));
                const current = condition.value.trim() !== "" && Number.isFinite(parsed) ? Math.min(range.max, Math.max(range.min, parsed)) : range.min;
                const p = ((current - range.min) / (range.max - range.min)) * 100;
                return <div className="cond-slider">
                  <input type="range" aria-label={`${label} slider`} min={range.min} max={range.max} step={range.step} value={current}
                    style={{ ["--p" as string]: `${p}%` }}
                    onChange={(event) => setCondition(key, { value: event.target.value })} />
                  <span className="ticks" aria-hidden="true"><span>{range.min}</span><span>{(range.min + range.max) / 2}</span><span>{range.max}{unit ? ` ${unit}` : ""}</span></span>
                </div>;
              })()}
            </>}
            {error && <p className="field-error" id={`err-${key}`}>{error}</p>}
          </div>;
        })}
      </fieldset>

      <div className="field-row">
        <div className="field">
          <label className="cap" htmlFor={metricId}>Metric</label>
          <Select id={metricId} value={draft.metric} options={METRIC_OPTIONS}
            onChange={(metric) => onChange({ ...draft, metric: metric as BriefDraft["metric"] })} />
        </div>
        <label className="field">
          <span className="cap">Max. trials</span>
          <input className="input" type="number" min={1} max={50} value={draft.limit}
            onChange={(event) => onChange({ ...draft, limit: Math.min(50, Math.max(1, Number(event.target.value) || 1)) })} />
        </label>
      </div>
      <div className="field">
        <span className="field-top"><label className="cap" htmlFor={coverageId}>Minimum coverage</label><output className="num" htmlFor={coverageId}>{Math.round(draft.minimumCoverage * 100)}%</output></span>
        <input id={coverageId} type="range" min={0} max={1} step={0.05} value={draft.minimumCoverage}
          aria-valuetext={`${Math.round(draft.minimumCoverage * 100)}%`}
          style={{ ["--p" as string]: `${draft.minimumCoverage * 100}%` }}
          onChange={(event) => onChange({ ...draft, minimumCoverage: Number(event.target.value) })} />
      </div>
      <label className="check">
        <input type="checkbox" checked={draft.allowSynthetic} onChange={(event) => onChange({ ...draft, allowSynthetic: event.target.checked })} />
        <span>Include synthetic demo data <small>(not NASA measurements)</small></span>
      </label>

      {built.request && (() => {
        const lines = describeRanking(built.request);
        return <details className="interpreted">
          <summary className="cap">Filters to be sent ({lines.length})</summary>
          <ul aria-live="polite">{lines.map((line) => <li key={line}>{line}</li>)}</ul>
        </details>;
      })()}

      <div className="actions brief-actions">
        {Object.keys(built.errors).length > 0 && <p className="field-error brief-error" role="status">Fix the highlighted condition to investigate.</p>}
        <button type="submit" className="btn primary" disabled={!canSubmit} aria-keyshortcuts="Control+Enter">{busy ? "Investigating…" : "Investigate"}</button>
        <button type="button" className="btn" onClick={onReset} disabled={busy}>Reset filters</button>
        <span className="kbd-hint" aria-hidden="true">Ctrl + Enter</span>
      </div>
    </form>
  </Panel>;
}
