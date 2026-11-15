"""Retrieve public corpus records and compose cited answers from selected excerpts."""
import re
import unicodedata
from collections import Counter
from difflib import get_close_matches
from functools import lru_cache
from time import perf_counter

from flamelab.ai.provider import ProviderFailure
from flamelab.ai.qwen import choose
from flamelab.config import Settings
from flamelab.domain.contracts import ChatRequest, ChatResponse, ChatSource, DatasetBundle, ResearchResponse, Study
from starlette.concurrency import run_in_threadpool

GUIDE = (
    ("canvas", "Charts", "Open Investigate, choose a measurement and run an investigation. The Evidence Canvas plots the returned observations, and its table shows their values and sources.", "chart graph metric grafica graficas metrica metricas actualizar update"),
    ("lab", "A/B comparison", "Open Mission Lab, choose an alternative and select Compare A vs B. The result shows which trials enter, remain in, or leave the selected evidence.", "scenario compare comparison comparar comparo comparacion escenarios"),
    ("brief", "Research filters", "Open Investigate. Choose a metric and set conditions to match, score by similarity, or vary. Select Investigate to run the analysis.", "filter filtros filtrar investigar investigate consulta"),
    ("ranking", "Relevance ranking", "The ranking in Investigate orders eligible trials by similarity. Coverage is the fraction of scored conditions with known values.", "ranking top relevancia similarity similitud cobertura coverage"),
    ("catalog", "Study catalog", "Open Catalog to browse campaigns, measurements and documents. Use the top search bar to jump to dashboard views or study records.", "catalog catalogo search buscar busqueda documentos"),
    ("evidence", "Source reader", "Select a chart point or citation to open its evidence. The reader shows the document, its locator, and the available excerpt.", "citation cita citas fuente fuentes evidence evidencia verificar"),
    ("synthesis", "Research findings", "Investigate shows cited findings and limitations from the current investigation. Open Report to read or download its saved record.", "synthesis sintesis resultados hallazgos resumen"),
    ("dashboard", "FlameLab overview", "FlameLab brings combustion research into one workspace to find studies, compare recorded measurements, and trace results back to their sources.", "app dashboard flamelab funciones sirve inicio ayuda interfaz"),
)
ALIASES = {"llama": "flame", "llamas": "flame", "fuego": "fire", "flujo": "flow", "aire": "airflow",
           "oxigeno": "oxygen", "presion": "pressure", "propagacion": "spread", "extincion": "extinction",
           "supresion": "suppression", "gravedad": "gravity", "microgravedad": "microgravity",
           "humo": "smoke", "ensayo": "trial", "ensayos": "trial", "temperatura": "temperature",
           "duracion": "duration", "mediciones": "measurements", "observaciones": "observations",
           "experimentos": "experiment", "experiments": "experiment", "studies": "study", "estudian": "study", "estudia": "study",
           "trials": "trial", "charts": "chart", "extinguishment": "extinction", "extinguishing": "extinction"}
STOP = set("que es el cual cuales como donde cuanto cuantos cuantas datos sobre tiene tienen para con los las una por del este esta what where which there about how the and for are does do did is was were an can you me of in at on to a show tell find please estudio estudios hay many total".split())

CLARIFICATION_TOPICS = ("microgravity", "airflow", "oxygen concentration", "flame spread", "flame extinction", "combustion", "smoke detection")

STUDY_ALIASES = {"PSI-25": r"\bbass[ -]?(?:ii|2)\b", "PSI-69": r"\bflex\b(?![ -]?(?:ii|2)\b)",
                 "PSI-101": r"\bsame[ -]?r\b", "PSI-98": r"\bsaffire\b(?![ -]?(?:ii|iii|2|3)\b)",
                 "PSI-159": r"\bcfi[ -]?g\b"}
