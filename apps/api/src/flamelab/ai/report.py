from flamelab.domain.contracts import ResearchResponse


def render_report(run: ResearchResponse) -> str:
    lines = ["# FlameLab SI — informe de investigación", "", f"ID: {run.id}",
             f"Fecha UTC: {run.created_at.isoformat()}", f"Proveedor configurado: {run.provider}",
             f"Estado: {run.status}", f"Corpus: {run.ranking.dataset_id}", "",
             "## Pregunta", "", run.question, "", "## Síntesis", "", run.summary, ""]
    if any(item.provenance == "synthetic" for item in run.ranking.items):
        lines += ["**DATOS SINTÉTICOS — no mediciones NASA.**", ""]
    lines += ["## Afirmaciones", ""]
    for claim in run.claims:
        lines += [f"- [{claim.kind}] {claim.text} Referencias: " + ", ".join(c.evidence_id for c in claim.citations)]
    if run.comparison:
        lines += ["", "## Comparación calculada", "", f"Y: {run.comparison.metric} ({run.comparison.unit}); X: {run.comparison.x_condition} ({run.comparison.x_unit}).", ""]
        for group in run.comparison.groups:
            stages = f"{group.n_condition_stages} condition stages; " if group.n_condition_stages else ""
            lines += [f"- {group.id}: {group.n_trials} ensayos; {stages}{group.n_observations} observaciones; {group.n_independent_units} unidades independientes; mediana={group.median}; sin intervalo."]
    lines += ["", "## Evidencia", ""]
    for item in run.evidence:
        lines += [f"- {item.id} [{item.provenance}, reviewed={item.reviewed}]: {item.title}. {item.locator}. Fuente: {item.source_url or 'fixture local; sin fuente NASA'}. Texto: {item.text}"]
    lines += ["", "## Propuestas de investigación", ""]
    for item in run.hypotheses:
        lines += [f"- [{item.label}] {item.statement} Siguiente medición: {item.next_measurement} Refutación: {item.falsification}"]
    lines += ["", "## Límites", "", *[f"- {warning}" for warning in run.warnings], "",
              "Expediente persistido con snapshot del corpus; eventos disponibles como reproducción, no streaming en vivo.", ""]
    return "\n".join(lines)
