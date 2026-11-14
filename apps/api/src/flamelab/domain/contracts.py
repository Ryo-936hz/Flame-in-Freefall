"""Canonical public contract. Generate OpenAPI and TypeScript; never edit derived files."""

from datetime import datetime
from typing import Annotated, Literal, Self, get_args

from pydantic import (
    BaseModel, ConfigDict, Field, StrictFloat, StrictInt, StrictStr, model_validator,
)

Number = StrictFloat | StrictInt
Scalar = Number | StrictStr
ConditionKey = Literal[
    "oxygen_pct", "oxygen_initial_pct", "oxygen_final_pct", "pressure_kpa",
    "flow_velocity_cm_s", "material", "geometry", "combustion_face", "thickness_mm",
    "diameter_mm", "sample_width_mm", "flow_direction", "gravity_regime",
    "burning_faces", "burn_duration_s",
    "test_end", "test_configuration", "aging_duration_s", "ignition_power_w",
    "ignition_duration_s",
]
Metric = Literal[
    "flame_spread_rate_mm_s", "extinction_oxygen_pct", "heat_release_w",
    "flex_burn_duration_s", "flex_visible_flame_extinction_diameter_mm",
    "same_reported_mass_loss_rate_mg_min", "samer_run_duration_s", "samer_net_aging_time_s",
    "samer_primary_aging_time_s", "samer_primary_mixing_time_s",
    "saffire_reported_burn_duration_s", "peak_burner_temperature_k",
    "cfig_reported_run_duration_s", "other",
]
MissingStatus = Literal["known", "not_measured", "not_reported", "not_extracted", "not_applicable"]
Provenance = Literal["published", "digitized", "derived", "synthetic"]
Identifier = Annotated[str, Field(min_length=3, max_length=240, pattern=r"^[A-Za-z0-9_.-]+:[A-Za-z0-9_.:-]+$")]
CONDITION_KEYS = get_args(ConditionKey)
CONDITION_UNITS = {
    "oxygen_pct": "%", "pressure_kpa": "kPa", "flow_velocity_cm_s": "cm/s",
    "thickness_mm": "mm", "diameter_mm": "mm", "sample_width_mm": "mm",
    "oxygen_initial_pct": "%", "oxygen_final_pct": "%", "burning_faces": "count",
    "burn_duration_s": "s",
    "aging_duration_s": "s", "ignition_power_w": "W", "ignition_duration_s": "s",
}
TRIAL_ONLY_CONDITIONS = frozenset({
    "oxygen_initial_pct", "oxygen_final_pct", "burn_duration_s",
})
METRIC_UNITS = {
    "flame_spread_rate_mm_s": "mm/s", "extinction_oxygen_pct": "%", "heat_release_w": "W",
    "flex_burn_duration_s": "s", "flex_visible_flame_extinction_diameter_mm": "mm",
    "same_reported_mass_loss_rate_mg_min": "mg/min", "samer_run_duration_s": "s",
    "samer_net_aging_time_s": "s", "samer_primary_aging_time_s": "s",
    "samer_primary_mixing_time_s": "s",
    "saffire_reported_burn_duration_s": "s", "peak_burner_temperature_k": "K",
    "cfig_reported_run_duration_s": "s",
}
METRIC_STUDIES = {
    "flex_burn_duration_s": {"psi:PSI-69"},
    "flex_visible_flame_extinction_diameter_mm": {"psi:PSI-69"},
    "same_reported_mass_loss_rate_mg_min": {"psi:PSI-102"},
    "samer_run_duration_s": {"psi:PSI-101"},
    "samer_net_aging_time_s": {"psi:PSI-101"},
    "samer_primary_aging_time_s": {"psi:PSI-101"},
    "samer_primary_mixing_time_s": {"psi:PSI-101"},
    "saffire_reported_burn_duration_s": {"psi:PSI-98"},
    "peak_burner_temperature_k": {"psi:PSI-159"},
    "cfig_reported_run_duration_s": {"psi:PSI-159"},
}


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False, strict=True)


def validate_scalar(key: str, value: Scalar) -> None:
    if key in CONDITION_UNITS:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{key} requires a number")
        if value < 0 or (key in {"oxygen_pct", "oxygen_initial_pct", "oxygen_final_pct"} and value > 100):
            raise ValueError(f"{key} is outside the admissible range")
        if key == "burning_faces" and (not isinstance(value, int) or value == 0):
            raise ValueError("burning_faces requires a positive integer")
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


