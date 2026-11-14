import json
import logging
import re
from contextlib import asynccontextmanager
from statistics import median
from threading import Lock
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.concurrency import run_in_threadpool
from starlette.exceptions import HTTPException

from flamelab.ai.engine import run_research
from flamelab.ai.chat import answer_chat
from flamelab.ai.planner import plan_research
from flamelab.ai.provider import ProviderFailure
from flamelab.ai.report import render_report
from flamelab.config import Settings
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import (
    ChatRequest, ChatResponse, ComparisonRequest, ComparisonResponse, ErrorResponse, Evidence, HealthResponse,
    DatasetBundle, Metric, Observation, ProfileResponse, RankingRequest, RankingResponse, ResearchPlan, ResearchRequest, ResearchResponse,
    ScenarioComparisonRequest, ScenarioComparisonResponse, Study, StudyEvidencePage,
    StudyChartData, StudyMetricSummary, StudyObservationPage, StudySearchRequest, StudySearchResponse, Trial,
)
from flamelab.science.comparison import compare_trials
from flamelab.science.profiling import profile_dataset
from flamelab.science.ranking import rank_trials
from flamelab.storage.database import create_engine_and_session, migrate
from flamelab.storage.models import ActiveDataset
from flamelab.storage.repository import Repository

logger = logging.getLogger("flamelab")


def get_study(data: DatasetBundle, study_id: str) -> Study:
    for study in data.studies:
        if study.id == study_id:
            return study
    raise KeyError(study_id)


def observations_for_study(data: DatasetBundle, study_id: str) -> list[Observation]:
    trial_ids = {trial.id for trial in data.trials if trial.study_id == study_id}
    return [observation for observation in data.observations if observation.trial_id in trial_ids]


