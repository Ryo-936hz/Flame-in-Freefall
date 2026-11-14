from datetime import datetime, timezone
from uuid import uuid4

from pydantic import ValidationError

from flamelab.ai.planner import plan_research
from flamelab.ai.provider import ProviderFailure, synthesize
from flamelab.ai.review import NarrativeReviewError, narrative_catalog, review_narrative, summary_conflicts
from flamelab.config import Settings
from flamelab.domain.contracts import (
    ActivityEvent, Citation, Claim, ComparisonRequest,
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
            question=request.question, plan=plan, summary=summary, claims=[], ranking=ranking,
            comparison=None, evidence=[], hypotheses=[],
            events=events,
            warnings=[warning, "No se solicitó ni se presentó una inferencia de un modelo externo."],
            panels=[Panel(id=kind, kind=kind, title=kind, data_ref="warnings" if kind == "limitations" else kind)
                    for kind in ("ranking", "comparison", "evidence", "hypotheses", "limitations")],
        )
    profile = profile_dataset(bundle)
    ranking = rank_trials(bundle, plan.ranking, metric=request.metric)
    selected = {item.trial_id for item in ranking.items}
    refs = {ref for item in ranking.items for ref in item.evidence_ids}
    comparison = None
    if selected:
        comparison = compare_trials(bundle, ComparisonRequest(
            trial_ids=[item.trial_id for item in ranking.items], metric=request.metric,
            segment_ids=[segment_id for item in ranking.items for segment_id in item.eligible_segment_ids],
            x_condition=plan.x_condition or "flow_velocity_cm_s",
            vary=plan.ranking.vary, allow_synthetic=plan.ranking.allow_synthetic,
        ))
    if comparison:
        refs.update(ref for point in comparison.points for ref in point.evidence_ids)
    evidence = [item for item in bundle.evidence if item.id in refs]
    event("retrieve", f"Perfil: {profile.n_trials} registros; {len(selected)} candidatos elegibles; {len(evidence)} evidencias recuperadas.", sorted(refs))
    event("analyze", "Ranking y comparación calculados por herramientas Python; no por un modelo.")
    enough = bool(comparison and any(point.x is not None for point in comparison.points))
    warnings = [*plan.limits, *ranking.warnings, *(comparison.warnings if comparison else []),
                ("Plan interpretado de forma acotada: " + plan.intent + "."),
                "No es una certificación de seguridad ni una predicción de combustión."]
    synthetic = any(item.provenance == "synthetic" for item in [*ranking.items, *evidence])
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
        # This catalogue is program-owned. In particular, source_note warnings
        # contain untrusted corpus prose and must never authorize provider claims.
        narrative_limitations = [
            *plan.limits,
            "No es una certificación de seguridad ni una predicción de combustión.",
            "Las observaciones repetidas no son réplicas independientes.",
            "Las comparaciones son descriptivas y no demuestran causalidad.",
        ]
        if synthetic:
            narrative_limitations.append("DATOS SINTÉTICOS: conexión y algoritmos, no mediciones NASA.")
        narrative = await synthesize({
            "question": request.question, "plan": plan.model_dump(mode="json"),
            "claim_templates": narrative_catalog(comparison), "allowed_limitations": narrative_limitations,
            "filters": plan.ranking.model_dump(mode="json"),
            "ranking": ranking.model_dump(mode="json"),
            "comparison": comparison.model_dump(mode="json"),
            "evidence": [item.model_dump(mode="json") for item in evidence], "warnings": warnings,
        }, settings)
        conflicts = summary_conflicts(narrative.summary, evidence=evidence, ranking=ranking, comparison=comparison)
        try:
            claims = review_narrative(
                narrative, ranking=ranking, comparison=comparison, evidence=evidence,
                bundle=bundle, fallback_claims=claims, known_limitations=narrative_limitations,
            )
        except NarrativeReviewError as exc:
            raise ProviderFailure(exc.code) from exc
        if conflicts:
            warnings.append("Se descartó un resumen externo con cifras o procedencia sin enlace verificable a una medición.")
        # Provider prose is never used as the report summary: semantic support cannot
        # be certified mechanically. Keep the program-owned summary tied to results.
        warnings.append("El resumen externo se sustituyó por síntesis determinista. Solo se admiten afirmaciones numéricas del catálogo vinculadas al ensayo, métrica y fuente; la interpretación científica requiere revisión humana.")
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
            status="completed" if enough else "insufficient_evidence", question=request.question, plan=plan,
            summary=summary, claims=claims, ranking=ranking, comparison=comparison, evidence=evidence,
            hypotheses=hypotheses, events=events, warnings=list(dict.fromkeys(warnings)),
            panels=[Panel(id=kind, kind=kind, title=kind, data_ref="warnings" if kind == "limitations" else kind)
                    for kind in ("ranking", "comparison", "evidence", "hypotheses", "limitations")],
        )
    except ValidationError as exc:
        raise ProviderFailure("provider_invalid_citations") from exc