def validate_conditions(conditions: dict[ConditionKey, ConditionValue]) -> None:
    for key, condition in conditions.items():
        if condition.status == "known":
            validate_scalar(key, condition.value)
            if condition.unit != CONDITION_UNITS.get(key):
                raise ValueError(f"{key} must use canonical unit {CONDITION_UNITS.get(key)}")
            if not condition.evidence_ids:
                raise ValueError("known conditions require evidence")


class ConditionSegment(Contract):
    """Source-reported effective conditions within one physical trial."""

    id: Identifier
    sequence: Annotated[StrictInt, Field(ge=1)]
    conditions: dict[ConditionKey, ConditionValue]
    evidence_ids: list[Identifier] = Field(min_length=1)

    @model_validator(mode="after")
    def typed_conditions(self) -> Self:
        if {"oxygen_initial_pct", "oxygen_final_pct"} & self.conditions.keys():
            raise ValueError("oxygen_initial_pct and oxygen_final_pct are trial-only conditions")
        validate_conditions(self.conditions)
        return self


class Trial(Contract):
    id: Identifier
    study_id: Identifier
    sample_id: Identifier
    independent_unit_id: Identifier
    independent_unit_status: Literal["identified", "unresolved"] = "identified"
    label: str
    conditions: dict[ConditionKey, ConditionValue]
    evidence_ids: list[Identifier] = Field(min_length=1)
    provenance: Provenance
    material_grade: str | None = None
    notes: list[str] = Field(default_factory=list)
    segments: list[ConditionSegment] = Field(default_factory=list)

    @model_validator(mode="after")
    def typed_conditions(self) -> Self:
        validate_conditions(self.conditions)
        if len({segment.id for segment in self.segments}) != len(self.segments):
            raise ValueError("segment identifiers must be unique within a trial")
        if len({segment.sequence for segment in self.segments}) != len(self.segments):
            raise ValueError("segment sequence must be unique within a trial")
        return self


class Observation(Contract):
    id: Identifier
    trial_id: Identifier
    segment_id: Identifier | None = None
    metric: Metric
    value: Number | None = None
    unit: str
    original_value: str | None = None
    original_unit: str | None = None
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


class StudyEvidencePage(Contract):
    total: int = Field(ge=0)
    offset: int = Field(ge=0)
    items: list[Evidence]


class StudyObservationPage(Contract):
    total: int = Field(ge=0)
    offset: int = Field(ge=0)
    items: list[Observation]


class DatasetBundle(Contract):
    schema_version: Literal["1.0", "1.1"] = "1.1"
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
        segment_trials: dict[str, str] = {}
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
            condition_maps = [trial.conditions]
            for segment in trial.segments:
                if segment.id in segment_trials:
                    raise ValueError("segment identifiers must be unique in the dataset")
                segment_trials[segment.id] = trial.id
                check_refs(segment.evidence_ids, trial.study_id, trial.provenance == "synthetic")
                condition_maps.append(segment.conditions)
            for conditions in condition_maps:
                for condition in conditions.values():
                    check_refs(condition.evidence_ids, trial.study_id, trial.provenance == "synthetic")
        for observation in self.observations:
            if observation.trial_id not in trials:
                raise ValueError("observation references unknown trial")
            trial = trials[observation.trial_id]
            if observation.segment_id is not None and segment_trials.get(observation.segment_id) != trial.id:
                raise ValueError("observation segment reference is missing or belongs to another trial")
            if (observation.provenance == "synthetic") != (trial.provenance == "synthetic"):
                raise ValueError("observation/trial provenance mismatch")
            allowed_studies = METRIC_STUDIES.get(observation.metric)
            if allowed_studies and trial.study_id not in allowed_studies:
                raise ValueError("campaign-specific metric belongs to a different study")
            check_refs(observation.evidence_ids, trial.study_id, observation.provenance == "synthetic")
        return self


class RankingRequest(Contract):
    condition_scope: Literal["trial", "segment"] = "trial"
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
    scored_segment_id: Identifier | None = None
    eligible_segment_ids: list[Identifier] = Field(default_factory=list)
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
    segment_ids: list[Identifier] = Field(default_factory=list)
    metric: Metric = "flame_spread_rate_mm_s"
    x_condition: ConditionKey = "flow_velocity_cm_s"
    vary: list[ConditionKey] = Field(default_factory=list)
    allow_synthetic: bool = False


