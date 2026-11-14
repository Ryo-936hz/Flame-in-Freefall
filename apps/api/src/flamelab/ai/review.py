"""Deterministic guardrails for provider claims; not a semantic fact checker."""

import re
import unicodedata

from flamelab.ai.provider import Narrative
from flamelab.domain.contracts import ComparisonResponse, DatasetBundle, Evidence, RankingResponse


_NUMERIC_WITH_UNIT = re.compile(
    r"(?<![\w:.-])(\d+(?:[.,]\d+)?)[ \t]*(mm\s*/\s*s|cm\s*/\s*s|m\s*/\s*s|"
    r"mm\s*s\s*\^?-?1|cm\s*s\s*\^?-?1|kpa|mm|cm|m|w|%)(?![a-zA-Z])",
    re.IGNORECASE,
)
_STOP_WORDS = {
    "a", "al", "and", "as", "at", "con", "de", "del", "el", "en", "es", "esta", "este",
    "for", "from", "in", "is", "la", "las", "los", "of", "on", "or", "para", "por",
    "que", "se", "the", "to", "un", "una", "was", "y", "su", "sus", "dato", "datos",
    "evidence", "evidencia", "source", "fuente", "trial", "ensayo", "study", "estudio",
}
_SYNONYMS = {
    "propagacion": "spread", "propagation": "spread", "propaga": "spread", "spread": "spread",
    "combustion": "flame", "llama": "flame", "flame": "flame",
    "flujo": "flow", "flow": "flow", "velocidad": "velocity", "velocity": "velocity",
    "oxigeno": "oxygen", "oxygen": "oxygen", "presion": "pressure", "pressure": "pressure",
    "geometria": "geometry", "geometry": "geometry", "material": "material",
    "earth": "earth", "tierra": "earth", "terrestre": "earth",
}
_UNIT_CONVERSIONS = {
    "mm/s": ("mm/s", 1.0), "mm s-1": ("mm/s", 1.0), "mm s^-1": ("mm/s", 1.0),
    "cm/s": ("mm/s", 10.0), "cm s-1": ("mm/s", 10.0), "cm s^-1": ("mm/s", 10.0),
    "m/s": ("mm/s", 1000.0), "m s-1": ("mm/s", 1000.0), "m s^-1": ("mm/s", 1000.0),
    "kpa": ("kpa", 1.0), "mm": ("mm", 1.0), "cm": ("mm", 10.0), "m": ("mm", 1000.0),
    "w": ("w", 1.0), "%": ("%", 1.0),
}


class NarrativeReviewError(ValueError):
    """A provider claim contradicted or was not anchored to structured evidence."""


def _normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    return "".join(char for char in value if not unicodedata.combining(char))


def _terms(value: str) -> set[str]:
    result = set()
    for token in re.findall(r"[a-zA-ZÀ-ÿ]+", _normalize(value)):
        token = _SYNONYMS.get(token, token)
        if len(token) > 2 and token not in _STOP_WORDS:
            result.add(token)
    return result


def _numeric_pairs(text: str) -> list[tuple[float, str]]:
    pairs = []
    normalized = text.replace("−", "-").replace("–", "-")
    for number, unit in _NUMERIC_WITH_UNIT.findall(normalized):
        key = re.sub(r"\s+", " ", re.sub(r"\s*/\s*", "/", unit.casefold())).strip()
        canonical_unit, factor = _UNIT_CONVERSIONS[key]
        pairs.append((float(number.replace(",", ".")) * factor, canonical_unit))
    return pairs


def _close(left: float, right: float) -> bool:
    return abs(left - right) <= max(1e-6, abs(right) * 0.005)


