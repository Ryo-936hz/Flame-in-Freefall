import json
import logging
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException

from flamelab.ai.engine import run_research
from flamelab.ai.provider import ProviderFailure
from flamelab.ai.report import render_report
from flamelab.config import Settings
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import (
    ComparisonRequest, ComparisonResponse, ErrorResponse, Evidence, HealthResponse,
    Metric, ProfileResponse, RankingRequest, RankingResponse, ResearchRequest, ResearchResponse,
    ScenarioComparisonRequest, ScenarioComparisonResponse, Study, StudyEvidencePage,
    StudyObservationPage, Trial,
)
from flamelab.science.comparison import compare_trials
from flamelab.science.profiling import profile_dataset
from flamelab.science.ranking import rank_trials
from flamelab.storage.database import create_engine_and_session, migrate
from flamelab.storage.models import ActiveDataset
from flamelab.storage.repository import Repository

logger = logging.getLogger("flamelab")


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

    def bundle():
        with app.state.sessions() as session:
            return Repository(session).get_bundle()

    def saved(run_id):
        with app.state.sessions() as session:
            return Repository(session).get_run(run_id)

    @app.get("/api/v1/health", response_model=HealthResponse)
    def health():
        with app.state.sessions() as session:
            session.execute(text("SELECT 1"))
            data = Repository(session).get_bundle()
        synthetic = sum(trial.provenance == "synthetic" for trial in data.trials)
        mode = "empty" if not data.studies else "metadata_only" if not data.trials else "synthetic" if synthetic == len(data.trials) else "mixed" if synthetic else "scientific_unverified"
        return HealthResponse(status="ok", version="0.1.0", schema_version="1.0", database=app.state.engine.dialect.name, ai_provider=config.ai_provider, data_mode=mode)

    @app.get("/api/v1/studies", response_model=list[Study])
    def studies():
        return bundle().studies

    @app.get("/api/v1/studies/{study_id}/evidence", response_model=StudyEvidencePage)
    def study_evidence(study_id: str, offset: int = Query(0, ge=0),
                       limit: int = Query(50, ge=1, le=200)):
        data = bundle()
        if not any(study.id == study_id for study in data.studies):
            raise KeyError(study_id)
        items = [entry for entry in data.evidence if entry.study_id == study_id]
        return StudyEvidencePage(total=len(items), offset=offset, items=items[offset:offset + limit])

    @app.get("/api/v1/studies/{study_id}/observations", response_model=StudyObservationPage)
    def study_observations(study_id: str, offset: int = Query(0, ge=0),
                           limit: int = Query(50, ge=1, le=200), metric: Metric | None = None):
        data = bundle()
        if not any(study.id == study_id for study in data.studies):
            raise KeyError(study_id)
        trial_ids = {entry.id for entry in data.trials if entry.study_id == study_id}
        items = [entry for entry in data.observations
                 if entry.trial_id in trial_ids and (metric is None or entry.metric == metric)]
        return StudyObservationPage(total=len(items), offset=offset, items=items[offset:offset + limit])

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

    @app.post("/api/v1/rankings", response_model=RankingResponse)
    def rank(request: RankingRequest):
        return rank_trials(bundle(), request)

    @app.post("/api/v1/comparisons", response_model=ComparisonResponse)
    def compare(request: ComparisonRequest):
        return compare_trials(bundle(), request)

    @app.post("/api/v1/research", response_model=ResearchResponse)
    async def research(request: ResearchRequest):
        data = bundle()
        response = await run_research(request, data, config)
        with app.state.sessions() as session:
            Repository(session).save_run(response, data)
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
        return ScenarioComparisonResponse(name_a=request.name_a, name_b=request.name_b, ranking_a=rank_trials(data, request.scenario_a), ranking_b=rank_trials(data, request.scenario_b), warnings=["Compara aplicabilidad de evidencia; no simula la combustión ni predice seguridad."])

    return app


app = create_app()
