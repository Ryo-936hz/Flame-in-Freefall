"""A small visible catalog planner; structured form mode remains authoritative."""

import re
import unicodedata

from flamelab.domain.contracts import CONDITION_UNITS, RankingRequest, ResearchPlan, ResearchRequest

CATALOG_LIMITS = [
    "Catálogo determinista limitado a variar flujo, elegir una gravedad o evaluar evidencia.",
    "No interpreta rangos, valores numéricos, negaciones ni condiciones adicionales en texto; use los filtros explícitos.",
    "Los cálculos usan herramientas científicas; el plan no demuestra comparabilidad física ni seguridad.",
]


def _normalize(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text.casefold())
    return "".join(char for char in decomposed if not unicodedata.combining(char))


def _has_any(text: str, *terms: str) -> bool:
    return any(re.search(rf"\b{re.escape(term)}\b", text) for term in terms)


def _axis(ranking: RankingRequest) -> str:
    return next((key for key in ranking.vary if key in CONDITION_UNITS), "flow_velocity_cm_s")


def plan_research(request: ResearchRequest) -> ResearchPlan:
    """Return the exact plan for preview and execution, without tools or providers."""
    ranking = request.ranking.model_copy(deep=True)

    def plan(intent, message, *, blocked=False, filters=None, axis=None):
        effective = filters or ranking
        return ResearchPlan(
            planning_mode=request.planning_mode, intent=intent, ranking=effective,
            metric=request.metric, x_condition=axis or _axis(effective), message=message,
            blocked=blocked, limits=CATALOG_LIMITS if request.planning_mode == "catalog" else [
                "Solo se aplican los filtros estructurados explícitos; la pregunta es descriptiva y no modifica restricciones.",
                "No se ejecuta una simulación física ni una certificación de seguridad.",
            ],
        )

    if request.planning_mode == "explicit":
        return plan("explicit_filters", "Plan: ejecutar el análisis con los filtros estructurados explícitos; la pregunta no modifica el plan.")

    question = _normalize(request.question)
    if _has_any(question, "cfd", "predict", "predice", "predicir", "prediccion", "safety",
                "seguridad", "certify", "certifica", "certificar", "risk", "riesgo",
                "optimize", "optimiza", "optimizar"):
        return plan("unsupported", "La petición requiere predicción, CFD, optimización o certificación fuera del catálogo.", blocked=True)

    if re.search(r"\d", question) or _has_any(question, "no", "not", "never", "except", "excepto", "ignore", "ignora", "without", "sin"):
        return plan("ambiguous", "El catálogo no interpreta cantidades, exclusiones ni instrucciones para ignorar filtros; indique las restricciones en el formulario explícito.", blocked=True)

    if any(char.isalpha() and not ("a" <= char <= "z") for char in question):
        return plan("ambiguous", "El catálogo solo admite las frases documentadas en español o inglés; use el formulario explícito para otros textos.", blocked=True)
    words = set(re.findall(r"[a-z_]+", question))
    filler = {"a", "al", "and", "at", "by", "de", "del", "el", "en", "for", "in", "la", "las", "los",
              "of", "on", "or", "para", "por", "the", "these", "this", "to", "un", "una", "y",
              "trials", "trial", "ensayos", "ensayo", "synthetic", "sinteticos", "sinteticas", "demo",
              "evidence", "evidencia", "available", "disponible", "reported", "reportada", "please", "favor"}
    compare_terms = {"compare", "compara", "comparar", "comparison", "comparacion", "efecto", "effect", "vary", "variar", "varying", "variando", "while", "con", "segun"}
    flow_terms = {"flow", "flujo", "velocity", "velocidad", "flame", "llama", "spread", "propagacion", "rate", "tasa"}
    scenario_terms = {"scenario", "escenario", "change", "cambia", "cambiar", "switch", "cambio", "gravity", "gravedad", "lunar", "moon", "luna", "microgravity", "microgravedad", "earth", "terrestre", "tierra"}
    evidence_terms = {"assess", "evaluate", "evaluar", "evalua", "show", "muestra", "hay", "si", "whether", "insufficient", "insuficiente", "sufficient", "suficiente", "missing", "falta", "faltan"}
    compare = bool(words & (compare_terms - {"while", "con", "segun"}))
    flow = bool(words & {"flow", "flujo", "velocity", "velocidad"})
    scenario = bool(words & {"scenario", "escenario", "change", "cambia", "cambiar", "switch", "cambio"})
    gravities = [value for value, terms in {
        "lunar": {"lunar", "moon", "luna"},
        "microgravity": {"microgravity", "microgravedad"},
        "earth": {"earth", "terrestre", "tierra"},
    }.items() if words & terms]

    if len(gravities) > 1 or (compare and flow and scenario):
        return plan("ambiguous", "La pregunta combina escenarios o intenciones; elija un único análisis antes de ejecutar.", blocked=True)

    if scenario:
        if len(gravities) != 1 or words - (filler | scenario_terms):
            return plan("ambiguous", "Indique un único escenario de gravedad admitido; otras restricciones deben ir en los filtros explícitos.", blocked=True)
        gravity = gravities[0]
        if ranking.target.get("gravity_regime") not in (None, gravity) or "gravity_regime" in ranking.vary:
            return plan("scenario_change", "Conflicto: la gravedad solicitada difiere del filtro explícito o está declarada variable. Aclare los filtros.", blocked=True)
        data = ranking.model_dump()
        data["target"]["gravity_regime"] = gravity
        data["required_match"] = list(dict.fromkeys([*ranking.required_match, "gravity_regime"]))
        return plan("scenario_change", f"Plan: seleccionar gravity_regime={gravity}; no se infieren otros cambios.", filters=RankingRequest.model_validate(data))

    if compare and flow:
        if words - (filler | compare_terms | flow_terms):
            return plan("ambiguous", "Hay restricciones fuera del catálogo de flujo; use el formulario explícito para no ignorarlas.", blocked=True)
        key = "flow_velocity_cm_s"
        if key in ranking.required_match or (key in ranking.target and key not in ranking.vary and ranking.weights.get(key, 1) > 0):
            return plan("compare_varying_flow", "Conflicto: se pide variar el flujo, pero los filtros explícitos lo fijan o puntúan. Aclare los filtros.", blocked=True, axis=key)
        data = ranking.model_dump()
        data["vary"] = list(dict.fromkeys([*ranking.vary, key]))
        return plan("compare_varying_flow", "Plan: comparar candidatos al variar flow_velocity_cm_s; se conservan los demás filtros explícitos.", filters=RankingRequest.model_validate(data), axis=key)

    if words & {"evidence", "evidencia"} and not words - (filler | evidence_terms):
        return plan("assess_evidence", "Plan: evaluar evidencia con los filtros explícitos; devolver insuficiencia si faltan datos compatibles.")

    return plan("ambiguous", "Pregunta fuera de las frases del catálogo o incompleta. Use el formulario explícito o aclare la intención.", blocked=True)
