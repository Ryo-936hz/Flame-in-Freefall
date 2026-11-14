"""Verify a closed catalogue of quantitative statements, never arbitrary prose."""

import re
import unicodedata
from decimal import Decimal, DecimalException

from flamelab.ai.provider import Narrative
from flamelab.domain.contracts import ComparisonResponse, DatasetBundle, Evidence, RankingResponse


class NarrativeReviewError(ValueError):
    """Provider output is not supported by the selected structured measurement."""

    def __init__(self, message, *, code="provider_invalid_narrative"):
        super().__init__(message)
        self.code = code


def _normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    return "".join(char for char in value if not unicodedata.combining(char))


# Phrases name the semantic variable, not merely a dimensionally compatible unit.
_QUANTITIES = {
    "flame_spread_rate_mm_s": ("flame spread rate", "tasa de propagacion"),
    "extinction_oxygen_pct": ("extinction oxygen", "oxigeno de extincion"),
    "heat_release_w": ("heat release", "liberacion de calor"),
    "flex_burn_duration_s": ("flex burn duration", "duracion de combustion flex"),
    "flex_visible_flame_extinction_diameter_mm": ("visible flame extinction diameter", "diametro de extincion de llama visible"),
    "same_reported_mass_loss_rate_mg_min": ("reported mass loss rate", "tasa de perdida de masa reportada"),
    "samer_run_duration_s": ("same-r run duration", "duracion del ensayo same-r"),
    "samer_net_aging_time_s": ("net aging time", "tiempo neto de envejecimiento"),
    "samer_primary_aging_time_s": ("primary aging time", "tiempo primario de envejecimiento"),
    "samer_primary_mixing_time_s": ("primary mixing time", "tiempo primario de mezcla"),
    "saffire_reported_burn_duration_s": ("saffire reported burn duration", "duracion de combustion saffire reportada"),
    "peak_burner_temperature_k": ("peak burner temperature", "temperatura maxima del quemador"),
    "cfig_reported_run_duration_s": ("cfi-g reported run duration", "duracion del ensayo cfi-g reportada"),
    "flow_velocity_cm_s": ("flow velocity", "velocidad de flujo"),
    "oxygen_pct": ("oxygen concentration", "concentracion de oxigeno"),
    "oxygen_initial_pct": ("initial oxygen concentration", "concentracion inicial de oxigeno"),
    "oxygen_final_pct": ("final oxygen concentration", "concentracion final de oxigeno"),
    "pressure_kpa": ("pressure", "presion"),
    "thickness_mm": ("thickness", "espesor"),
    "diameter_mm": ("diameter", "diametro"),
    "sample_width_mm": ("sample width", "anchura de muestra"),
    "burning_faces": ("burning face count", "numero de caras de combustion"),
    "burn_duration_s": ("total burn duration", "duracion total de combustion"),
    "aging_duration_s": ("aging duration", "duracion de envejecimiento"),
    "ignition_power_w": ("ignition power", "potencia de ignicion"),
    "ignition_duration_s": ("ignition duration", "duracion de ignicion"),
}
_VARIABLES = {phrase: variable for variable, phrases in _QUANTITIES.items() for phrase in phrases}
_NUMBER = r"[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?"
_QUANTITY_CLAIM = re.compile(
    r"^(?:the (?:selected )?trial reports (?:a |an |the )?|"
    r"el ensayo (?:seleccionado )?(?:reporta|registra) (?:una |un |la |el )?)"
    r"(?P<name>.+?) (?:of|at|de|=) (?P<number>" + _NUMBER + r")\s*(?P<unit>.+?)\.?$",
)
_FACTORS = {
    "mm/s": ("velocity", "1", "0"), "mms-1": ("velocity", "1", "0"), "mms^-1": ("velocity", "1", "0"),
    "cm/s": ("velocity", "10", "0"), "cms-1": ("velocity", "10", "0"), "cms^-1": ("velocity", "10", "0"),
    "m/s": ("velocity", "1000", "0"), "ms-1": ("velocity", "1000", "0"), "ms^-1": ("velocity", "1000", "0"),
    "mm": ("length", "1", "0"), "cm": ("length", "10", "0"), "m": ("length", "1000", "0"),
    "s": ("time", "1", "0"), "min": ("time", "60", "0"),
    "mg/min": ("mass_rate", "1", "0"), "mg/s": ("mass_rate", "60", "0"),
    "k": ("temperature", "1", "0"), "°c": ("temperature", "1", "273.15"),
    "kpa": ("pressure", "1", "0"), "pa": ("pressure", "0.001", "0"),
    "w": ("power", "1", "0"), "%": ("percentage", "1", "0"), "count": ("count", "1", "0"),
}


def _quantity(value, unit):
    key = re.sub(r"\s+", "", unit.casefold().replace("−", "-"))
    if key not in _FACTORS:
        raise NarrativeReviewError("claim uses an unsupported unit")
    kind, factor, offset = _FACTORS[key]
    try:
        number = Decimal(str(value).replace(",", "."))
        if not number.is_finite():
            raise NarrativeReviewError("claim contains a nonfinite value")
        return kind, number * Decimal(factor) + Decimal(offset)
    except DecimalException as exc:
        raise NarrativeReviewError("claim contains an invalid number") from exc


