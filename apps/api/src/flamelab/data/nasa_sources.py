"""Verify local NASA source files and import their documentary evidence."""

import csv
import hashlib
import io
import json
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

from flamelab.data.inventory import InventoryLimits, _safe_name
from flamelab.domain.contracts import DatasetBundle, Evidence


@dataclass(frozen=True)
class SourceRecord:
    ordinal: int
    cells: tuple[str, ...]
    evidence_id: str
    start_line: int = 0
    end_line: int = 0
    duplicate_of: int | None = None


@dataclass(frozen=True)
class SourceTable:
    study_id: str
    path: str
    headers: tuple[str, ...]
    records: list[SourceRecord]


def _verified_file(root: Path, member: dict, *, capture: bool) -> bytes:
    relative = member["path"]
    _safe_name(relative)
    path = root.joinpath(*PurePosixPath(relative).parts).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError(f"Missing or invalid source file: {relative}")
    expected_size = member["bytes"]
    if not 0 <= expected_size <= InventoryLimits().max_member_bytes:
        raise ValueError(f"Invalid inventory size for {relative}")
    if path.stat().st_size != expected_size:
        raise ValueError(f"Source size mismatch: {relative}")
    digest = hashlib.sha256()
    contents = bytearray()
    size = 0
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            size += len(chunk)
            if size > expected_size:
                raise ValueError(f"Source size mismatch: {relative}")
            digest.update(chunk)
            if capture:
                contents.extend(chunk)
    if size != expected_size or digest.hexdigest() != member["sha256"]:
        raise ValueError(f"Source inventory mismatch: {relative}")
    return bytes(contents)


def _parse_csv(
    content: bytes, study_id: str, path: str, evidence_id: str,
) -> tuple[SourceTable, dict]:
    # The verified FLEX export uses Windows-1252 en dashes for missing diameters.
    encoding = "cp1252" if path == "PSI-69/Experimental table/PSI-69_Experimental table_FLEX.csv" else "utf-8-sig"
    reader = csv.reader(io.StringIO(content.decode(encoding), newline=""), strict=True)
    headers = tuple(next(reader, ()))
    if not headers or not any(header.strip() for header in headers):
        raise ValueError(f"Source table has no header: {path}")
    records = []
    blanks = []
    duplicates = []
    first_ordinal = {}
    previous_end = reader.line_num
    for ordinal, row in enumerate(reader, 2):
        start_line, end_line = previous_end + 1, reader.line_num
        previous_end = end_line
        if not any(cell.strip() for cell in row):
            blanks.append(ordinal)
            continue
        if len(row) != len(headers):
            raise ValueError(f"CSV width differs from header: {path}, record {ordinal}")
        cells = tuple(row)
        first = first_ordinal.setdefault(cells, ordinal)
        duplicate_of = first if first != ordinal else None
        if duplicate_of is not None:
            duplicates.append({"ordinal": ordinal, "first_ordinal": duplicate_of})
        records.append(SourceRecord(
            ordinal, cells, f"{evidence_id}:record:{ordinal}", start_line, end_line, duplicate_of,
        ))
    return SourceTable(study_id, path, headers, records), {
        "path": path, "encoding": encoding, "headers": list(headers),
        "records_after_header": len(records) + len(blanks), "nonempty_records": len(records),
        "blank_records": blanks, "exact_duplicate_records": duplicates,
    }


def load_sources(
    datasets: Path, inventory_path: Path, catalog: DatasetBundle, profiles_path: Path,
) -> tuple[list[SourceTable], list[Evidence], dict]:
    """Read local files against the tracked inventory and preserve raw CSV cells."""
    root = datasets.resolve(strict=True)
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    profiles = json.loads(profiles_path.read_text(encoding="utf-8"))
    studies = {study.id: study for study in catalog.studies}
    if studies.keys() != profiles.keys():
        raise ValueError("Study profiles must cover the catalog exactly")
    files_by_study = defaultdict(list)
    tables = []
    evidence = []
    table_quality = []
    for member in inventory["members"]:
        if member["directory"]:
            continue
        path = member["path"]
        filename = PurePosixPath(path).name
        study_id = f"psi:{PurePosixPath(path).parts[0]}"
        if study_id not in studies:
            raise ValueError(f"Source study missing from the catalog: {path}")
        is_csv = PurePosixPath(path).suffix.lower() == ".csv"
        content = _verified_file(root, member, capture=is_csv)
        study = studies[study_id]
        source_url = next(iter(study.source_urls), None)
        locator = f"{path}, SHA-256 {member['sha256']}"
        source_id = f"{study_id}:source:{hashlib.sha256(path.encode('utf-8')).hexdigest()[:24]}"
        files_by_study[study_id].append({"path": path, "sha256": member["sha256"]})
        common = {"study_id": study_id, "source_url": source_url, "provenance": "published"}
        if not is_csv:
            evidence.append(Evidence(
                id=source_id, title=filename, locator=locator,
                text="Local source file verified against the inventory. Link opens the study catalog entry.",
                **common,
            ))
            continue
        table, counts = _parse_csv(content, study_id, path, source_id)
        counts.update(study_id=study_id, sha256=member["sha256"], evidence_id=source_id)
        tables.append(table)
        table_quality.append(counts)
        evidence.append(Evidence(
            id=source_id, title=filename, locator=f"{locator}, CSV header record 1",
            text=json.dumps({"headers": table.headers, "nonempty_records": len(table.records)}, ensure_ascii=False),
            **common,
        ))
        for record in table.records:
            evidence.append(Evidence(
                id=record.evidence_id, title=f"{filename}, record {record.ordinal}",
                locator=f"{locator}, CSV record {record.ordinal}, physical lines {record.start_line}-{record.end_line}",
                text=json.dumps(list(zip(table.headers, record.cells, strict=True)), ensure_ascii=False),
                **common,
            ))
    profile_quality = {}
    for study_id, study in studies.items():
        if not files_by_study[study_id]:
            raise ValueError(f"No source inventory for {study_id}")
        profile = profiles[study_id]
        evidence.append(Evidence(
            id=f"{study_id}:documentary-profile", study_id=study_id,
            title=f"Documentary profile: {study.title}", provenance="derived",
            source_url=next(iter(study.source_urls), None),
            locator=f"P3 NASA 24 study review, {study_id.removeprefix('psi:')}; source inventory in quality report",
            text="\n".join([
                f"Question: {profile['question']}", f"Use: {profile['role']}",
                f"Variables: {profile['variables']}", f"Record scope: {profile['record_scope']}",
                f"Related studies: {', '.join(profile['related_studies'])}", f"Pending: {profile['limits']}",
            ]),
        ))
        profile_quality[study_id] = {**profile, "files": files_by_study[study_id]}
    return tables, evidence, {
        "verified_sources": sum(map(len, files_by_study.values())),
        "csv_tables": table_quality, "study_profiles": profile_quality,
    }
