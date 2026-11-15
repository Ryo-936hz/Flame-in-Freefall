import asyncio

from flamelab.ai import chat
from flamelab.ai.provider import ProviderFailure
from flamelab.config import ROOT, Settings
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import ChatRequest


def test_app_help_and_corpus_counts_bypass_qwen(monkeypatch):
    async def unexpected(*args, **kwargs):
        raise AssertionError("A direct answer needs no model call")

    monkeypatch.setattr(chat, "choose", unexpected)
    bundle = load_bundle(ROOT / "data/fixtures/demo.json")
    settings = Settings(_env_file=None, ai_provider="qwen")
    help_answer = asyncio.run(chat.answer_chat(ChatRequest(question="¿Cómo actualizo una gráfica?"), bundle, settings, None))
    assert help_answer.sources[0].section == "canvas"
    totals = asyncio.run(chat.answer_chat(ChatRequest(question="¿Cuántos estudios hay?"), bundle, settings, None))
    assert f"{len(bundle.studies)} studies" in totals.answer


def test_chat_returns_retrieved_sources_on_model_failure(monkeypatch):
    calls = []

    async def unavailable(*args, **kwargs):
        calls.append((args, kwargs))
        raise ProviderFailure("qwen_unavailable")

    monkeypatch.setattr(chat, "choose", unavailable)
    bundle = load_bundle(ROOT / "data/fixtures/demo.json")
    question = ChatRequest(question="flame spread rate")
    answer = asyncio.run(chat.answer_chat(question, bundle, Settings(_env_file=None, ai_provider="qwen"), None))
    assert len(calls) == 1
    assert answer.provider == "catalog"
    available = {source.id for source in bundle.evidence}
    assert any(item.evidence_id in available for item in answer.sources)


def test_airflow_question_prioritizes_recorded_flow_over_unrelated_measurements():
    bundle = load_bundle(ROOT / "data/fixtures/demo.json")
    request = ChatRequest(question="Which evidence describes airflow in microgravity?")
    sources = chat.retrieve(request, bundle, None)
    assert sources and sources[0].text.startswith("Airflow velocity in microgravity:")
    assert sources[0].evidence_id
    assert all("recorded flame spread rate was" not in source.text for source in sources)


def test_qwen_can_select_an_existing_excerpt(monkeypatch):
    async def select_second(_question, options, _instruction, _settings, **_kwargs):
        assert options[1]["index"] == 1
        return [1]

    monkeypatch.setattr(chat, "choose", select_second)
    bundle = load_bundle(ROOT / "data/fixtures/demo.json")
    question = ChatRequest(question="flame spread rate")
    options = chat.retrieve(question, bundle, None)
    answer = asyncio.run(chat.answer_chat(question, bundle, Settings(_env_file=None, ai_provider="qwen"), None))
    assert answer.provider == "qwen"
    assert answer.sources == options[1:2]


def test_technical_method_has_a_scroll_free_answer_and_separate_details():
    bundle = load_bundle(ROOT / "data/fixtures/demo.json")
    question = ChatRequest(question="How does Gower similarity work?")
    answer = asyncio.run(chat.answer_chat(question, bundle, Settings(_env_file=None), None))
    assert "weighted Gower similarity" in answer.answer
    assert "Missing values reduce coverage" in answer.technical_details[0]
    assert answer.sources[0].section == "ranking"


def test_common_word_same_does_not_redirect_a_technical_question_to_a_study():
    bundle = load_bundle(ROOT / "data/fixtures/demo.json")
    question = ChatRequest(question="How does Gower compare the same values?")
    answer = asyncio.run(chat.answer_chat(question, bundle, Settings(_env_file=None), None))
    assert answer.sources[0].section == "ranking"
    assert chat.study_scope("Plot SAME and SAME-R") == {"psi:PSI-102", "psi:PSI-101"}
    assert chat.study_scope("What did same measure?") == {"psi:PSI-102"}


def test_comparison_action_uses_two_studies_from_the_active_corpus():
    bundle = load_bundle(ROOT / "data/fixtures/demo.json")
    studies = [bundle.studies[0].model_copy(update={"id": f"psi:PSI-{number}"}) for number in (25, 69)]
    bundle = bundle.model_copy(update={"studies": studies, "trials": [], "observations": [], "evidence": []})
    settings = Settings(_env_file=None)
    result = asyncio.run(chat.answer_chat(ChatRequest(question="Plot BASS-II and FLEX"), bundle, settings, None))
    assert result.comparison_studies == ["psi:PSI-25", "psi:PSI-69"]
    missing = asyncio.run(chat.answer_chat(ChatRequest(question="Plot BASS-II and PSI-999"), bundle, settings, None))
    assert not missing.comparison_studies


def test_unmatched_topic_offers_a_follow_up_that_retrieves_evidence():
    bundle = load_bundle(ROOT / "data/fixtures/demo.json")
    settings = Settings(_env_file=None)
    first = asyncio.run(chat.answer_chat(ChatRequest(question='¿Qué es el "Micro cosmos"?'), bundle, settings, None))
    assert first.answer == 'I couldn’t find anything related to “Micro cosmos” in FlameLab. Did you mean “microgravity”?'
    assert not first.sources
    assert first.suggested_question == "Show evidence about microgravity"
    for question in (first.suggested_question, "micro gravity"):
        follow_up = asyncio.run(chat.answer_chat(ChatRequest(question=question), bundle, settings, None))
        assert any(source.evidence_id for source in follow_up.sources)


def test_unrelated_question_does_not_invent_a_suggestion():
    bundle = load_bundle(ROOT / "data/fixtures/demo.json")
    response = asyncio.run(chat.answer_chat(ChatRequest(question="What is a sourdough starter?"), bundle, Settings(_env_file=None), None))
    assert not response.sources
    assert response.suggested_question is None
    assert "sourdough starter" in response.answer
