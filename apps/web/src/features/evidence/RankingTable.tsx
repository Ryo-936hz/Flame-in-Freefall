import { Fragment, useState } from "react";
import type { Models } from "../../lib/client";
import { conditionLabel } from "../../lib/filters";
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
        <button type="button" className="row-link" aria-pressed={selected} onClick={onSelect}>
          <b>{label ?? shortId(item.trial_id)}</b>
          <span className="id">{item.trial_id}</span>
          <ProvenanceTag value={item.provenance} />
        </button>
      </td>
      <td className="num big">{item.similarity === null || item.similarity === undefined ? <span className="muted" title="Solo se calcula para ensayos elegibles">—</span> : fmt(item.similarity)}</td>
      <td>
        <span className="cov"><span className="cov-bar"><i style={{ transform: `scaleX(${item.coverage})` }} /></span><span className="num">{pct(item.coverage)}</span></span>
      </td>
      <td><span className="elig" data-eligibility={item.eligibility}>{ELIGIBILITY_LABEL[item.eligibility]}</span></td>
      <td><ul className="reasons">{item.reasons.map((reason) => <li key={reason}>{reasonText(reason)}</li>)}</ul></td>
      <td>
        <button type="button" className="btn ghost" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Ocultar" : "Desglose"}</button>
      </td>
    </tr>
    {open && <tr className="detail-row"><td colSpan={7}>
      <table className="sub">
        <thead><tr><th>Condición</th><th>Objetivo</th><th>Candidato</th><th>Peso</th><th>Distancia</th><th>Nota</th></tr></thead>
        <tbody>{item.contributions.map((c) => <tr key={c.variable}>
          <td>{conditionLabel(c.variable)}</td><td className="num">{c.target ?? "—"}</td><td className="num">{c.candidate ?? "—"}</td>
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
  const [showExcluded, setShowExcluded] = useState(true);
  const head = <thead><tr><th>#</th><th>Ensayo</th><th>Similitud</th><th>Cobertura</th><th>Estado</th><th>Razones</th><th><span className="sr-only">Detalle</span></th></tr></thead>;
  return <div className="ranking">
    <div className="table-wrap">
      <table className="data">
        <caption className="sr-only">Ensayos elegibles ordenados por similitud</caption>
        {head}
        <tbody>
          {ranking.items.map((item, index) => <Row key={item.trial_id} item={item} position={index + 1} label={labels.get(item.trial_id)}
            selected={selectedTrial === item.trial_id} onSelect={() => onSelect(item.trial_id)} />)}
          {!ranking.items.length && <tr><td colSpan={7} className="muted">Ningún ensayo cumple los filtros y la cobertura mínima.</td></tr>}
        </tbody>
      </table>
    </div>
    {ranking.excluded.length > 0 && <div className="excluded">
      <button type="button" className="btn ghost" aria-expanded={showExcluded} onClick={() => setShowExcluded(!showExcluded)}>
        {showExcluded ? "Ocultar" : "Mostrar"} excluidos e indeterminados ({ranking.excluded.length})
      </button>
      {showExcluded && <div className="table-wrap"><table className="data">
        <caption className="sr-only">Ensayos excluidos o indeterminados y su motivo</caption>
        {head}
        <tbody>{ranking.excluded.map((item) => <Row key={item.trial_id} item={item} position={null} label={labels.get(item.trial_id)}
          selected={selectedTrial === item.trial_id} onSelect={() => onSelect(item.trial_id)} />)}</tbody>
      </table></div>}
    </div>}
  </div>;
}
