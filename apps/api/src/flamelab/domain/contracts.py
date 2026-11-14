"""Canonical public contract. Generate OpenAPI and TypeScript; never edit derived files."""

from datetime import datetime
from typing import Annotated, Literal, Self, get_args

from pydantic import (
    BaseModel, ConfigDict, Field, StrictFloat, StrictInt, StrictStr, model_validator,
)

Number = StrictFloat | StrictInt
Scalar = Number | StrictStr
ConditionKey = Literal[
    "oxygen_pct", "pressure_kpa", "flow_velocity_cm_s", "material", "geometry",
    "thickness_mm", "diameter_mm", "sample_width_mm", "flow_direction", "gravity_regime",
]
Metric = Literal["flame_spread_rate_mm_s", "extinction_oxygen_pct", "heat_release_w", "other"]
MissingStatus = Literal["known", "not_measured", "not_reported", "not_extracted", "not_applicable"]
Provenance = Literal["published", "digitized", "derived", "synthetic"]
Identifier = Annotated[str, Field(min_length=3, max_length=240, pattern=r"^[A-Za-z0-9_.-]+:[A-Za-z0-9_.:-]+$")]
CONDITION_KEYS = get_args(ConditionKey)
CONDITION_UNITS = {
    "oxygen_pct": "%", "pressure_kpa": "kPa", "flow_velocity_cm_s": "cm/s",
    "thickness_mm": "mm", "diameter_mm": "mm", "sample_width_mm": "mm",
}
METRIC_UNITS = {
    "flame_spread_rate_mm_s": "mm/s", "extinction_oxygen_pct": "%", "heat_release_w": "W",
}


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False, strict=True)


def validate_scalar(key: str, value: Scalar) -> None:
    if key in CONDITION_UNITS:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{key} requires a number")
        if value < 0 or (key == "oxygen_pct" and value > 100):
            raise ValueError(f"{key} is outside the admissible range")
    elif not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} requires nonempty text")


class ConditionValue(Contract):
    value: Scalar | None = None
    status: MissingStatus = "not_reported"
    unit: str | None = None
    original_value: str | None = None
    original_unit: str | None = None
    evidence_ids: list[Identifier] = Field(default_factory=list)

    @model_validator(mode="after")
    def absence(self) -> Self:
        if (self.status == "known") != (self.value is not None):
            raise ValueError("known requires value; missing statuses require null")
        return self


class Study(Contract):
    id: Identifier
    title: str
    family: str
    description: str = ""
    source_urls: list[str] = Field(default_factory=list)
    dataset_status: Literal["metadata_only", "unverified", "reviewed", "synthetic"]

    @model_validator(mode="after")
    def safe_sources(self) -> Self:
        if any(not url.startswith(("https://", "http://")) for url in self.source_urls):
            raise ValueError("source_urls must use HTTP(S)")
        if self.dataset_status == "synthetic" and self.source_urls:
            raise ValueError("synthetic studies do not claim external scientific sources")
        return self


class Evidence(Contract):
    id: Identifier
    study_id: Identifier
    title: str
    text: str
    source_url: str | None = None
    locator: str
    page: int | None = Field(default=None, ge=1)
    provenance: Provenance
    reviewed: bool = False

    @model_validator(mode="after")
    def safe_source(self) -> Self:
        if self.source_url and not self.source_url.startswith(("https://", "http://")):
            raise ValueError("source_url must use HTTP(S)")
        if self.provenance == "synthetic" and self.source_url is not None:
            raise ValueError("synthetic evidence cannot cite an external source")
        return self


class Trial(Contract):
    id: Identifier
    study_id: Identifier
    sample_id: Identifier
    independent_unit_id: Identifier
    label: str
    conditions: dict[ConditionKey, ConditionValue]
    evidence_ids: list[Identifier] = Field(min_length=1)
    provenance: Provenance
    material_grade: str | None = None
    notes: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def typed_conditions(self) -> Self:
        for key, condition in self.conditions.items():
            if condition.status == "known":
                validate_scalar(key, condition.value)
                if condition.unit != CONDITION_UNITS.get(key):
                    raise ValueError(f"{key} must use canonical unit {CONDITION_UNITS.get(key)}")
                if not condition.evidence_ids:
                    raise ValueError("known conditions require evidence")
        return self


class Observation(Contract):
    id: Identifier
    trial_id: Identifier
    metric: Metric
    value: Number | None = None
    unit: str
    status: MissingStatus = "known"
    evidence_ids: list[Identifier] = Field(min_length=1)
    provenance: Provenance
    uncertainty: None = None

    @model_validator(mode="after")
    def values(self) -> Self:
        if (self.status == "known") != (self.value is not None):
            raise ValueError("known requires value; missing statuses require null")
        if self.metric in METRIC_UNITS and self.unit != METRIC_UNITS[self.metric]:
            raise ValueError("metric unit must be canonical; preserve source units in evidence")
        if self.value is not None and (self.value < 0 or (self.metric == "extinction_oxygen_pct" and self.value > 100)):
            raise ValueError("metric value outside admissible range")
        return self