METRIC_HINTS = {"flame_spread_rate_mm_s": "flame spread rate", "extinction_oxygen_pct": "extinction oxygen",
                "heat_release_w": "heat release", "flex_burn_duration_s": "burn duration|burning time",
                "flex_visible_flame_extinction_diameter_mm": "extinction diameter|droplet size",
                "saffire_reported_burn_duration_s": "burn duration|burning time",
                "same_reported_mass_loss_rate_mg_min": "mass loss rate", "peak_burner_temperature_k": "peak burner temperature"}
METRIC_NAMES = {
    "flame_spread_rate_mm_s": "flame spread rate", "extinction_oxygen_pct": "extinction oxygen concentration",
    "heat_release_w": "heat release rate", "flex_burn_duration_s": "burn duration",
    "flex_visible_flame_extinction_diameter_mm": "visible extinction diameter",
    "same_reported_mass_loss_rate_mg_min": "mass loss rate", "samer_run_duration_s": "run duration",
    "samer_net_aging_time_s": "net aging time", "samer_primary_aging_time_s": "primary aging time",
    "samer_primary_mixing_time_s": "primary mixing time", "saffire_reported_burn_duration_s": "reported burn duration",
    "peak_burner_temperature_k": "peak burner temperature", "cfig_reported_run_duration_s": "reported run duration",
}
CONDITION_TOPICS = {
    "flow_velocity_cm_s": {"airflow", "flow", "ventilation", "velocity"},
    "oxygen_pct": {"oxygen", "o2"},
    "pressure_kpa": {"pressure"},
    "material": {"material", "materials"},
}
CONDITION_NAMES = {
    "flow_velocity_cm_s": "Airflow velocity",
    "oxygen_pct": "Oxygen concentration",
    "pressure_kpa": "Pressure",
    "material": "Material",
}

METHODS = (
    ("ranking", "Similarity and coverage", {"gower"},
     "FlameLab uses weighted Gower similarity to rank eligible trials. It checks the required conditions first, then scores how closely the known values match your target.",
     "Numeric conditions use a fixed scale per variable. Categorical conditions use exact equality. Missing values reduce coverage. Similarity and coverage answer different questions, and neither estimates fire risk."),
    ("lab", "Segments and experimental units", {"segment", "segments", "replicates", "independent"},
     "A segment is one set of conditions within a trial. A single sample can appear in several segments, so several rows can describe the same experimental unit.",
     "The source determines segment order. Segment conditions are kept separate from trial-level conditions, and an unreported segment value stays missing."),
    ("canvas", "Measurements and missing axes", {"axis", "axes", "scatter"},
     "A chart pairs a recorded measurement with a recorded condition. When all the horizontal values are missing, the chart can still show the measured values by observation.",
     "A missing X value stays null. Observation order is a display position and does not represent elapsed time or a measured condition."),
    ("evidence", "Source provenance", {"provenance", "unverified", "digitized", "synthetic", "metadata"},
     "Provenance tells you how a record was obtained. Published records come from a source, digitized records were read from a figure or table, and synthetic records are fixtures.",
     "Publication and scientific review are separate properties. A metadata-only study can link to public documents even when FlameLab has no imported measurements for it."),
)


@lru_cache(maxsize=16384)
def terms(text: str) -> frozenset[str]:
    plain = "".join(c for c in unicodedata.normalize("NFKD", text.casefold()) if not unicodedata.combining(c))
    plain = re.sub(r"\bmicro[ -]gravity\b", "microgravity", plain)
    return frozenset(ALIASES.get(word, word) for word in re.findall(r"[a-z]+\d+[a-z]*|[a-z]+|\d+(?:[.,]\d+)?", plain) if word not in STOP)


def clarify_question(question: str) -> tuple[str, str | None]:
    quoted = re.search(r'["“]([^"”]+)["”]', question)
    topic = quoted[1].strip() if quoted else re.sub(r"^(?:what (?:is|are)|what does|¿?qu[eé] es)\s+(?:(?:the|el|la)\s+)?", "", question.strip(), flags=re.I).strip(" ¿?!.“”\"")
    topic = topic or question.strip()
    folded = re.sub(r"[\s-]+", "", topic.casefold())
    if folded == "microcosmos" or folded == "microcosm":
        return topic, "microgravity"
    candidates = {item.replace(" ", ""): item for item in CLARIFICATION_TOPICS}
    matches = get_close_matches(folded, candidates, n=1, cutoff=0.82)
    return topic, candidates[matches[0]] if matches and matches[0] != folded else None


