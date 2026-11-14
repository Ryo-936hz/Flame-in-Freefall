"""Public plan validation and compatibility; all observations are synthetic fixtures."""

import asyncio

import pytest
from pydantic import ValidationError

from flamelab.ai.engine import run_research
from flamelab.config import ROOT, Settings
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import ResearchPlan, ResearchRequest, ResearchResponse


def test_explicit_mode_is_backward_compatible_and_plan_uses_canonical_ranking():
    request = ResearchRequest(question="Use the visible filters")
    assert request.planning_mode == "explicit"
    plan = ResearchPlan(
        intent="explicit_filters", ranking=request.ranking,
        metric=request.metric, message="Structured filters only",
    )
    assert plan.ranking == request.ranking
    assert not plan.blocked and plan.limits == []
    data = plan.model_dump()
    data["ranking"].update(target={"oxygen_pct": 21}, vary=["oxygen_pct"],
                           required_match=["oxygen_pct"])
    with pytest.raises(ValidationError):
        ResearchPlan.model_validate(data)


@pytest.mark.parametrize("mode", ["automatic", True, 1, None])
def test_unknown_planning_mode_is_not_silently_coerced(mode):
    with pytest.raises(ValidationError):
        ResearchRequest(question="Synthetic contract test", planning_mode=mode)


@pytest.fixture
def research_payload():
    bundle = load_bundle(ROOT / "data/fixtures/demo.json")
    request = ResearchRequest(
        question="Synthetic plan contract check",
        ranking={"target": {"gravity_regime": "microgravity"},
                 "required_match": ["gravity_regime"], "vary": ["flow_velocity_cm_s"],
                 "allow_synthetic": True},
    )
    response = asyncio.run(run_research(request, bundle, Settings(_env_file=None, ai_provider="demo")))
    assert response.status == "completed" and response.comparison.points
    payload = response.model_dump()
    payload["plan"] = ResearchPlan(
        intent="explicit_filters", ranking=request.ranking, metric=request.metric,
        x_condition="flow_velocity_cm_s", message="Synthetic contract check",
    ).model_dump()
    return payload


def test_historical_research_without_plan_is_read_without_recalculation(research_payload):
    research_payload.pop("plan")
    restored = ResearchResponse.model_validate(research_payload)
    assert restored.plan is None
    assert restored.comparison.model_dump() == research_payload["comparison"]
    assert restored.ranking.model_dump() == research_payload["ranking"]


def test_blocked_plan_cannot_claim_completed_analysis(research_payload):
    research_payload["plan"]["blocked"] = True
    with pytest.raises(ValidationError, match="blocked plan"):
        ResearchResponse.model_validate(research_payload)


@pytest.mark.parametrize("field,value", [
    ("metric", "heat_release_w"), ("x_condition", "oxygen_pct"),
])
def test_response_cannot_disagree_with_inspected_metric_or_axis(research_payload, field, value):
    research_payload["plan"][field] = value
    with pytest.raises(ValidationError, match="differs from the inspected plan"):
        ResearchResponse.model_validate(research_payload)


def test_blocked_plan_with_no_analysis_remains_serializable(research_payload):
    research_payload.update(status="insufficient_evidence", comparison=None, claims=[],
                            evidence=[], hypotheses=[], events=[])
    research_payload["ranking"].update(items=[], excluded=[])
    research_payload["plan"].update(blocked=True, intent="ambiguous")
    restored = ResearchResponse.model_validate(research_payload)
    assert restored.plan.blocked and not restored.ranking.items