class DatasetBundle(Contract):
    schema_version: Literal["1.0"] = "1.0"
    dataset_id: Identifier
    description: str
    studies: list[Study] = Field(default_factory=list)
    evidence: list[Evidence] = Field(default_factory=list)
    trials: list[Trial] = Field(default_factory=list)
    observations: list[Observation] = Field(default_factory=list)

    @model_validator(mode="after")
    def integrity(self) -> Self:
        for collection in (self.studies, self.evidence, self.trials, self.observations):
            if len({x.id for x in collection}) != len(collection):
                raise ValueError("duplicate entity identifier")
        studies = {x.id: x for x in self.studies}
        evidence = {x.id: x for x in self.evidence}
        trials = {x.id: x for x in self.trials}
        for item in self.evidence:
            if item.study_id not in studies:
                raise ValueError("evidence references unknown study")
            if (item.provenance == "synthetic") != (studies[item.study_id].dataset_status == "synthetic"):
                raise ValueError("evidence/study synthetic provenance mismatch")
        def check_refs(ids: list[str], study: str, synthetic: bool) -> None:
            for ref in ids:
                if ref not in evidence or evidence[ref].study_id != study:
                    raise ValueError("evidence reference is missing or belongs to another study")
                if (evidence[ref].provenance == "synthetic") != synthetic:
                    raise ValueError("synthetic and scientific evidence cannot be interchanged")
        for trial in self.trials:
            if trial.study_id not in studies:
                raise ValueError("trial references unknown study")
            if studies[trial.study_id].dataset_status == "metadata_only":
                raise ValueError("metadata_only studies cannot contain trials")
            if (trial.provenance == "synthetic") != (studies[trial.study_id].dataset_status == "synthetic"):
                raise ValueError("trial/study synthetic provenance mismatch")
            check_refs(trial.evidence_ids, trial.study_id, trial.provenance == "synthetic")
            for condition in trial.conditions.values():
                check_refs(condition.evidence_ids, trial.study_id, trial.provenance == "synthetic")
        for observation in self.observations:
            if observation.trial_id not in trials:
                raise ValueError("observation references unknown trial")
            trial = trials[observation.trial_id]
            if (observation.provenance == "synthetic") != (trial.provenance == "synthetic"):
                raise ValueError("observation/trial provenance mismatch")
            check_refs(observation.evidence_ids, trial.study_id, observation.provenance == "synthetic")
        return self


class RankingRequest(Contract):
    target: dict[ConditionKey, Scalar] = Field(default_factory=dict)
    required_match: list[ConditionKey] = Field(default_factory=list)
    vary: list[ConditionKey] = Field(default_factory=list)
    weights: dict[ConditionKey, Annotated[Number, Field(ge=0)]] = Field(default_factory=dict)
    study_ids: list[Identifier] = Field(default_factory=list)
    allow_synthetic: bool = False
    minimum_coverage: float = Field(default=0.6, ge=0, le=1)
    limit: int = Field(default=3, ge=1, le=50)

    @model_validator(mode="after")
    def policy(self) -> Self:
        if set(self.required_match) & set(self.vary):
            raise ValueError("required_match and vary must be disjoint")
        if not set(self.required_match).issubset(self.target):
            raise ValueError("required_match variables require target values")
        for key, value in self.target.items():
            validate_scalar(key, value)
        if not set(self.weights).issubset(self.target):
            raise ValueError("weights require matching target variables")
        return self


class RankingContribution(Contract):
    variable: ConditionKey
    target: Scalar | None
    candidate: Scalar | None
    weight: Number
    distance: float | None = Field(default=None, ge=0, le=1)
    note: str


class RankedTrial(Contract):
    trial_id: Identifier
    similarity: float | None = Field(default=None, ge=0, le=1)
    coverage: float = Field(ge=0, le=1)
    eligibility: Literal["eligible", "excluded", "indeterminate"]
    reasons: list[str]
    contributions: list[RankingContribution]
    evidence_ids: list[Identifier]
    provenance: Provenance


class RankingResponse(Contract):
    schema_version: Literal["1.0"] = "1.0"
    dataset_id: Identifier
    method: str = "compatibility_then_weighted_gower_v1"
    items: list[RankedTrial]
    excluded: list[RankedTrial]
    warnings: list[str]


class ComparisonRequest(Contract):
    trial_ids: list[Identifier] = Field(min_length=1, max_length=50)
    metric: Metric = "flame_spread_rate_mm_s"
    x_condition: ConditionKey = "flow_velocity_cm_s"
    vary: list[ConditionKey] = Field(default_factory=list)
    allow_synthetic: bool = False


