"""Assemble the documentary corpus and supported campaign-specific series."""

import json
from collections import Counter
from pathlib import Path

from flamelab.data.bass_table51 import load_table51
from flamelab.data.loader import MAX_BUNDLE_BYTES, load_bundle
from flamelab.data.nasa_configurations import map_configurations
from flamelab.data.nasa_experiments import map_experiments
from flamelab.data.nasa_sources import load_sources
from flamelab.domain.contracts import DatasetBundle


def build_corpus(datasets: Path, catalog_path: Path, inventory_path: Path,
                 profiles_path: Path) -> tuple[DatasetBundle, dict]:
    catalog = load_bundle(catalog_path)
    tables, sources, source_quality = load_sources(datasets, inventory_path, catalog, profiles_path)
    bass, bass_quality = load_table51(datasets, catalog)
    trials = list(bass.trials)
    observations = list(bass.observations)
    diagnostics = []
    for table in tables:
        if table.study_id in {"psi:PSI-69", "psi:PSI-102", "psi:PSI-101", "psi:PSI-98"}:
            table_trials, table_observations, table_quality = map_experiments(table)
        elif table.study_id == "psi:PSI-25":
            # The operational CSV supplies evidence; the PDF is the outcome source.
            continue
        else:
            table_trials, table_observations, table_quality = map_configurations(table)
        trials.extend(table_trials)
        observations.extend(table_observations)
        diagnostics.append({"study_id": table.study_id, "path": table.path, **table_quality})

    study_trials = Counter(trial.study_id for trial in trials)
    observation_status = Counter(observation.status for observation in observations)
    studies = []
    for study in bass.studies:
        profile = source_quality["study_profiles"][study.id]
        description = f"{profile['question']} {profile['record_scope']} {profile['limits']}"
        studies.append(study.model_copy(update={
            "description": description,
            "dataset_status": "unverified" if study_trials[study.id] else "metadata_only",
        }))

    bundle = DatasetBundle(
        dataset_id="psi:nasa-local-corpus-v1",
        description="NASA PSI documentary corpus and campaign-specific descriptive data awaiting review.",
        studies=studies, evidence=[*bass.evidence, *sources], trials=trials, observations=observations,
    )
    quality = {
        "dataset_id": bundle.dataset_id,
        "review_status": "pending_scientific_review",
        "counts": {
            "studies": len(studies), "evidence": len(bundle.evidence),
            "trials": len(trials), "observations": len(observations),
            "observation_status": dict(observation_status),
            "trials_by_study": dict(study_trials),
        },
        "sources": source_quality,
        "bass_table51": bass_quality,
        "table_mappings": diagnostics,
    }
    return bundle, quality


def extract(datasets: Path, catalog_path: Path, inventory_path: Path, profiles_path: Path,
            output_dir: Path) -> dict:
    if output_dir.exists():
        raise ValueError("Choose a new output directory")
    bundle, quality = build_corpus(datasets, catalog_path, inventory_path, profiles_path)
    bundle_text = bundle.model_dump_json(indent=2) + "\n"
    if len(bundle_text.encode("utf-8")) > MAX_BUNDLE_BYTES:
        raise ValueError("The generated bundle exceeds the import size limit")
    quality_text = json.dumps(quality, ensure_ascii=False, indent=2) + "\n"
    output_dir.mkdir(parents=True, exist_ok=False)
    outputs = []
    try:
        for name, content in (("bundle.json", bundle_text), ("quality.json", quality_text)):
            with (output_dir / name).open("x", encoding="utf-8", newline="\n") as target:
                outputs.append(output_dir / name)
                target.write(content)
    except OSError:
        for output in outputs:
            output.unlink(missing_ok=True)
        output_dir.rmdir()
        raise
    return quality["counts"]
