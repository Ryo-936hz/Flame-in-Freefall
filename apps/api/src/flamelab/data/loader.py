"""Read a bounded JSON corpus and validate the canonical contract before storage."""

import json
from pathlib import Path

from flamelab.domain.contracts import DatasetBundle

MAX_BUNDLE_BYTES = 20 * 1024 * 1024


def _unique_object(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def load_bundle(path: str | Path) -> DatasetBundle:
    """Reject malformed, oversized or semantically inconsistent data before any write."""
    with Path(path).open("rb") as source:
        data = source.read(MAX_BUNDLE_BYTES + 1)
    if len(data) > MAX_BUNDLE_BYTES:
        raise ValueError("bundle exceeds 20 MiB")
    payload = json.loads(data.decode("utf-8-sig"), object_pairs_hook=_unique_object)
    return DatasetBundle.model_validate(payload)
