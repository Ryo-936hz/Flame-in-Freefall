import { useMemo } from "react";
import type { RankingRequest } from "../lib/client";
import { CONDITIONS, METRICS, ROLE_LABELS, buildRanking, describeRanking } from "../lib/filters";
import type { BriefDraft, ConditionKey, ConditionRole } from "../lib/filters";
import { Panel } from "./ui";

const ROLES: ConditionRole[] = ["off", "match", "similar", "vary"];

export default function MissionBrief({ draft, onChange, onSubmit, onReset, busy, suggestions }: {
  draft: BriefDraft;
  onChange: (draft: BriefDraft) => void;
  onSubmit: (request: RankingRequest) => void;
  onReset: () => void;
  busy: boolean;
  /** Categorical values present in the active corpus, for datalist hints. */
  suggestions: Partial<Record<ConditionKey, string[]>>;
}) {
  const built = useMemo(() => buildRanking(draft), [draft]);
  const setCondition = (key: ConditionKey, patch: Partial<BriefDraft["conditions"][ConditionKey]>) =>
    onChange({ ...draft, conditions: { ...draft.conditions, [key]: { ...draft.conditions[key], ...patch } } });
  const canSubmit = !busy && built.request !== null && draft.question.trim().length >= 3;

  return <Panel id="brief" title="Mission Brief" className="brief">
    <form className="panel-b" onSubmit={(event) => { event.preventDefault(); if (canSubmit && built.request) onSubmit(built.request); }}>
      <label className="field">
        <span className="cap">Question</span>
        <textarea value={draft.question} rows={3} maxLength={4000}
          onChange={(event) => onChange({ ...draft, question: event.target.value })} />
        <small className="hint">Shown with the synthesis. The filters below drive the analysis; the demo does not interpret written constraints.</small>
      </label>

      <fieldset className="conditions">
        <legend className="cap">Conditions</legend>
        {CONDITIONS.map(({ key, label, unit, numeric }) => {
          const condition = draft.conditions[key];
          const error = built.errors[key];
          const needsValue = condition.role === "match" || condition.role === "similar";
          return <div className="cond" key={key} data-role={condition.role}>
            <label className="cond-name" htmlFor={`role-${key}`}>{label}{unit && <span className="unit"> {unit}</span>}</label>
            <select id={`role-${key}`} className="select" value={condition.role}
              onChange={(event) => setCondition(key, { role: event.target.value as ConditionRole })}>
              {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
            </select>
            {needsValue && <>
              <input aria-label={`Value for ${label}`} className="input" value={condition.value}
                inputMode={numeric ? "decimal" : "text"} list={numeric ? undefined : `values-${key}`}
                aria-invalid={Boolean(error)} aria-describedby={error ? `err-${key}` : undefined}
                placeholder={numeric ? "0" : "value"}
                onChange={(event) => setCondition(key, { value: event.target.value })} />
              {!numeric && <datalist id={`values-${key}`}>{(suggestions[key] ?? []).map((value) => <option key={value} value={value} />)}</datalist>}
            </>}
            {error && <p className="field-error" id={`err-${key}`}>{error}</p>}
          </div>;
        })}
      </fieldset>

      <div className="field-row">
        <label className="field">
          <span className="cap">Metric</span>
          <select className="select" value={draft.metric} onChange={(event) => onChange({ ...draft, metric: event.target.value as BriefDraft["metric"] })}>
            {METRICS.map((metric) => <option key={metric.key} value={metric.key}>{metric.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="cap">Max. trials</span>
          <input className="input" type="number" min={1} max={50} value={draft.limit}
            onChange={(event) => onChange({ ...draft, limit: Math.min(50, Math.max(1, Number(event.target.value) || 1)) })} />
        </label>
      </div>
      <label className="field">
        <span className="field-top"><span className="cap">Minimum coverage</span><output className="num">{Math.round(draft.minimumCoverage * 100)}%</output></span>
        <input type="range" min={0} max={1} step={0.05} value={draft.minimumCoverage}
          style={{ ["--p" as string]: `${draft.minimumCoverage * 100}%` }}
          onChange={(event) => onChange({ ...draft, minimumCoverage: Number(event.target.value) })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={draft.allowSynthetic} onChange={(event) => onChange({ ...draft, allowSynthetic: event.target.checked })} />
        <span>Include synthetic demo data <small>(not NASA measurements)</small></span>
      </label>

      {built.request && <div className="interpreted" aria-live="polite">
        <p className="cap">Filters to be sent</p>
        <ul>{describeRanking(built.request).map((line) => <li key={line}>{line}</li>)}</ul>
      </div>}

      <div className="actions">
        <button type="submit" className="btn primary" disabled={!canSubmit}>{busy ? "Investigating…" : "Investigate"}</button>
        <button type="button" className="btn" onClick={onReset} disabled={busy}>Reset demo query</button>
      </div>
    </form>
  </Panel>;
}
