from datetime import datetime, timezone
from uuid import uuid4

from pydantic import ValidationError

from flamelab.ai.planner import plan_research
from flamelab.ai.provider import ProviderFailure, synthesize
from flamelab.ai.review import NarrativeReviewError, review_narrative, summary_conflicts
from flamelab.config import Settings
from flamelab.domain.contracts import (
    CONDITION_UNITS, METRIC_STUDIES, ActivityEvent, Citation, Claim, ComparisonRequest,
    DatasetBundle, Hypothesis, Panel, RankingResponse, ResearchRequest, ResearchResponse,
)
from flamelab.science.comparison import compare_trials
from flamelab.science.profiling import profile_dataset
from flamelab.science.ranking import rank_trials

TOOL_CATALOG = ("profile_dataset", "rank_trials", "compare_trials", "retrieve_evidence")


async def run_research(request: ResearchRequest, bundle: DatasetBundle, settings: Settings) -> ResearchResponse:
    events = []
    def event(stage, message, ids=None):
        events.append(ActivityEvent(sequence=len(events) + 1, stage=stage, message=message, evidence_ids=ids or []))
    plan = plan_research(request)
    event("plan", plan.message)
    if plan.blocked:
        warning = plan.message
        if plan.intent == "unsupported":
            summary = "La petición queda fuera de las herramientas científicas disponibles; no se ejecutaron cálculos ni se generó una conclusión."
        else:
            summary = "No se ejecutó el análisis porque el plan requiere aclaración antes de aplicar herramientas."
        ranking = RankingResponse(
            dataset_id=bundle.dataset_id, items=[], excluded=[], warnings=[warning],
        )
        event("review", "No se ejecutaron herramientas: el plan está fuera del catálogo o necesita aclaración.")
        event("complete", "Investigación detenida antes del análisis por revisión del plan.")
        return ResearchResponse(
            id=f"research:{uuid4()}", created_at=datetime.now(timezone.utc),
            provider=settings.ai_provider, status="insufficient_evidence",
            question=request.question, summary=summary, claims=[], ranking=ranking,
            comparison=None, evidence=[], hypotheses=[],
            events=events,
            warnings=[warning, "No se solicitó ni se presentó una inferencia de un modelo externo."],
            panels=[Panel(id=kind, kind=kind, title=kind, data_ref="warnings" if kind == "limitations" else kind)
                    for kind in ("ranking", "comparison", "evidence", "hypotheses", "limitations")],
        )
    profile = profile_dataset(bundle)
    metric_trial_ids = None
    if request.metric in METRIC_STUDIES:
        metric_trial_ids = {item.trial_id for item in bundle.observations
                            if item.metric == request.metric and item.status == "known"}
    ranking = rank_trials(bundle, plan.ranking, metric_trial_ids=metric_trial_ids)
    selected = {item.trial_id for item in ranking.items}
    refs = {ref for item in ranking.items for ref in item.evidence_ids}
    for trial in bundle.trials:
        if trial.id in selected:
            refs.update(ref for value in trial.conditions.values() for ref in value.evidence_ids)
            for segment in trial.segments:
                refs.update(segment.evidence_ids)
                for value in segment.conditions.values():
                    refs.update(value.evidence_ids)
    for observation in bundle.observations:
        if observation.trial_id in selected:
            refs.update(observation.evidence_ids)
    evidence = [item for item in bundle.evidence if item.id in refs]
    event("retrieve", f"Perfil: {profile.n_trials} ensayos; {len(selected)} candidatos elegibles; {len(evidence)} evidencias recuperadas.", sorted(refs))
    comparison = None
    if selected:
        numeric_vary = [key for key in plan.ranking.vary if key in CONDITION_UNITS]
        comparison = compare_trials(bundle, ComparisonRequest(
            trial_ids=[item.trial_id for item in ranking.items], metric=request.metric,
            segment_ids=[segment_id for item in ranking.items for segment_id in item.eligible_segment_ids],
            x_condition=plan.x_condition or (numeric_vary[0] if numeric_vary else "flow_velocity_cm_s"),
            vary=plan.ranking.vary, allow_synthetic=plan.ranking.allow_synthetic,
        ))
    event("analyze", "Ranking y comparación calculados por herramientas Python; no por un modelo.")
    enough = bool(comparison and any(point.x is not None for point in comparison.points))
    warnings = [*ranking.warnings, *(comparison.warnings if comparison else []),
                ("Plan interpretado de forma acotada: " + plan.intent + "."),
                "No es una certificación de seguridad ni una predicción de combustión."]
    synthetic = any(item.provenance == "synthetic" for item in ranking.items)
    if synthetic:
        warnings.append("DATOS SINTÉTICOS: conexión y algoritmos, no mediciones NASA.")
    claims = []
    if enough:
        summary = "Demostración determinista con datos sintéticos." if synthetic else "Análisis determinista de la evidencia disponible."
        for item in ranking.items:
            claims.append(Claim(text=f"{item.trial_id}: elegible bajo los filtros explícitos; cobertura={item.coverage:.3f}. No implica equivalencia física ni riesgo.", kind="finding", citations=[Citation(evidence_id=ref, trial_id=item.trial_id) for ref in item.evidence_ids]))
    else:
        summary = "Evidencia insuficiente para la métrica y las restricciones solicitadas."
        warnings.append("Faltan candidatos elegibles o mediciones compatibles de la métrica.")
    if settings.ai_provider == "openai" and enough:
        narrative = await synthesize({
            "question": request.question, "plan": plan.intent,
            "filters": plan.ranking.model_dump(mode="json"),
            "ranking": ranking.model_dump(mode="json"),
            "comparison": comparison.model_dump(mode="json"),
            "evidence": [item.model_dump(mode="json") for item in evidence], "warnings": warnings,
        }, settings)
        conflicts = summary_conflicts(narrative.summary, evidence=evidence, ranking=ranking, comparison=comparison)
        try:
            claims = review_narrative(
                narrative, ranking=ranking, comparison=comparison, evidence=evidence,
                bundle=bundle, fallback_claims=claims,
            )
        except NarrativeReviewError as exc:
            code = "provider_invalid_citations" if "citation" in str(exc) or "trial" in str(exc) else "provider_invalid_narrative"
            raise ProviderFailure(code) from exc
        if conflicts:
            warnings.append("Se descartó un resumen externo contradictorio con cifras o procedencia estructuradas.")
        # Provider prose is never used as the report summary: semantic support cannot
        # be certified mechanically. Keep the program-owned summary tied to results.
        warnings.append("El resumen externo se sustituyó por síntesis determinista; la revisión semántica de afirmaciones sigue pendiente de revisión humana.")
    elif settings.ai_provider == "openai":
        warnings.append("No se llamó al proveedor externo: las herramientas devolvieron evidencia insuficiente.")
    hypotheses = []
    if enough and request.include_hypotheses and request.metric == "flame_spread_rate_mm_s":
        hypotheses.append(Hypothesis(
            id="demo:hypothesis-controlled-series", label="prepared_demo_hypothesis",
            statement="Propuesta preparada: estudiar el efecto de la ventilación con muestras independientes y condiciones controladas.",
            rationale="El recorrido muestra selección y comparación, no establece causalidad.",
            evidence_ids=sorted(refs), alternative_explanation="Diferencias de geometría, material, atmósfera o medición pueden explicar una asociación.",
            next_measurement="Registrar velocidad calibrada, O2 durante el ensayo y propagación con unidades, controlando geometría y material.",
            falsification="Una serie independiente controlada sin la asociación propuesta la debilitaría; los fixtures no la prueban.",
        ))
    event("review", "Comprobación de esquema, referencias recuperadas y enlaces ensayo-evidencia; no revisión experimental.", sorted(refs))
    event("complete", "Análisis completado; el endpoint guardará el expediente antes de responder.")
    try:
        return ResearchResponse(
            id=f"research:{uuid4()}", created_at=datetime.now(timezone.utc), provider=settings.ai_provider,
            status="completed" if enough else "insufficient_evidence", question=request.question,
            summary=summary, claims=claims, ranking=ranking, comparison=comparison, evidence=evidence,
            hypotheses=hypotheses, events=events, warnings=list(dict.fromkeys(warnings)),
            panels=[Panel(id=kind, kind=kind, title=kind, data_ref="warnings" if kind == "limitations" else kind)
                    for kind in ("ranking", "comparison", "evidence", "hypotheses", "limitations")],
        )
    except ValidationError as exc:
        raise ProviderFailure("provider_invalid_citations") from exc
