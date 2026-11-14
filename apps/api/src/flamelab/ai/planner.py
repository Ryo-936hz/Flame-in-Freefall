"""Small deterministic language planner; public request fields remain authoritative."""

from dataclasses import dataclass
import re
import unicodedata

from flamelab.domain.contracts import RankingRequest, ResearchRequest


@dataclass(frozen=True)
class ResearchPlan:
    intent: str
    ranking: RankingRequest
    x_condition: str | None = None
    message: str = ""
    blocked: bool = False


def _normalize(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text.casefold())
    return "".join(char for char in decomposed if not unicodedata.combining(char))


def _has_any(text: str, *terms: str) -> bool:
    return any(re.search(rf"\b{re.escape(term)}\b", text) for term in terms)


def plan_research(request: ResearchRequest) -> ResearchPlan:
    """Recognize a few supported intents and expose conflicts before tool execution."""
    question = _normalize(request.question)
    ranking = request.ranking

    unsupported = _has_any(
        question, "cfd", "predict", "predice", "predicir", "prediccion", "safety",
        "seguridad", "certify", "certifica", "certificar", "risk", "riesgo",
        "optimize", "optimiza", "optimizar",
    )
    if unsupported:
        return ResearchPlan(
            "unsupported", ranking,
            message="La petición requiere predicción, CFD, optimización o certificación fuera del catálogo determinista.",
            blocked=True,
        )

    compare = _has_any(question, "compare", "compara", "comparar", "comparison", "comparacion", "efecto", "vary", "variar")
    flow = _has_any(question, "flow", "flujo", "velocity", "velocidad")
    if compare and flow:
        key = "flow_velocity_cm_s"
        if key in ranking.target or key in ranking.required_match or key in ranking.weights:
            return ResearchPlan(
                "compare_varying_flow", ranking, key,
                message="Conflicto: la pregunta pide variar el flujo, pero los filtros explícitos también fijan o ponderan ese flujo. Aclare los filtros antes de ejecutar.",
                blocked=True,
            )
        updated = ranking.model_copy(update={
            "vary": list(dict.fromkeys([*ranking.vary, key])),
            "required_match": [item for item in ranking.required_match if item != key],
        })
        return ResearchPlan(
            "compare_varying_flow", updated, key,
            message="Plan: comparar candidatos al variar flow_velocity_cm_s; los demás filtros explícitos se conservan.",
        )

    scenario_change = _has_any(question, "scenario", "escenario", "change", "cambia", "cambiar", "switch", "cambio")
    gravity_value = None
    if _has_any(question, "lunar", "moon", "luna"):
        gravity_value = "lunar"
    elif _has_any(question, "microgravity", "microgravedad"):
        gravity_value = "microgravity"
    elif _has_any(question, "earth", "terrestre", "tierra"):
        gravity_value = "earth"
    if scenario_change:
        if gravity_value is None:
            return ResearchPlan(
                "ambiguous", ranking,
                message="Pregunta ambigua: indique el escenario de gravedad que desea comparar.",
                blocked=True,
            )
        current = ranking.target.get("gravity_regime")
        if current is not None and current != gravity_value:
            return ResearchPlan(
                "scenario_change", ranking,
                message=f"Conflicto: la pregunta solicita gravity_regime={gravity_value}, pero el filtro explícito fija {current}. No se ejecutaron herramientas; aclare el filtro.",
                blocked=True,
            )
        target = dict(ranking.target)
        target["gravity_regime"] = gravity_value
        updated = ranking.model_copy(update={
            "target": target,
            "required_match": list(dict.fromkeys([*ranking.required_match, "gravity_regime"])),
            "vary": [item for item in ranking.vary if item != "gravity_regime"],
        })
        return ResearchPlan(
            "scenario_change", updated,
            message=f"Plan: seleccionar el escenario explícito gravity_regime={gravity_value}; no se infieren otros cambios.",
        )

    if compare and not flow and not ranking.vary:
        return ResearchPlan(
            "ambiguous", ranking,
            message="Pregunta ambigua: especifique una variable compatible del catálogo para comparar.",
            blocked=True,
        )

    if _has_any(question, "insufficient", "insuficiente", "falta", "faltan", "missing", "evidence", "evidencia"):
        return ResearchPlan(
            "assess_evidence", ranking,
            message="Plan: evaluar evidencia con los filtros explícitos y devolver insuficiencia si faltan datos compatibles.",
        )

    return ResearchPlan(
        "explicit_filters", ranking,
        message="Plan: ejecutar el análisis determinista con los filtros estructurados explícitos.",
    )