def study_scope(question: str) -> set[str]:
    text = question.lower()
    result = {f"psi:PSI-{number}" for number in re.findall(r"\bpsi[ -]?(\d+)\b", text)} | {
        f"psi:{key}" for key, pattern in STUDY_ALIASES.items() if re.search(pattern, text)
    }
    if (
        re.search(r"\bSAME\b(?![ -]?[rR]\b)", question)
        or re.search(r"\b(?:did same (?:measure|report)|smoke aerosol measurement experiment)\b", text)
    ):
        result.add("psi:PSI-102")
    return result


def study_summary(study: Study, bundle: DatasetBundle) -> ChatSource:
    trials = [trial for trial in bundle.trials if trial.study_id == study.id]
    ids = {trial.id for trial in trials}
    counts = Counter(obs.metric for obs in bundle.observations if obs.trial_id in ids and obs.value is not None)
    status = {"metadata_only": "catalog metadata only", "unverified": "scientific review pending", "reviewed": "reviewed", "synthetic": "synthetic data"}[study.dataset_status]
    metrics = ", ".join(f"{count} for {METRIC_NAMES.get(metric, metric)}" for metric, count in counts.most_common())
    quantified = f"The imported corpus has {sum(counts.values())} known measurements: {metrics}." if counts else "The imported corpus contains no known measurements for this study."
    return ChatSource(section="catalog", title=study.title, study_id=study.id,
                      text=f"{study.title} ({study.id.removeprefix('psi:')}) has {len(trials)} trial records in FlameLab. {quantified} Data status: {status}.")


def flame_spread_extreme(bundle: DatasetBundle, study_ids: set[str], highest: bool, published_only: bool) -> tuple[str, list[str], list[ChatSource]]:
    studies = {study.id: study for study in bundle.studies}
    trials = {trial.id: trial for trial in bundle.trials if not study_ids or trial.study_id in study_ids}
    observations = [item for item in bundle.observations
                    if item.trial_id in trials and item.metric == "flame_spread_rate_mm_s" and item.value is not None]
    allowed = {"published"} if published_only else {"published", "digitized"}
    matches = [item for item in observations if item.provenance in allowed]
    synthetic = not matches and not published_only
    if synthetic:
        matches = [item for item in observations if item.provenance == "synthetic"]
    scope = "the requested studies" if study_ids else "the active FlameLab corpus"
    if not matches:
        return f"I couldn’t find recorded {'published ' if published_only else ''}flame spread rates in {scope}.", [], []

    extreme = max if highest else min
    value = extreme(item.value for item in matches)
    tied = [item for item in matches if item.value == value]
    first = tied[0]
    trial = trials[first.trial_id]
    study = studies[trial.study_id]
    evidence = {entry.id: entry for entry in bundle.evidence}
    refs = [evidence[item.evidence_ids[0]] for item in tied[:3]]
    direction = "highest" if highest else "lowest"
    cohort = "synthetic demo observations" if synthetic else "published observations" if published_only else "published or digitized observations"
    answer = (f"The {direction} flame spread rate among {cohort} in {scope} is {value:g} {first.unit}. "
              f"It was recorded in {study.title} ({study.id.removeprefix('psi:')}), trial {trial.id}, "
              f"with the source “{refs[0].title}”.")
    if len(tied) > 1:
        answer += f" {len(tied)} observations share this value."
    details = [f"Compared all {len(matches)} {cohort} in scope with a known flame spread rate."]
    sources = [ChatSource(section="evidence", title=ref.title, text=ref.locator, evidence_id=ref.id) for ref in refs]
    return answer, details, sources