def _same_quantity(left, right):
    # Software round-off only; never an experimental uncertainty allowance.
    if left[0] != right[0]:
        return False
    if right[1] == 0 or right[0] == "count":
        return left[1] == right[1]
    return abs(left[1] - right[1]) <= abs(right[1]) * Decimal("1e-12")


def narrative_catalog(comparison: ComparisonResponse | None) -> list[str]:
    """Expose the accepted grammar without constructing or changing measurements."""
    variables = [comparison.metric, comparison.x_condition] if comparison else []
    return [f"The trial reports a {_QUANTITIES[key][0]} of <value> <unit>."
            for key in dict.fromkeys(variables) if key in _QUANTITIES]


def review_narrative(narrative: Narrative, *, ranking: RankingResponse,
                     comparison: ComparisonResponse | None, evidence: list[Evidence],
                     bundle: DatasetBundle, fallback_claims: list,
                     known_limitations: list[str] | None = None) -> list:
    """Accept only quoted limitations or one supported quantitative fact per claim."""
    if not narrative.claims:
        return fallback_claims
    evidence_by_id = {item.id: item for item in evidence}
    selected_links = {item.trial_id: set(item.evidence_ids) for item in ranking.items}
    fallback = {claim.text: claim for claim in fallback_claims}
    observations = {item.id: item for item in bundle.observations}
    trials = {item.id: item for item in bundle.trials}
    for claim in narrative.claims:
        if claim.kind in {"finding", "inference"} and not claim.citations:
            raise NarrativeReviewError("factual claim has no citation", code="provider_invalid_citations")
        for citation in claim.citations:
            if citation.evidence_id not in evidence_by_id:
                raise NarrativeReviewError("citation is not in retrieved evidence", code="provider_invalid_citations")
            if citation.trial_id and citation.evidence_id not in selected_links.get(citation.trial_id, set()):
                raise NarrativeReviewError("citation is not linked to the selected trial", code="provider_invalid_citations")
        if claim.text in fallback and claim == fallback[claim.text]:
            continue
        if claim.kind == "limitation":
            if claim.text not in (known_limitations or []):
                raise NarrativeReviewError("limitation is outside the deterministic catalogue")
            continue
        if claim.kind == "inference":
            raise NarrativeReviewError("free inference is outside the deterministic catalogue")
        text = _normalize(claim.text.strip().replace("−", "-"))
        match = _QUANTITY_CLAIM.fullmatch(text)
        if not match or match["name"] not in _VARIABLES:
            # Preserve the explicit citation error for an obviously unrelated source.
            context_words = set(re.findall(r"[a-z]{4,}", _normalize(" ".join(
                evidence_by_id[c.evidence_id].text for c in claim.citations
            ))))
            terms = set(re.findall(r"[a-z]{4,}", text)) - {"trial", "source", "selected", "reports", "reported", "evidence"}
            if not terms & context_words:
                raise NarrativeReviewError("citation does not support a recognised measurement", code="provider_invalid_citations")
            raise NarrativeReviewError("claim is outside the supported quantitative catalogue")
        trial_ids = {citation.trial_id for citation in claim.citations}
        if len(trial_ids) != 1 or None in trial_ids:
            raise NarrativeReviewError("quantitative citation requires exactly one selected trial", code="provider_invalid_citations")
        variable = _VARIABLES[match["name"]]
        if comparison is None or variable not in {comparison.metric, comparison.x_condition}:
            raise NarrativeReviewError("claim variable is not the compared metric or axis")
        quantity = _quantity(match["number"], match["unit"])
        source_ids = {citation.evidence_id for citation in claim.citations}
        supported = False
        for point in comparison.points:
            if point.trial_id not in trial_ids:
                continue
            if variable == comparison.metric:
                measurement = observations[point.observation_id]
                field_sources = set(measurement.evidence_ids)
            else:
                trial = trials[point.trial_id]
                segment = next((item for item in trial.segments if item.id == point.segment_id), None)
                conditions = segment.conditions if segment is not None else trial.conditions
                condition = conditions.get(variable)
                field_sources = set(condition.evidence_ids) if condition else set()
            # PlotPoint evidence is a union of contexts. Only the specific field's
            # sources can support a claim about that field's numeric value.
            if not source_ids.issubset(field_sources):
                continue
            value = point.y if variable == comparison.metric else point.x
            unit = comparison.unit if variable == comparison.metric else comparison.x_unit
            if value is not None and unit is not None and _same_quantity(quantity, _quantity(value, unit)):
                supported = True
                break
        if not supported:
            raise NarrativeReviewError("claim value is not supported by the cited trial and measurement")
    return narrative.claims


def summary_conflicts(summary: str, *, evidence: list[Evidence], ranking: RankingResponse,
                      comparison: ComparisonResponse | None) -> bool:
    """Summaries are always replaced; flag suspicious prose without treating it as proof."""
    synthetic = any(item.provenance == "synthetic" for item in ranking.items + evidence)
    normalized = _normalize(summary)
    if synthetic and re.search(r"\b(nasa|published|real|medicion)\b", normalized):
        return True
    # External summary has no trial/variable binding. Any quantity requires the
    # cited-claim catalogue instead; even a coincidentally correct number is not proof.
    if re.search(_NUMBER + r"\s*(?:mm|cm|m/s|kpa|pa|w|%|mg|s\b|k\b)", normalized):
        return True
    _ = comparison
    return False
