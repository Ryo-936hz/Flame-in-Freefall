import hashlib
import json

from sqlalchemy.orm import Session

from flamelab.domain.contracts import DatasetBundle, ResearchResponse
from flamelab.storage.legacy_p2 import read_bundle, read_run
from flamelab.storage.models import ActiveDataset, DatasetSnapshot, ResearchRun


def canonical_bundle(bundle: DatasetBundle) -> str:
    return json.dumps(bundle.model_dump(mode="json"), sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def bundle_digest(bundle: DatasetBundle) -> str:
    return hashlib.sha256(canonical_bundle(bundle).encode("utf-8")).hexdigest()


class Repository:
    def __init__(self, session: Session):
        self.session = session

    def get_bundle(self) -> DatasetBundle:
        active = self.session.get(ActiveDataset, 1)
        if active is None:
            return DatasetBundle(dataset_id="system:empty", description="Empty corpus; no seed enabled")
        return read_bundle(self.session.get(DatasetSnapshot, active.digest).payload)

    def replace_bundle(self, bundle: DatasetBundle, allow_replace: bool = False) -> bool:
        # Revalidate even model instances before touching persistent state.
        bundle = DatasetBundle.model_validate_json(bundle.model_dump_json())
        digest = bundle_digest(bundle)
        active = self.session.get(ActiveDataset, 1)
        if active:
            # Older snapshots omit later additive fields. Compare their validated current
            # representation before requiring explicit replacement of the same corpus.
            if active.digest == digest or bundle_digest(self.get_bundle()) == digest:
                return False
        if active and not allow_replace:
            raise ValueError("a different corpus is active; use explicit --replace")
        self._snapshot(bundle)
        if active:
            active.digest = digest
        else:
            self.session.add(ActiveDataset(id=1, digest=digest))
        self.session.commit()
        return True

    def _snapshot(self, bundle: DatasetBundle) -> str:
        digest = bundle_digest(bundle)
        if self.session.get(DatasetSnapshot, digest) is None:
            self.session.add(DatasetSnapshot(digest=digest, dataset_id=bundle.dataset_id, payload=canonical_bundle(bundle)))
            self.session.flush()
        return digest

    def save_run(self, response: ResearchResponse, bundle: DatasetBundle | None = None) -> None:
        response = ResearchResponse.model_validate_json(response.model_dump_json())
        bundle = bundle if bundle is not None else self.get_bundle()
        if response.ranking.dataset_id != bundle.dataset_id:
            raise ValueError("research dataset does not match its snapshot")
        digest = self._snapshot(bundle)
        self.session.add(ResearchRun(id=response.id, dataset_digest=digest, payload=response.model_dump_json()))
        self.session.commit()

    def get_run(self, run_id: str) -> ResearchResponse:
        row = self.session.get(ResearchRun, run_id)
        if row is None:
            raise KeyError(run_id)
        return read_run(row.payload)

    def get_run_bundle(self, run_id: str) -> DatasetBundle:
        row = self.session.get(ResearchRun, run_id)
        if row is None:
            raise KeyError(run_id)
        return read_bundle(self.session.get(DatasetSnapshot, row.dataset_digest).payload)
