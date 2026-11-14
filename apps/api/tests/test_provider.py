"""Provider protocol tests use only MockTransport; no credentials or network calls."""

import asyncio
import json
from pathlib import Path

import httpx
import pytest
from pydantic import ValidationError

from flamelab.ai import engine
from flamelab.ai.provider import Narrative, ProviderFailure, synthesize
from flamelab.config import Settings
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import Citation, Claim, RankingRequest, ResearchRequest

ROOT = Path(__file__).resolve().parents[3]


def provider_settings(**updates):
    return Settings(_env_file=None, ai_provider="openai", openai_model="test-model",
                    openai_api_key="test-only-not-a-real-key", **updates)


def request():
    return ResearchRequest(
        question="Comparar fixtures sintéticos.",
        ranking=RankingRequest(
            target={"material": "demo_polymer", "geometry": "sheet",
                    "gravity_regime": "microgravity", "flow_velocity_cm_s": 5},
            required_match=["material", "geometry", "gravity_regime"],
            vary=["flow_velocity_cm_s"], allow_synthetic=True,
        ),
    )


def completed(text):
    return {"status": "completed", "output": [{"type": "message", "content": [
        {"type": "output_text", "text": text},
    ]}]}


def test_valid_structured_response_uses_bounded_server_protocol():
    calls = []

    def handler(req):
        calls.append(req)
        body = json.loads(req.content)
        assert req.method == "POST"
        assert str(req.url) == "https://api.openai.com/v1/responses"
        assert body["store"] is False
        assert body["max_output_tokens"] == 2500
        assert body["text"]["format"]["strict"] is True
        assert body["model"] == "test-model"
        assert "test-only-not-a-real-key" not in req.content.decode()
        assert "tools" not in body
        schema = body["text"]["format"]["schema"]
        assert schema["additionalProperties"] is False
        assert set(schema["required"]) == set(schema["properties"])
        return httpx.Response(200, json=completed(json.dumps({
            "summary": "Datos sintéticos; síntesis de prueba.", "claims": [],
        })))

    result = asyncio.run(synthesize({"question": "test", "evidence": []},
                                   provider_settings(), httpx.MockTransport(handler)))
    assert result.summary == "Datos sintéticos; síntesis de prueba."
    assert len(calls) == 1


@pytest.mark.parametrize(("body", "code"), [
    ({"status": "completed", "output": [{"type": "message", "content": [
        {"type": "refusal", "refusal": "No."}]}]}, "provider_refusal"),
    ({"status": "incomplete", "output": []}, "provider_incomplete"),
    (completed("not JSON"), "provider_invalid_response"),
    (completed('{"summary":"ok","claims":[],"unexpected":true}'),
     "provider_invalid_response"),
    ([], "provider_invalid_response"),
])
def test_invalid_or_refused_responses_fail_explicitly(body, code):
    transport = httpx.MockTransport(lambda _req: httpx.Response(200, json=body))
    with pytest.raises(ProviderFailure) as failure:
        asyncio.run(synthesize({}, provider_settings(), transport))
    assert failure.value.code == code
    assert failure.value.status == 503


def test_timeout_is_504_without_retry_or_fallback():
    calls = []

    def timeout(req):
        calls.append(req)
        raise httpx.ReadTimeout("private upstream diagnostic", request=req)

    with pytest.raises(ProviderFailure) as failure:
        asyncio.run(synthesize({}, provider_settings(), httpx.MockTransport(timeout)))
    assert failure.value.code == "provider_timeout"
    assert failure.value.status == 504
    assert "private upstream" not in str(failure.value)
    assert len(calls) == 1


@pytest.mark.parametrize("status", [302, 401, 429, 500])
def test_non_success_http_does_not_follow_redirect_or_expose_body(status):
    calls = []

    def handler(req):
        calls.append(req)
        return httpx.Response(status, headers={"location": "https://untrusted.invalid"},
                              text="sensitive upstream detail")

    with pytest.raises(ProviderFailure) as failure:
        asyncio.run(synthesize({}, provider_settings(), httpx.MockTransport(handler)))
    assert failure.value.code == "provider_unavailable"
    assert "sensitive" not in str(failure.value)
    assert len(calls) == 1


def test_context_limit_stops_before_transport():
    def unexpected(_req):
        raise AssertionError("context guard must run before any provider request")

    with pytest.raises(ProviderFailure, match="provider_context_limit"):
        asyncio.run(synthesize({"text": "a" * 2000},
                               provider_settings(ai_max_context_chars=1000),
                               httpx.MockTransport(unexpected)))


def test_invented_citation_is_rejected_by_engine(monkeypatch):
    async def invented(_context, _settings):
        return Narrative(summary="Citation attack", claims=[Claim(
            text="Unsupported finding", kind="finding",
            citations=[Citation(evidence_id="invented:evidence", trial_id="synthetic:trial-1")],
        )])

    monkeypatch.setattr(engine, "synthesize", invented)
    with pytest.raises(ProviderFailure, match="provider_invalid_citations"):
        asyncio.run(engine.run_research(request(), load_bundle(ROOT / "data/fixtures/demo.json"),
                                        provider_settings()))


def test_external_failure_does_not_become_demo_result(monkeypatch):
    async def failed(_context, _settings):
        raise ProviderFailure("provider_unavailable")

    monkeypatch.setattr(engine, "synthesize", failed)
    with pytest.raises(ProviderFailure, match="provider_unavailable"):
        asyncio.run(engine.run_research(request(), load_bundle(ROOT / "data/fixtures/demo.json"),
                                        provider_settings()))


@pytest.mark.parametrize(("key", "model"), [(None, None), ("test-only", None), (None, "test-model")])
def test_external_provider_requires_server_key_and_explicit_model(key, model):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, ai_provider="openai", openai_api_key=key, openai_model=model)