def retrieve(request: ChatRequest, bundle: DatasetBundle, run: ResearchResponse | None) -> list[ChatSource]:
    query = terms(request.question)
    previous = terms(request.previous_question or "")
    scope = study_scope(request.question) or (study_scope(request.previous_question or "") if query & {"it", "its", "there", "more", "whatelse"} else set())
    trial_ids = set(re.findall(r"\bm\d+\b", request.question.lower())) | set(re.findall(r"\btrial\s+(\d+[a-z]?)\b", request.question.lower()))
    metric_keys = {key for key in {obs.metric for obs in bundle.observations}
                   if any(terms(phrase) <= query for phrase in METRIC_HINTS.get(key, key.replace("_", " ")).split("|"))}
    condition_keys = {key for key, aliases in CONDITION_TOPICS.items() if aliases & query} if not metric_keys else set()
    condition_words = {alias for key in condition_keys for alias in CONDITION_TOPICS[key]}
    gravity_filter = "microgravity" if condition_keys and "microgravity" in query else None
    study_lookup = not scope and not condition_keys and bool(query & {"experiment", "study", "campaigns", "campanas"})
    study_topics = query - {"flame", "fire", "experiment", "study", "campaigns", "campanas", "investigate"}
    pool: list[tuple[int, ChatSource]] = []
    evidence = {source.id: source for source in bundle.evidence}
    study_names = {study.id: f"{study.title} {study.family} {study.id}" for study in bundle.studies}
    trials = {trial.id: trial for trial in bundle.trials}

    def add(source: ChatSource, keywords: str, boost: int = 0):
        tokens = terms(keywords)
        score = sum(1 if term in {"fire", "flame", "study"} else 5 for term in query & tokens) + len(previous & tokens) + boost
        if boost >= 22 or query & tokens or (previous & tokens and query <= {"y", "and", "mas", "more"}):
            pool.append((score, source))

    for section, title, text, keywords in (() if scope or trial_ids else GUIDE):
        add(ChatSource(section=section, title=title, text=text), keywords, 17 if query & {"app", "use", "update", "change", "click", "open", "explain", "mean", "uso", "pasos", "pulso", "boton", "cambio", "actualizo", "configuro"} else 0)
    if pool and max(score for score, _ in pool) >= 22:
        return [max(pool, key=lambda pair: pair[0])[1]]
    summaries = []
    for study in bundle.studies:
        if scope and study.id not in scope:
            continue
        if scope and not trial_ids and not metric_keys and not condition_keys and query & {"measure", "measured", "data", "measurements", "record", "recorded", "available", "overview", "count", "trial"}:
            summaries.append(study_summary(study, bundle))
            continue
        if study.description or study_lookup:
            if condition_keys and not (condition_words & terms(study.description)):
                continue
            keywords = f"{study_names[study.id]} {study.description}"
            if study_lookup and study_topics and not (study_topics & terms(keywords)):
                continue
            add(ChatSource(section="catalog", title=study.title, study_id=study.id,
                           text=f"{study.title}. {study.description[:260]} [{study.dataset_status.replace('_', ' ')}]"),
                keywords, 22 if scope and not trial_ids and not metric_keys and not condition_keys else 12 if study_lookup else 0)
    if summaries:
        return summaries[:3]
    for item in ([] if study_lookup else bundle.evidence):
        if scope and item.study_id not in scope or trial_ids and not (trial_ids & terms(item.id)):
            continue
        snippet = item.text.strip()[:360]
        if snippet and (not condition_keys or condition_words & terms(f"{item.title} {snippet}")):
            add(ChatSource(section="evidence", title=item.title, text=f"{snippet} [{item.provenance}]", evidence_id=item.id),
                f"{study_names[item.study_id]} {item.title} {item.id} {snippet}")

    for item in ([] if study_lookup or condition_keys else bundle.observations):
        trial = trials[item.trial_id]
        if scope and trial.study_id not in scope or trial_ids and not (trial_ids & terms(trial.id)) or metric_keys and item.metric not in metric_keys:
            continue
        source_id = item.evidence_ids[0]
        metric = METRIC_NAMES.get(item.metric, item.metric)
        value = f"{item.value:g} {item.unit}" if item.value is not None else f"no value ({item.status.replace('_', ' ')})"
        trial_no = trial.id.rsplit(":", 1)[-1]
        stage = f", segment {item.segment_id.rsplit(':', 1)[-1]}" if item.segment_id else ""
        add(ChatSource(section="evidence", title=f"{trial.label} · {evidence[source_id].title}", evidence_id=source_id,
                       text=f"In trial {trial_no}{stage}, the recorded {metric} was {value}. ({trial.study_id.removeprefix('psi:')}; {item.provenance})"),
            f"{metric} {item.metric} {study_names[trial.study_id]} {trial.id} {item.id} {value}",
            (4 if item.value is not None else -8) + (20 if metric_keys else 0))
    for trial in ([] if study_lookup else bundle.trials):
        if scope and trial.study_id not in scope or trial_ids and not (trial_ids & terms(trial.id)):
            continue
        for segment in [None, *trial.segments]:
            conditions = segment.conditions if segment is not None else trial.conditions
            gravity = conditions.get("gravity_regime") or trial.conditions.get("gravity_regime")
            if gravity_filter and (gravity is None or gravity.status != "known" or gravity.value != gravity_filter):
                continue
            for key, condition in conditions.items():
                label = CONDITION_NAMES.get(key, key.replace("_", " "))
                relevant = key in condition_keys if condition_keys else bool(terms(label) & (query | previous))
                if condition.status != "known" or not relevant:
                    continue
                ref = condition.evidence_ids[0]
                segment_label = f" · segment {segment.sequence}" if segment else ""
                value = f"{condition.value} {condition.unit or ''}".strip()
                aliases = " ".join(sorted(CONDITION_TOPICS.get(key, ())))
                context = f" in {gravity_filter}" if gravity_filter else ""
                add(ChatSource(section="evidence", title=f"{trial.label}{segment_label} · {evidence[ref].title}", evidence_id=ref,
                               text=f"{label}{context}: {value} · {trial.provenance}."),
                    f"{label}{context} {aliases} {study_names[trial.study_id]} {trial.id} {value}", 15 if condition_keys else 2)
    if run is not None:
        for claim in run.claims:
            if condition_keys and not (condition_words & terms(claim.text)):
                continue
            for citation in claim.citations[:1]:
                add(ChatSource(section="evidence", title="Active investigation", text=claim.text[:420],
                               evidence_id=citation.evidence_id, research_id=run.id),
                    f"active result ultimo consulta actual {run.question} {claim.text}", 9)

    ranked = sorted(pool, key=lambda pair: -pair[0])
    unique = {(item.title, item.text): item for _, item in ranked[:40]}
    return list(unique.values())[:5]