class PlotPoint(Contract):
    trial_id: Identifier
    observation_id: Identifier
    independent_unit_id: Identifier
    x: Number | None
    y: Number
    group_id: str
    evidence_ids: list[Identifier]
    provenance: Provenance


class ComparisonGroup(Contract):
    id: str
    conditions: dict[str, str]
    trial_ids: list[Identifier]
    n_trials: int
    n_observations: int
    n_independent_units: int
    median: Number | None
    interval: None = None
    warnings: list[str]


class ComparisonResponse(Contract):
    metric: Metric
    unit: str
    x_condition: ConditionKey = "flow_velocity_cm_s"
    x_unit: str | None = "cm/s"
    groups: list[ComparisonGroup]
    points: list[PlotPoint]
    warnings: list[str]


class ProfileResponse(Contract):
    dataset_id: Identifier
    n_studies: int
    n_trials: int
    n_observations: int
    n_independent_units: int
    missing_by_condition: dict[str, dict[str, int]]
    missing_by_study: dict[str, dict[str, dict[str, int]]] = Field(default_factory=dict)
    issues: list[str]
    synthetic_trials: int


class Citation(Contract):
    evidence_id: Identifier
    trial_id: Identifier | None = None


class Claim(Contract):
    text: str
    kind: Literal["finding", "inference", "limitation"]
    citations: list[Citation]


class Hypothesis(Contract):
    id: Identifier
    statement: str
    rationale: str
    evidence_ids: list[Identifier]
    alternative_explanation: str
    next_measurement: str
    falsification: str
    label: Literal["ai_hypothesis", "prepared_demo_hypothesis"]


class ActivityEvent(Contract):
    sequence: int
    stage: Literal["plan", "retrieve", "analyze", "review", "complete", "error"]
    message: str
    evidence_ids: list[Identifier] = Field(default_factory=list)


class Panel(Contract):
    id: str
    kind: Literal["ranking", "comparison", "evidence", "hypotheses", "limitations"]
    title: str
    data_ref: Literal["ranking", "comparison", "evidence", "hypotheses", "warnings"]


class ResearchRequest(Contract):
    question: str = Field(min_length=3, max_length=4000)
    ranking: RankingRequest = Field(default_factory=RankingRequest)
    metric: Metric = "flame_spread_rate_mm_s"
    include_hypotheses: bool = True


class ResearchResponse(Contract):
    schema_version: Literal["1.0"] = "1.0"
    id: Identifier
    created_at: datetime
    provider: Literal["demo", "openai"]
    status: Literal["completed", "insufficient_evidence"]
    question: str
    summary: str
    claims: list[Claim]
    ranking: RankingResponse
    comparison: ComparisonResponse | None
    evidence: list[Evidence]
    hypotheses: list[Hypothesis]
    panels: list[Panel]
    events: list[ActivityEvent]
    warnings: list[str]

    @model_validator(mode="after")
    def response_integrity(self) -> Self:
        if self.created_at.utcoffset() is None or self.created_at.utcoffset().total_seconds() != 0:
            raise ValueError("created_at requires UTC timezone")
        if [x.sequence for x in self.events] != list(range(1, len(self.events) + 1)):
            raise ValueError("event sequences must be contiguous starting at one")
        available = {x.id for x in self.evidence}
        links = {x.trial_id: set(x.evidence_ids) for x in self.ranking.items}
        for claim in self.claims:
            if claim.kind == "finding" and not claim.citations:
                raise ValueError("findings require citations")
            for citation in claim.citations:
                if citation.evidence_id not in available:
                    raise ValueError("citation not in retrieved evidence")
                if citation.trial_id and citation.evidence_id not in links.get(citation.trial_id, set()):
                    raise ValueError("citation not linked to selected trial")
        for hypothesis in self.hypotheses:
            if not set(hypothesis.evidence_ids).issubset(available):
                raise ValueError("hypothesis evidence not retrieved")
        for event in self.events:
            if not set(event.evidence_ids).issubset(available):
                raise ValueError("event evidence not retrieved")
        for panel in self.panels:
            if panel.data_ref != {"limitations": "warnings"}.get(panel.kind, panel.kind):
                raise ValueError("panel kind/data_ref mismatch")
        return self


class ScenarioComparisonRequest(Contract):
    name_a: str = "Scenario A"
    name_b: str = "Scenario B"
    scenario_a: RankingRequest
    scenario_b: RankingRequest


class ScenarioComparisonResponse(Contract):
    name_a: str
    name_b: str
    ranking_a: RankingResponse
    ranking_b: RankingResponse
    warnings: list[str]
    label: Literal["evidence_comparison_not_physical_simulation"] = "evidence_comparison_not_physical_simulation"


class HealthResponse(Contract):
    status: Literal["ok", "degraded"]
    version: str
    schema_version: str
    database: str
    ai_provider: str
    data_mode: str


class ErrorResponse(Contract):
    code: str
    message: str
    request_id: str | None = None