def _structured_numbers(ranking: RankingResponse, comparison: ComparisonResponse | None,
                        evidence: list[Evidence]) -> set[tuple[float, str]]:
    # Numerical claims must match program-calculated outputs, not free-text source
    # content. Evidence text is retained for provenance and lexical citation checks.
    values: set[tuple[float, str]] = set()
    if comparison is not None:
        for point in comparison.points:
            if point.x is not None and comparison.x_unit:
                unit = comparison.x_unit.casefold()
                canonical, factor = _UNIT_CONVERSIONS.get(unit, (unit, 1.0))
                values.add((float(point.x) * factor, canonical))
            unit = comparison.unit.casefold()
            canonical, factor = _UNIT_CONVERSIONS.get(unit, (unit, 1.0))
            values.add((float(point.y) * factor, canonical))
        for group in comparison.groups:
            if group.median is not None:
                unit = comparison.unit.casefold()
                canonical, factor = _UNIT_CONVERSIONS.get(unit, (unit, 1.0))
                values.add((float(group.median) * factor, canonical))
    # Similarity and coverage are deliberately dimensionless; this review only
    # accepts physical quantities when an explicit unit can be matched.
    _ = ranking
    return values


def _citation_context(evidence_id: str, trial_id: str | None, evidence_by_id: dict[str, Evidence],
                      bundle: DatasetBundle) -> tuple[str, bool]:
    evidence = evidence_by_id[evidence_id]
    pieces = [evidence.title, evidence.locator, evidence.text]
    synthetic = evidence.provenance == "synthetic"
    if trial_id:
        trial = next(item for item in bundle.trials if item.id == trial_id)
        pieces.extend([trial.label, trial.id])
        for key, condition in trial.conditions.items():
            pieces.extend([key, str(condition.value)])
        for segment in trial.segments:
            for key, condition in segment.conditions.items():
                pieces.extend([key, str(condition.value)])
    return " ".join(pieces), synthetic


def _relevant(claim_text: str, contexts: list[str]) -> bool:
    claim_terms = _terms(claim_text)
    return any(claim_terms & _terms(context) for context in contexts)


def review_narrative(narrative: Narrative, *, ranking: RankingResponse,
                     comparison: ComparisonResponse | None, evidence: list[Evidence],
                     bundle: DatasetBundle, fallback_claims: list) -> list:
    """Return grounded claims, or deterministic claims if the provider returned none."""
    if not narrative.claims:
        return fallback_claims
    evidence_by_id = {item.id: item for item in evidence}
    selected_links = {item.trial_id: set(item.evidence_ids) for item in ranking.items}
    allowed_numbers = _structured_numbers(ranking, comparison, evidence)
    for claim in narrative.claims:
        if claim.kind in {"finding", "inference"} and not claim.citations:
            raise NarrativeReviewError("factual claim has no citation")
        contexts = []
        synthetic_citation = False
        for citation in claim.citations:
            if citation.evidence_id not in evidence_by_id:
                raise NarrativeReviewError("citation is not in retrieved evidence")
            if citation.trial_id and citation.evidence_id not in selected_links.get(citation.trial_id, set()):
                raise NarrativeReviewError("citation is not linked to the selected trial")
            context, synthetic = _citation_context(
                citation.evidence_id, citation.trial_id, evidence_by_id, bundle,
            )
            contexts.append(context)
            synthetic_citation |= synthetic
        if claim.kind in {"finding", "inference"} and not _relevant(claim.text, contexts):
            raise NarrativeReviewError("citation exists but is not lexically relevant to claim")
        full_text = claim.text
        if synthetic_citation and re.search(r"\b(nasa|published|medido por nasa|medicion real)\b", _normalize(full_text)):
            raise NarrativeReviewError("claim presents synthetic evidence as published or NASA data")
        for number, unit in _numeric_pairs(full_text):
            matching_units = [value for value, known_unit in allowed_numbers if known_unit == unit]
            if not any(_close(number, known) for known in matching_units):
                raise NarrativeReviewError(f"claim contains unsupported value {number} {unit}")
    return narrative.claims


def summary_conflicts(summary: str, *, evidence: list[Evidence], ranking: RankingResponse,
                      comparison: ComparisonResponse | None) -> bool:
    """Detect hard numeric/provenance contradictions; summaries are never trusted as proof."""
    synthetic = any(item.provenance == "synthetic" for item in ranking.items) or any(
        item.provenance == "synthetic" for item in evidence
    )
    if synthetic and re.search(r"\b(nasa|published|real nasa|medicion real)\b", _normalize(summary)):
        return True
    allowed = _structured_numbers(ranking, comparison, evidence)
    return any(
        not any(unit == known_unit and _close(value, known) for known, known_unit in allowed)
        for value, unit in _numeric_pairs(summary)
    )
