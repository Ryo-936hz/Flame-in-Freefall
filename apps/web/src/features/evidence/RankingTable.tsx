import { Fragment, useState } from "react";
import type { Models } from "../../lib/client";
import { conditionLabel, conditionValueLabel } from "../../lib/filters";
import { ELIGIBILITY_LABEL, contributionNote, fmt, pct, reasonText, shortId } from "../../lib/format";
import { ProvenanceTag } from "../../components/ui";

type Ranked = Models["RankedTrial"];

function Row({ item, position, label, selected, onSelect }: {
  item: Ranked; position: number | null; label: string | undefined; selected: boolean; onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  return <Fragment>
    <tr className="row" data-selected={selected} data-eligibility={item.eligibility}>
      <td className="num muted">{position === null ? "—" : String(position).padStart(2, "0")}</td>
      <td>
        <button type="button" className="row-link" title={item.trial_id} aria-pressed={selected} onClick={onSelect}>
          <b>{label ?? shortId(item.trial_id)}</b>
          <ProvenanceTag value={item.provenance} />
        </button>
      </td>
      <td className="num big">{item.similarity === null || item.similarity === undefined ? <span className="muted" title="Only computed for eligible trials">—</span> : fmt(item.similarity)}</td>
      <td>
        <span className="cov"><span className="cov-bar"><i style={{ transform: `scaleX(${item.coverage})` }} /></span><span className="num">{pct(item.coverage)}</span></span>
      </td>
      <td><span className="elig" data-eligibility={item.eligibility}>{ELIGIBILITY_LABEL[item.eligibility]}</span></td>
      <td><ul className="reasons">{item.reasons.map((reason) => <li key={reason}>{reasonText(reason)}</li>)}</ul></td>
      <td>
        <button type="button" className="btn ghost" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : "Breakdown"}</button>
      </td>
    </tr>
    {open && <tr className="detail-row"><td colSpan={7}>
      <table className="sub">
        <thead><tr><th>Condition</th><th>Target</th><th>Candidate</th><th>Weight</th><th>Distance</th><th>Note</th></tr></thead>
        <tbody>{item.contributions.map((c) => <tr key={c.variable}>
          <td>{conditionLabel(c.variable)}</td><td className="num">{conditionValueLabel(c.variable, c.target)}</td><td className="num">{conditionValueLabel(c.variable, c.candidate)}</td>
          <td className="num">{fmt(c.weight)}</td><td className="num">{fmt(c.distance)}</td><td>{contributionNote(c.note)}</td>
        </tr>)}</tbody>
      </table>
    </td></tr>}
  </Fragment>;
}

export default function RankingTable({ ranking, labels, selectedTrial, onSelect }: {
  ranking: Models["RankingResponse"];
  labels: Map<string, string>;
  selectedTrial: string | null;
  onSelect: (trialId: string) => void;
}) {
  const [showExcluded, setShowExcluded] = useState(false);
  const head = <thead><tr><th>#</th><th>Trial</th><th>Similarity</th><th>Coverage</th><th>Status</th><th>Reasons</th><th><span className="sr-only">Detail</span></th></tr></thead>;
  return <div className="ranking">
    <div className="table-wrap">
      <table className="data">
        <caption className="sr-only">Eligible trials ordered by similarity</caption>
        {head}
        <tbody>
          {ranking.items.map((item, index) => <Row key={item.trial_id} item={item} position={index + 1} label={labels.get(item.trial_id)}
            selected={selectedTrial === item.trial_id} onSelect={() => onSelect(item.trial_id)} />)}
          {!ranking.items.length && <tr><td colSpan={7} className="muted">No trial meets the filters and minimum coverage.</td></tr>}
        </tbody>
      </table>
    </div>
    {ranking.excluded.length > 0 && <div className="excluded">
      <button type="button" className="btn ghost" aria-expanded={showExcluded} onClick={() => setShowExcluded(!showExcluded)}>
        {showExcluded ? "Hide" : "Show"} excluded and indeterminate ({ranking.excluded.length})
      </button>
      {showExcluded && <div className="table-wrap"><table className="data">
        <caption className="sr-only">Excluded or indeterminate trials and their reason</caption>
        {head}
        <tbody>{ranking.excluded.map((item) => <Row key={item.trial_id} item={item} position={null} label={labels.get(item.trial_id)}
          selected={selectedTrial === item.trial_id} onSelect={() => onSelect(item.trial_id)} />)}</tbody>
      </table></div>}
    </div>}
  </div>;
}