async def answer_chat(
    request: ChatRequest, bundle: DatasetBundle, settings: Settings, run: ResearchResponse | None,
    *, started_at: float | None = None,
) -> ChatResponse:
    start = perf_counter() if started_at is None else started_at
    query = terms(request.question)
    precise_trial = bool(re.search(r"\bm\d+\b", request.question.lower()))
    named_studies = study_scope(request.question)
    highest = bool(query & {"highest", "maximum", "max", "fastest", "mayor", "maximo", "maxima"})
    lowest = bool(query & {"lowest", "minimum", "min", "slowest", "menor", "minimo", "minima"})
    if highest != lowest and {"flame", "spread"} <= query:
        if precise_trial or query & {"microgravity", "lunar", "martian", "earth"} or re.search(r"\b(?:at|with)\s+\d", request.question.casefold()):
            answer, details, sources = "Use Investigate to set those conditions before comparing recorded flame spread rates.", [], []
        else:
            answer, details, sources = flame_spread_extreme(bundle, named_studies, highest, bool(query & {"published", "publicada", "publicado"}))
        return ChatResponse(provider="catalog", answer=answer, technical_details=details, sources=sources,
                            elapsed_ms=round((perf_counter() - start) * 1000))
    requested_studies = named_studies
    if query & {"compare", "comparison", "plot", "chart", "graph", "comparar", "compara", "grafica"}:
        question_lower = request.question.casefold()
        requested_studies = named_studies | {study.id for study in bundle.studies if len(study.title) > 5 and study.title.casefold() in question_lower}
        studies = [study for study in bundle.studies if study.id in requested_studies]
        if len(studies) == 2 and len(requested_studies) == 2:
            return ChatResponse(provider="catalog", answer=f"Open the comparison for {studies[0].title} and {studies[1].title}. It shows which measurements each study reports and plots any shared metric separately from data availability.",
                                sources=[study_summary(study, bundle) for study in studies],
                                comparison_studies=[study.id for study in studies], elapsed_ms=round((perf_counter() - start) * 1000))
        if len(requested_studies) == 1 and query & {"compare", "comparison", "versus", "vs", "comparar", "compara"}:
            return ChatResponse(provider="catalog", answer="To open a study comparison, name two studies from the catalog. You can use their PSI IDs, for example: Plot PSI-25 and PSI-69.",
                                sources=[study_summary(study, bundle) for study in studies], elapsed_ms=round((perf_counter() - start) * 1000))
    method = next((item for item in METHODS if item[2] & query), None)
    if method and not named_studies and not precise_trial:
        section, title, _, summary, detail = method
        return ChatResponse(provider="catalog", answer=summary, technical_details=[detail],
                            sources=[ChatSource(section=section, title=title, text=detail)],
                            elapsed_ms=round((perf_counter() - start) * 1000))
    count_question = bool(re.search(r"\b(cuant[oa]s?|how many|total)\b", unicodedata.normalize("NFKD", request.question.casefold()).replace("\u0301", "")))
    provider = "catalog"
    if count_question and query <= {"study", "trial", "observations", "measurements", "corpus", "dataset", "app", "have", "flamelab", "active", "imported"}:
        options = [ChatSource(section="dashboard", title="Active corpus profile", text=(
            f"{len(bundle.studies):,} studies, {len(bundle.trials):,} trial records, and {len(bundle.observations):,} observations. "
            f"{sum(trial.provenance == 'synthetic' for trial in bundle.trials):,} trial records are synthetic."))]
    else:
        options = await run_in_threadpool(retrieve, request, bundle, run)
    scoped_overview = bool(requested_studies) and all(source.section == "catalog" for source in options)
    if len(options) > 1 and not precise_trial and not scoped_overview and settings.ai_provider == "qwen" and options[0].section in {"catalog", "evidence"}:
        try:
            indices = await choose(request.question, [{"index": i, "title": item.title[:105], "excerpt": item.text[:260]}
                                                       for i, item in enumerate(options)],
                                   "Select the excerpts that directly answer the question. Omit unrelated records.", settings)
            if indices:
                options = [options[i] for i in indices]
                provider = "qwen"
        except ProviderFailure:
            pass
    sources = options[:3]
    if not sources:
        topic, suggestion = clarify_question(request.question)
        answer = f'I couldn’t find anything related to “{topic}” in FlameLab.'
        if suggestion:
            answer += f' Did you mean “{suggestion}”?'
        return ChatResponse(provider="catalog", answer=answer, sources=[],
                            suggested_question=f"Show evidence about {suggestion}" if suggestion else None,
                            elapsed_ms=round((perf_counter() - start) * 1000))
    elif len(sources) == 1 and (not sources[0].evidence_id or precise_trial):
        answer = sources[0].text
    elif precise_trial:
        answer = sources[0].text + " Other records for this trial are listed below."
    elif all(source.study_id for source in sources):
        others = " and ".join(source.title for source in sources[1:])
        answer = f"Start with {sources[0].title}. FlameLab also found {others}. Open the study records below to see which measurements and publications are available."
    else:
        answer = sources[0].text
        if len(sources) > 1:
            answer += " Related records and their sources are listed below."
    details = [f"[{index}] {item.text}" for index, item in enumerate(sources, 1) if item.text != answer]
    return ChatResponse(provider=provider, answer=answer, technical_details=details, sources=sources,
                        elapsed_ms=round((perf_counter() - start) * 1000))