def create_app(settings: Settings | None = None) -> FastAPI:
    config = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        migrate(config)
        engine, sessions = create_engine_and_session(config)
        app.state.engine, app.state.sessions = engine, sessions
        if config.seed_demo:
            with sessions() as session:
                if session.get(ActiveDataset, 1) is None:
                    Repository(session).replace_bundle(load_bundle(config.fixture_path))
        try:
            yield
        finally:
            engine.dispose()

    errors = {code: {"model": ErrorResponse} for code in (404, 422, 500, 503, 504)}
    app = FastAPI(title="FlameLab SI", version="0.1.0", lifespan=lifespan, responses=errors)
    app.state.settings = config
    app.add_middleware(CORSMiddleware, allow_origins=config.cors_origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type"], expose_headers=["X-Request-ID"])

    @app.middleware("http")
    async def request_id(request: Request, call_next):
        request.state.request_id = uuid4().hex
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        logger.info("request_id=%s method=%s status=%s", request.state.request_id, request.method, response.status_code)
        return response

    def error(request, code, message, status):
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(ErrorResponse(code=code, message=message, request_id=request_id).model_dump(), status_code=status, headers={"X-Request-ID": request_id or ""})

    @app.exception_handler(RequestValidationError)
    async def invalid(request, _exc):
        return error(request, "validation_error", "Solicitud inválida: revisa campos, valores y restricciones del contrato.", 422)

    @app.exception_handler(KeyError)
    async def missing(request, _exc):
        return error(request, "not_found", "Entidad no encontrada.", 404)

    @app.exception_handler(HTTPException)
    async def http_error(request, exc):
        return error(request, "http_error", "Ruta u operación no disponible.", exc.status_code)

    @app.exception_handler(ProviderFailure)
    async def provider_error(request, exc):
        return error(request, exc.code, "El proveedor externo no pudo completar una respuesta válida.", exc.status)

    @app.exception_handler(SQLAlchemyError)
    async def storage_error(request, _exc):
        return error(request, "storage_unavailable", "Almacén no disponible.", 503)

    @app.exception_handler(Exception)
    async def internal_error(request, _exc):
        return error(request, "internal_error", "Error interno; consulta el identificador de petición.", 500)

    # One read-only snapshot per app process. The database pointer is checked
    # on every read so external imports of the same dataset ID are also seen.
    bundle_lock = Lock()
    active_snapshot: tuple[str | None, DatasetBundle] | None = None

    def bundle() -> DatasetBundle:
        nonlocal active_snapshot
        with bundle_lock, app.state.sessions() as session:
            repository = Repository(session)
            digest = repository.get_active_digest()
            if active_snapshot is None or active_snapshot[0] != digest:
                active_snapshot = (digest, repository.get_snapshot(digest))
            return active_snapshot[1]

    def saved(run_id):
        with app.state.sessions() as session:
            return Repository(session).get_run(run_id)

    def save_research(response: ResearchResponse, data: DatasetBundle) -> None:
        with app.state.sessions() as session:
            Repository(session).save_run(response, data)

    @app.get("/api/v1/health", response_model=HealthResponse)
    def health():
        data = bundle()
        synthetic = sum(trial.provenance == "synthetic" for trial in data.trials)
        mode = "empty" if not data.studies else "metadata_only" if not data.trials else "synthetic" if synthetic == len(data.trials) else "mixed" if synthetic else "scientific_unverified"
        return HealthResponse(status="ok", version="0.1.0", schema_version="1.1", database=app.state.engine.dialect.name, ai_provider=config.ai_provider, data_mode=mode)

    @app.get("/api/v1/studies", response_model=list[Study])
    def studies():
        return bundle().studies

    @app.get("/api/v1/studies/{study_id}/evidence", response_model=StudyEvidencePage)
    def study_evidence(study_id: str, offset: int = Query(0, ge=0),
                       limit: int = Query(50, ge=1, le=200)):
        data = bundle()
        get_study(data, study_id)
        items = [entry for entry in data.evidence if entry.study_id == study_id]
        return StudyEvidencePage(total=len(items), offset=offset, items=items[offset:offset + limit])

    @app.get("/api/v1/studies/{study_id}/observations", response_model=StudyObservationPage)
    def study_observations(study_id: str, offset: int = Query(0, ge=0),
                           limit: int = Query(50, ge=1, le=200), metric: Metric | None = None):
        data = bundle()
        get_study(data, study_id)
        items = observations_for_study(data, study_id)
        if metric is not None:
            items = [entry for entry in items if entry.metric == metric]
        return StudyObservationPage(total=len(items), offset=offset, items=items[offset:offset + limit])

    @app.get("/api/v1/studies/{study_id}/chart", response_model=StudyChartData)
    def study_chart(study_id: str):
        data = bundle()
        study = get_study(data, study_id)
        values = {}
        for observation in observations_for_study(data, study_id):
            if observation.value is not None and observation.metric != "other":
                values.setdefault((observation.metric, observation.unit), []).append(observation.value)
        return StudyChartData(study=study, metrics=[StudyMetricSummary(metric=metric, unit=unit,
            known_observations=len(points), median=median(points)) for (metric, unit), points in sorted(values.items())])

    @app.get("/api/v1/trials", response_model=list[Trial])
    def trials(study_id: str | None = None):
        return [item for item in bundle().trials if study_id is None or item.study_id == study_id]

    @app.get("/api/v1/trials/{trial_id}", response_model=Trial)
    def trial(trial_id: str):
        for item in bundle().trials:
            if item.id == trial_id:
                return item
        raise KeyError(trial_id)

    @app.get("/api/v1/evidence/{evidence_id}", response_model=Evidence)
    def evidence(evidence_id: str, research_id: str | None = None):
        # Optional run context resolves source identities after a corpus replacement.
        corpus = saved(research_id).evidence if research_id else bundle().evidence
        for item in corpus:
            if item.id == evidence_id:
                return item
        raise KeyError(evidence_id)

    @app.get("/api/v1/datasets/profile", response_model=ProfileResponse)
    def profile():
        return profile_dataset(bundle())

    @app.post("/api/v1/chat", response_model=ChatResponse)
    async def chat(request: ChatRequest):
        started = perf_counter()
        data = await run_in_threadpool(bundle)
        run = await run_in_threadpool(saved, request.research_id) if request.research_id else None
        return await answer_chat(request, data, config, run, started_at=started)

    @app.post("/api/v1/rankings", response_model=RankingResponse)
    def rank(request: RankingRequest):
        return rank_trials(bundle(), request)

    @app.post("/api/v1/studies/search", response_model=StudySearchResponse)
    def search_studies(request: StudySearchRequest):
        words = set(re.findall(r"\w{4,}", request.question.casefold()))
        studies = bundle().studies
        def score(study):
            searchable = set(re.findall(r"\w{4,}", f"{study.id} {study.title} {study.family} {study.description or ''}".casefold()))
            return len(words & searchable)
        ranked = sorted(studies, key=score, reverse=True)
        return StudySearchResponse(provider="catalog", studies=[study for study in ranked if score(study)][:3])

    @app.post("/api/v1/comparisons", response_model=ComparisonResponse)
    def compare(request: ComparisonRequest):
        return compare_trials(bundle(), request)

    @app.post("/api/v1/research/plan", response_model=ResearchPlan)
    def research_plan(request: ResearchRequest):
        # Preview is pure: no corpus read, analysis, persistence or provider call.
        return plan_research(request)

    @app.post("/api/v1/research", response_model=ResearchResponse)
    async def research(request: ResearchRequest):
        data = await run_in_threadpool(bundle)
        response = await run_research(request, data, config)
        await run_in_threadpool(save_research, response, data)
        return response

    @app.get("/api/v1/research/{run_id}", response_model=ResearchResponse)
    def get_research(run_id: str):
        return saved(run_id)

    @app.get("/api/v1/research/{run_id}/events", response_class=StreamingResponse, responses={200: {"content": {"text/event-stream": {"schema": {"type": "string"}}}, "description": "Replay of persisted events, not live streaming"}})
    def events(run_id: str):
        run = saved(run_id)
        def replay():
            yield 'event: replay\ndata: {"replay":true,"live":false}\n\n'
            for event in run.events:
                yield f"id: {event.sequence}\nevent: activity\ndata: {json.dumps(event.model_dump(), ensure_ascii=False)}\n\n"
        return StreamingResponse(replay(), media_type="text/event-stream", headers={"Cache-Control": "no-store", "X-Event-Mode": "replay"})

    @app.get("/api/v1/research/{run_id}/report", response_class=PlainTextResponse, responses={200: {"content": {"text/markdown": {"schema": {"type": "string"}}}}})
    def report(run_id: str):
        return PlainTextResponse(render_report(saved(run_id)), media_type="text/markdown")

    @app.post("/api/v1/scenarios/compare", response_model=ScenarioComparisonResponse)
    def scenarios(request: ScenarioComparisonRequest):
        data = bundle()
        scope = (
            "La métrica explícita exige observaciones conocidas antes de aplicar el límite."
            if request.metric is not None else
            "Selección por condiciones: no exige disponibilidad de una métrica; indique metric para comprobarla."
        )
        a = rank_trials(data, request.scenario_a, metric=request.metric)
        b = rank_trials(data, request.scenario_b, metric=request.metric)
        return ScenarioComparisonResponse(
            metric=request.metric, name_a=request.name_a, name_b=request.name_b,
            ranking_a=a, ranking_b=b,
            warnings=[scope, "Compara aplicabilidad de evidencia; no simula la combustión ni predice seguridad."],
        )

    return app


app = create_app()
