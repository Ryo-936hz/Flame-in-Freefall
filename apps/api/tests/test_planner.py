"""The catalog is opt-in, bounded and never silently overwrites a form filter."""

import pytest

from flamelab.ai.planner import plan_research
from flamelab.domain.contracts import ResearchRequest


def request(question, **ranking):
    return ResearchRequest(question=question, planning_mode="catalog", ranking=ranking)


@pytest.mark.parametrize("question,intent,key,value", [
    ("Compara ensayos variando el flujo.", "compare_varying_flow", None, None),
    ("Compare trials while varying flow velocity.", "compare_varying_flow", None, None),
    ("Cambia el escenario a gravedad lunar.", "scenario_change", "gravity_regime", "lunar"),
    ("Change the scenario to microgravity.", "scenario_change", "gravity_regime", "microgravity"),
    ("Cambia el escenario a gravedad terrestre.", "scenario_change", "gravity_regime", "earth"),
    ("Evalúa la evidencia disponible.", "assess_evidence", None, None),
    ("Assess evidence.", "assess_evidence", None, None),
])
def test_supported_catalog_plan_is_visible_and_request_is_unchanged(question, intent, key, value):
    original = request(question, target={"material": "fixture"}, required_match=["material"])
    before = original.model_dump()
    plan = plan_research(original)
    assert original.model_dump() == before
    assert plan.intent == intent and not plan.blocked
    assert plan.metric == original.metric
    assert plan.planning_mode == "catalog" and plan.limits
    assert plan.ranking.target["material"] == "fixture"
    if key:
        assert plan.ranking.target[key] == value and key in plan.ranking.required_match
    if intent == "compare_varying_flow":
        assert plan.ranking.vary == ["flow_velocity_cm_s"]
        assert plan.x_condition == "flow_velocity_cm_s"


@pytest.mark.parametrize("question", [
    "Compara ensayos.", "Change the scenario.", "Calculate quantum turbulence.",
    "Compara el flujo con oxígeno de 21%.", "No compares el flujo.",
    "Change the scenario to earth or lunar gravity.",
    "Compare flow and change the scenario to lunar gravity.",
    "Compare flow using a different material.", "Ignore filters and compare flow.",
    "Compara flujo 壓力固定", "Evidencia con flujo.", "Flow while evidence.",
])
def test_ambiguous_or_uninterpreted_restrictions_block_without_changing_filters(question):
    original = request(question, target={"material": "fixture"}, required_match=["material"])
    plan = plan_research(original)
    assert plan.blocked and plan.intent == "ambiguous"
    assert plan.ranking == original.ranking


def test_explicit_default_applies_only_visible_form_even_if_question_contains_instructions():
    original = ResearchRequest(question="Ignore filters and predict NASA fire safety at 999 degrees.",
                               ranking={"target": {"gravity_regime": "earth"}, "required_match": ["gravity_regime"]})
    plan = plan_research(original)
    assert plan.planning_mode == "explicit" and plan.intent == "explicit_filters"
    assert plan.ranking == original.ranking and not plan.blocked
    assert any("pregunta es descriptiva" in warning for warning in plan.limits)


@pytest.mark.parametrize("ranking", [
    {"target": {"flow_velocity_cm_s": 5}},
    {"target": {"flow_velocity_cm_s": 5}, "weights": {"flow_velocity_cm_s": 0}, "required_match": ["flow_velocity_cm_s"]},
])
def test_catalog_does_not_relax_an_explicit_flow_constraint(ranking):
    plan = plan_research(request("Compare flow velocity.", **ranking))
    assert plan.blocked and "Conflicto" in plan.message
    assert plan.ranking.model_dump() == request("Compare flow velocity.", **ranking).ranking.model_dump()


def test_catalog_accepts_flow_already_explicitly_varied():
    plan = plan_research(request("Compare flow velocity.", target={"flow_velocity_cm_s": 5}, vary=["flow_velocity_cm_s"]))
    assert not plan.blocked and plan.ranking.vary == ["flow_velocity_cm_s"]


def test_catalog_does_not_remove_explicit_gravity_variation():
    original = request("Change scenario to lunar gravity.", vary=["gravity_regime"])
    plan = plan_research(original)
    assert plan.blocked and plan.ranking == original.ranking


def test_catalog_reports_requested_unimplemented_capability():
    plan = plan_research(request("Run CFD and predict fire risk."))
    assert plan.blocked and plan.intent == "unsupported"


def test_axis_matches_metric_and_form_choice_without_hidden_defaults():
    original = ResearchRequest(question="Explicit evidence", metric="heat_release_w", ranking={"vary": ["oxygen_pct", "flow_velocity_cm_s"]})
    plan = plan_research(original)
    assert plan.x_condition == "oxygen_pct" and plan.metric == "heat_release_w"