class PlotPoint(Contract):
    trial_id: Identifier
    observation_id: Identifier
    segment_id: Identifier | None = None
    independent_unit_id: Identifier
    independent_unit_status: Literal["identified", "unresolved"] = "identified"
    x: Number | None
    y: Number
    original_value: str | None = None
    original_unit: str | None = None
    group_id: str
    evidence_ids: list[Identifier]
    provenance: Provenance


class ComparisonGroup(Contract):
    id: str
    conditions: dict[str, str]
    trial_ids: list[Identifier]
    n_trials: int
    n_segments: int = 0
    n_observations: int
    n_independent_units: int
    n_trials_with_unresolved_independence: int = 0
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
    n_segments: int = 0
    n_observations: int
    n_independent_units: int
    n_trials_with_unresolved_independence: int = 0
    missing_by_condition: dict[str, dict[str, int]]
    missing_by_segment_condition: dict[str, dict[str, int]] = Field(default_factory=dict)
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


class ResearchPlan(Contract):
    """Inspectable deterministic plan; it is not a model-generated program."""

    planning_mode: Literal["explicit", "catalog"] = "explicit"
    intent: Literal[
        "explicit_filters", "compare_varying_flow", "scenario_change",
        "assess_evidence", "ambiguous", "unsupported",
    ]
    ranking: RankingRequest
    metric: Metric
    x_condition: ConditionKey | None = None
    message: str
    blocked: bool = False
    limits: list[str] = Field(default_factory=list)


class ResearchRequest(Contract):
    planning_mode: Literal["explicit", "catalog"] = "explicit"
    question: str = Field(min_length=3, max_length=4000)
    ranking: RankingRequest = Field(default_factory=RankingRequest)
    metric: Metric = "flame_spread_rate_mm_s"
    include_hypotheses: bool = True


class StudySearchRequest(Contract):
    question: str = Field(min_length=3, max_length=500)


class StudySearchResponse(Contract):
    provider: Literal["catalog", "qwen"]
    studies: list[Study]


class ChatRequest(Contract):
    question: str = Field(min_length=3, max_length=500)
    previous_question: str | None = Field(default=None, max_length=500)
    research_id: Identifier | None = None


class ChatSource(Contract):
    title: str
    text: str
    section: Literal["dashboard", "brief", "canvas", "ranking", "lab", "catalog", "evidence", "synthesis"]
    study_id: Identifier | None = None
    evidence_id: Identifier | None = None
    research_id: Identifier | None = None


class ChatResponse(Contract):
    provider: Literal["catalog", "qwen"]
    answer: str
    technical_details: list[str] = Field(default_factory=list, max_length=3)
    sources: list[ChatSource] = Field(max_length=3)
    elapsed_ms: int
    comparison_studies: list[Identifier] = Field(default_factory=list, max_length=2)
    suggested_question: str | None = None


class StudyMetricSummary(Contract):
    metric: Metric
    unit: str
    known_observations: int
    median: Number


class StudyChartData(Contract):
    study: Study
    metrics: list[StudyMetricSummary]


class ResearchResponse(Contract):
    schema_version: Literal["1.0"] = "1.0"
    # Optional to preserve pre-planner research snapshots without recalculation.
    plan: ResearchPlan | None = None
    id: Identifier
    created_at: datetime
    provider: Literal["demo", "openai", "qwen"]
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
        if self.plan is not None:
            if self.plan.blocked and (
                self.status != "insufficient_evidence" or self.ranking.items
                or self.comparison is not None or self.claims or self.evidence or self.hypotheses
            ):
                raise ValueError("blocked plan cannot contain executed analysis")
            if self.comparison is not None and self.comparison.metric != self.plan.metric:
                raise ValueError("comparison metric differs from the inspected plan")
            if (self.comparison is not None and self.plan.x_condition is not None
                    and self.comparison.x_condition != self.plan.x_condition):
                raise ValueError("comparison axis differs from the inspected plan")
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
    metric: Metric | None = None
    name_a: str = "Scenario A"
    name_b: str = "Scenario B"
    scenario_a: RankingRequest
    scenario_b: RankingRequest
    question: str | None = Field(default=None, min_length=3, max_length=500)


class ScenarioComparisonResponse(Contract):
    metric: Metric | None = None
    name_a: str
    name_b: str
    ranking_a: RankingResponse
    ranking_b: RankingResponse
    warnings: list[str]
    highlighted_trial_ids: list[Identifier] | None = None
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
