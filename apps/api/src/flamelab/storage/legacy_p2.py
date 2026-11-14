"""Read historical P2 snapshot names without accepting them on the public API."""

import json

from pydantic import ValidationError

from flamelab.domain.contracts import DatasetBundle, ResearchResponse


def _rename(record: dict, old: str, new: str) -> bool:
    if old not in record:
        return False
    if new in record:
        raise ValueError(f"Stored payload contains both {old} and {new}")
    record[new] = record.pop(old)
    return True


def read_bundle(payload: str) -> DatasetBundle:
    try:
        return DatasetBundle.model_validate_json(payload)
    except ValidationError:
        previous = json.loads(payload)
        if previous.get("schema_version") != "1.0" or not any(
            "condition_stages" in trial for trial in previous.get("trials", [])
        ):
            raise

    segmented = False
    for trial in previous["trials"]:
        if not _rename(trial, "condition_stages", "segments"):
            continue
        for segment in trial["segments"]:
            segmented = True
            _rename(segment, "order", "sequence")
            refs = dict.fromkeys(ref for condition in segment["conditions"].values()
                                 for ref in condition.get("evidence_ids", []))
            segment["evidence_ids"] = list(refs) or trial["evidence_ids"]
    for observation in previous.get("observations", []):
        _rename(observation, "condition_id", "segment_id")
    if segmented:
        previous["schema_version"] = "1.1"
    return DatasetBundle.model_validate(previous)


def read_run(payload: str) -> ResearchResponse:
    try:
        return ResearchResponse.model_validate_json(payload)
    except ValidationError:
        previous = json.loads(payload)
        ranking = previous.get("ranking", {})
        comparison = previous.get("comparison") or {}
        changed = had_segments = False
        for entry in ranking.get("items", []) + ranking.get("excluded", []):
            changed |= _rename(entry, "eligible_condition_ids", "eligible_segment_ids")
            changed |= _rename(entry, "scored_condition_id", "scored_segment_id")
            had_segments |= bool(entry.get("eligible_segment_ids") or entry.get("scored_segment_id"))
        for point in comparison.get("points", []):
            changed |= _rename(point, "condition_id", "segment_id")
            had_segments |= point.get("segment_id") is not None
        for group in comparison.get("groups", []):
            changed |= _rename(group, "n_condition_stages", "n_segments")
            had_segments |= bool(group.get("n_segments"))
        if not changed:
            raise
        if had_segments:
            previous["warnings"].append(
                "Expediente histórico calculado con las reglas previas de P2. "
                "Vuelve a ejecutar la consulta con el corpus 1.1 para aplicar las reglas vigentes."
            )
        return ResearchResponse.model_validate_json(json.dumps(previous, ensure_ascii=False))
