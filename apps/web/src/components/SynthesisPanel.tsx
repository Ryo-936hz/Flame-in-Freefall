import type { ResearchResponse } from "../lib/client";
import { shortId } from "../lib/format";
import { tx } from "../lib/backendText";
import { Panel, Tag } from "./ui";
import { WorkspaceWarnings } from "../features/evidence/EvidenceCanvas";
import "../features/evidence/workspace.css";

const KIND = { finding: "Finding", inference: "Inference", limitation: "Limitation" } as const;
const STAGE = { plan: "Plan", retrieve: "Retrieve", analyze: "Analyze", review: "Review", complete: "Complete", error: "Error" } as const;

/** Claims retain their kind; hypotheses and saved tool activity are separate. */
export default function SynthesisPanel({ result, onCite }: { result: ResearchResponse; onCite: (evidenceId: string, trialId: string | null) => void }) {
  return <Panel id="synthesis" title="Findings and limits" className="synthesis workspace-findings"
    meta={<Tag tone={result.provider === "demo" ? "neutral" : "signal"}>{result.provider === "demo" ? "Deterministic coordinator · no LLM" : `External synthesis · ${result.provider}`}</Tag>}>
    <div className="panel-b">
      <section aria-labelledby="claims-title">
        <h3 id="claims-title">Claims</h3>
        {result.claims.length ? <ol className="claims">{result.claims.map((claim, index) => <li key={index}>
          <Tag tone={claim.kind === "limitation" ? "warn" : "neutral"}>{KIND[claim.kind]}</Tag>
          <p>{tx(claim.text)}</p>
          {claim.citations.length > 0 && <details className="workspace-more" data-claim-sources>
            <summary>Sources ({claim.citations.length})</summary>
            <div className="cites">{claim.citations.map((citation, i) => <button type="button" key={i} className="chip"
              onClick={() => onCite(citation.evidence_id, citation.trial_id ?? null)}>{shortId(citation.evidence_id)}</button>)}</div>
          </details>}
        </li>)}</ol> : <p className="muted">No claims: the evidence does not support any.</p>}
      </section>

      <WorkspaceWarnings result={result}
        warnings={[...result.warnings, ...(result.comparison?.groups.flatMap((group) => group.warnings) ?? [])]}
        title="Warnings" label="Findings warnings" />

      {result.hypotheses.length > 0 && <section className="workspace-hypotheses" aria-label="Hypotheses">
        <h3>Hypotheses</h3>
        {result.hypotheses.map((hypothesis) => <article key={hypothesis.id} className="hypo">
          <Tag tone="warn">{hypothesis.label === "prepared_demo_hypothesis" ? "Prepared proposal · not a discovery" : "AI hypothesis · unvalidated"}</Tag>
          <p className="hypo-s">{tx(hypothesis.statement)}</p>
          <details className="workspace-more">
            <summary>Rationale and next measurement</summary>
            <dl>
              <div><dt>Rationale</dt><dd>{tx(hypothesis.rationale)}</dd></div>
              <div><dt>Alternative</dt><dd>{tx(hypothesis.alternative_explanation)}</dd></div>
              <div><dt>Next measurement</dt><dd>{tx(hypothesis.next_measurement)}</dd></div>
              <div><dt>Falsification</dt><dd>{tx(hypothesis.falsification)}</dd></div>
            </dl>
          </details>
        </article>)}
      </section>}

      <details className="workspace-disclosure" data-analysis-summary>
        <summary>Analysis summary</summary>
        <p className="summary">{tx(result.summary)}</p>
      </details>

      <details className="workspace-disclosure" data-tool-activity>
        <summary id="activity-title">Tool activity</summary>
        <ol className="events">{result.events.map((event) => <li key={event.sequence} data-stage={event.stage}>
          <span className="num">{String(event.sequence).padStart(2, "0")}</span>
          <span><b>{STAGE[event.stage]}</b> {tx(event.message)}</span>
        </li>)}</ol>
      </details>
    </div>
  </Panel>;
}
