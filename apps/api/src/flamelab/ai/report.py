"""Plain Markdown report with untrusted prose kept as literal content."""

import html
import json
import re

from flamelab.domain.contracts import ResearchResponse


def _inline(value) -> str:
    """Render a field as text, never a new Markdown/HTML structure or link."""
    text = str(value).replace("\r\n", "\n").replace("\r", "\n").replace("\n", " ⏎ ")
    text = html.escape(text, quote=False)
    return re.sub(r"([\\`*_\[\]#|~!])", r"\\\1", text)


def _literal(value) -> list[str]:
    """A source cannot close its fence, including historical arbitrary prose."""
    text = str(value).replace("\r\n", "\n").replace("\r", "\n")
    longest = max((len(match) for match in re.findall(r"`+", text)), default=0)
    fence = "`" * max(3, longest + 1)
    return [fence + "text", text, fence]


def render_report(run: ResearchResponse) -> str:
    lines = ["# FlameLab SI — informe de investigación", "", f"ID: {_inline(run.id)}",
             f"Fecha UTC: {run.created_at.isoformat()}", f"Proveedor configurado: {run.provider}",
             f"Estado: {run.status}", f"Corpus: {_inline(run.ranking.dataset_id)}", "",
             "## Pregunta", "", *_literal(run.question), "", "## Síntesis", "", *_literal(run.summary), ""]
    if run.plan is not None:
        plan = run.plan
        lines += ["## Plan aplicado", "", f"Modo: {plan.planning_mode}; intención: {plan.intent}; bloqueado: {plan.blocked}.",
                  *_literal(plan.message), f"Métrica: {_inline(plan.metric)}; eje X: {_inline(plan.x_condition)}.", "",
                  "Filtros efectivos:", *_literal(json.dumps(plan.ranking.model_dump(mode="json"), ensure_ascii=False, sort_keys=True, indent=2)), "",
                  *[f"- {_inline(limit)}" for limit in plan.limits], ""]
    else:
        lines += ["Plan estructurado no disponible en este expediente histórico.", ""]
    if any(item.provenance == "synthetic" for item in [*run.ranking.items, *run.evidence]):
        lines += ["**DATOS SINTÉTICOS — no mediciones NASA.**", ""]
    lines += ["## Afirmaciones", ""]
    for claim in run.claims:
        lines += [f"- [{claim.kind}] {_inline(claim.text)} Referencias: "
                  + ", ".join(_inline(c.evidence_id) + (f" (ensayo {_inline(c.trial_id)})" if c.trial_id else "")
                              for c in claim.citations)]
    if run.comparison:
        lines += ["", "## Comparación calculada", "", f"Y: {_inline(run.comparison.metric)} ({_inline(run.comparison.unit)}); X: {_inline(run.comparison.x_condition)} ({_inline(run.comparison.x_unit)}).", ""]
        for group in run.comparison.groups:
            segments = f"{group.n_segments} segmentos; " if group.n_segments else ""
            lines += ["Controles:", *_literal(json.dumps(group.conditions, ensure_ascii=False, sort_keys=True))]
            lines += [f"- {_inline(group.id)}: {group.n_trials} ensayos; {segments}{group.n_observations} observaciones; {group.n_independent_units} unidades independientes; mediana={group.median}; sin intervalo."]
            if group.n_trials_with_unresolved_independence:
                lines.append(f"  - Independencia pendiente de comprobar en {group.n_trials_with_unresolved_independence} registros.")
    lines += ["", "## Evidencia", ""]
    for item in run.evidence:
        if item.source_url:
            source = item.source_url
        elif item.provenance == "synthetic":
            source = "fixture local sintético; sin fuente externa"
        else:
            source = "fuente documental local; URL no disponible"
        lines += [f"- {_inline(item.id)} [{item.provenance}, reviewed={item.reviewed}]: {_inline(item.title)}. Fuente: {_inline(source)}.",
                  "", "Localizador de fuente:", *_literal(item.locator), "",
                  "Texto de fuente (contenido no confiable):", *_literal(item.text), ""]
    lines += ["", "## Propuestas de investigación", ""]
    for item in run.hypotheses:
        lines += [f"- [{item.label}] {_inline(item.statement)}", f"  Motivo: {_inline(item.rationale)}",
                  f"  Explicación alternativa: {_inline(item.alternative_explanation)}",
                  f"  Siguiente medición: {_inline(item.next_measurement)}", f"  Refutación: {_inline(item.falsification)}",
                  "  Referencias: " + ", ".join(_inline(ref) for ref in item.evidence_ids)]
    lines += ["", "## Límites", "", *[f"- {_inline(warning)}" for warning in run.warnings], "",
              "Expediente persistido con snapshot del corpus; eventos disponibles como reproducción, no streaming en vivo.", ""]
    return "\n".join(lines)
