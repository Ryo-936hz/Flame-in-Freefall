"""Build a local, unverified BASS-II corpus from two fixed NASA source versions."""

import csv
import hashlib
import json
import re
from collections import Counter
from decimal import Decimal
from pathlib import Path

from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import (
    ConditionSegment, ConditionValue, DatasetBundle, Evidence, Observation, Trial,
)

STUDY = "psi:PSI-25"
REPORT = "NASA/TM-20210011385"
PDF_URL = "https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf"
CSV_URL = "https://doi.org/10.60555/4qc4-de67"
PDF_MEMBER = "PSI-25/Reports/PSI-25_Reports_BASS-II Summary Report.pdf"
CSV_MEMBER = "PSI-25/Experimental table/PSI-25_Experimental table_BASS-II.csv"
PDF_HASH = "5ffa911fd9b6356f204646003fb9342e341810dcdfdf5cb15756e7f01ec5f770"
CSV_HASH = "71e792bf6b5fb5ea620c5dd70fbbac05515992e12aefcf5dff47312caa48c042"
PDF_PAGE = 65
TEST_IDS = tuple(f"M{index}" for index in range(1, 21))
HEADERS = (
    "Test no.", "Thickness, mm", "Width, cm", "One or two sides burning",
    "Velocity, cm/s", "Spread rate, mm/s", "Burn time, min",
    "Initial O2, vol%", "Final O2, vol%",
)
INITIAL_O2 = "Calibrated  initial O2 % by vol "
FINAL_O2 = "Calibrated final O2 % by vol"
CSV_COLUMNS = (
    "PI", "Test #", "Sample #", "Fuel Sample Material", "Fan display", "Air display",
    INITIAL_O2, FINAL_O2,
)
BASS_CONFIG = {
    "material": ("pmma", "clear cast polymethylmethacrylate (PMMA)"),
    "geometry": ("sheet", "flat PMMA samples"),
    "flow_direction": ("opposed", "opposed flow"),
    "gravity_regime": ("microgravity", "true microgravity conditions"),
}


def _decimal(cell: str) -> Decimal:
    if not re.fullmatch(r"[0-9]+(?:\.[0-9]+)?", cell):
        raise ValueError("Expected a nonnegative decimal in a quantitative source cell")
    return Decimal(cell)


def _known(value, original, evidence_id, *, unit=None, original_unit=None) -> ConditionValue:
    return ConditionValue(
        value=value, status="known", unit=unit, original_value=original,
        original_unit=original_unit, evidence_ids=[evidence_id],
    )


def _measure(original, source_unit, evidence_id, *, unit=None, scale=1) -> ConditionValue:
    return _known(
        float(_decimal(original) * scale), original, evidence_id,
        unit=unit or source_unit, original_unit=source_unit,
    )


def _pdf_evidence(evidence_id, title, locator, text, *, page=PDF_PAGE) -> Evidence:
    return Evidence(
        id=evidence_id, study_id=STUDY, title=title, text=text,
        source_url=f"{PDF_URL}#page={page}", page=page,
        locator=f"{REPORT}, PDF p. {page}, printed p. {page - 8}, {locator}. "
                f"{PDF_MEMBER}, SHA-256 {PDF_HASH}",
        provenance="published",
    )


def _operational_rows(reader: csv.DictReader) -> dict[str, tuple[int, dict[str, str]]]:
    headers = reader.fieldnames or []
    if len(set(headers)) != len(headers) or not set(CSV_COLUMNS).issubset(headers):
        raise ValueError("Unexpected BASS-II operational CSV headers")
    records = {}
    for row in reader:
        if row["PI"] != "Miller":
            continue
        test = row["Test #"]
        if test in records:
            raise ValueError(f"Duplicate Miller test in operational CSV: {test}")
        if None in row or any(row[key] is None for key in CSV_COLUMNS):
            raise ValueError("Incomplete Miller record in the operational CSV")
        if not re.fullmatch(r"[0-9]+m?", row["Sample #"]):
            raise ValueError(f"Missing or invalid sample number for Miller test: {test}")
        records[test] = (reader.line_num, {key: row[key] for key in CSV_COLUMNS})
    if set(records) != set(TEST_IDS):
        raise ValueError("Expected operational records for Miller M1 through M20")
    return records


def _series(cell: str) -> list[str]:
    return re.split(r", (?:and )?| and ", cell)


def _issues(table: dict[str, str], operational: dict[str, str], test: str) -> dict[str, str]:
    issues = {}
    for column, csv_column, label in (
        (HEADERS[7], INITIAL_O2, "initial"), (HEADERS[8], FINAL_O2, "final"),
    ):
        original = operational[csv_column].strip()
        if not original:
            issues[f"{label}_oxygen_csv_absent"] = f"Operational CSV {label} O2 is blank."
        elif _decimal(original) != _decimal(table[column]):
            issues[f"{label}_oxygen_disagrees"] = (
                f"Operational CSV {label} O2 differs from Table 5.1. The table value is retained."
            )

    material = operational["Fuel Sample Material"]
    nominal = re.search(r"\b(\d+(?:\.\d+)?)\s*cm\s+wide\b", material)
    if nominal is None:
        issues["csv_width_unresolved"] = "Operational material text has no explicit 'cm wide' value."
    elif _decimal(nominal[1]) != _decimal(table[HEADERS[2]]):
        issues["width_disagrees"] = "Explicit operational width differs from Table 5.1 width."
    if operational["Air display"].strip() != table[HEADERS[4]]:
        issues["air_display_text_differs"] = (
            "Operational Air display text differs from the Table 5.1 velocity cell. "
            "This text check includes differences in formatting and is not a calibration check."
        )
    if table[HEADERS[5]] == "Not tracked":
        issues["spread_not_tracked"] = "Table 5.1 reports 'Not tracked' for the whole test."
    if test == "M8":
        issues["figure_5_2_rate_disagrees"] = (
            "Figure 5.2 fitted slopes at 10, 6 and 5 cm/s are 0.0637, 0.0557 and "
            "0.0391 mm/s. Table 5.1 gives 0.057, 0.056 and 0.04 mm/s. "
            "The bundle preserves the Table 5.1 pairs."
        )
    return issues


def build_bundle(
    table: list[list[str]], operational_csv: csv.DictReader, catalog: DatasetBundle,
) -> tuple[DatasetBundle, dict]:
    """Join Miller test identities and map the source cells into the public contract."""
    if not table or tuple(table[0]) != HEADERS:
        raise ValueError("Unexpected Table 5.1 headers or units")
    rows = table[1:]
    if any(len(row) != len(HEADERS) for row in rows):
        raise ValueError("Unexpected Table 5.1 row width")
    if tuple(row[0] for row in rows) != TEST_IDS:
        raise ValueError("Expected Table 5.1 rows M1 through M20 exactly once in source order")
    if (
        any(study.dataset_status != "metadata_only" for study in catalog.studies)
        or STUDY not in {study.id for study in catalog.studies}
    ):
        raise ValueError("Expected a metadata-only scientific catalog containing PSI-25")
    operational_rows = _operational_rows(operational_csv)

    configuration = _pdf_evidence(
        f"{STUDY}:method:configuration", "BASS-II Miller sample configuration",
        "§5.1, Narrow Channel Apparatus as Microgravity Flame Spread Surrogate",
        "Clear cast PMMA samples in opposed flow in the ISS Microgravity Science Glovebox.",
        page=63,
    )
    oxygen_method = _pdf_evidence(
        f"{STUDY}:method:oxygen", "BASS-II oxygen measurement scope",
        "§5.4, Oxygen Concentration Analysis",
        "Oxygen data are available at test start and end. The report assumes a linear "
        "profile to estimate intermediate oxygen. No segment oxygen is imported.",
        page=68,
    )
    evidence = [*catalog.evidence, configuration, oxygen_method]
    trials = []
    observations = []
    trial_quality = []
    for row_number, row in enumerate(rows, 1):
        test, thickness, width, faces, flows, rates, duration, initial, final = row
        if faces not in {"1", "2"}:
            raise ValueError(f"{test}: expected one or two burning faces")
        table_cells = dict(zip(HEADERS, row, strict=True))
        csv_line, operating = operational_rows[test]
        issues = _issues(table_cells, operating, test)
        locator = f"Table 5.1, data row {row_number}, test {test}"
        trial_id = f"{STUDY}:{test}"
        row_evidence = _pdf_evidence(
            f"{trial_id}:table51", f"BASS-II {test} published test conditions", locator,
            "\n".join(f"{column}: {value}" for column, value in table_cells.items()),
        )
        csv_evidence = Evidence(
            id=f"{trial_id}:operational", study_id=STUDY,
            title=f"BASS-II {test} operational sample record",
            text="\n".join(f"{column.strip()}: {value}" for column, value in operating.items()),
            source_url=CSV_URL,
            locator=f"{CSV_MEMBER}, CSV line {csv_line} (header = line 1), PI=Miller, "
                    f"Test #={test}, SHA-256 {CSV_HASH}",
            provenance="published",
        )
        evidence.extend([row_evidence, csv_evidence])
        static_conditions = {
            key: _known(value, original, configuration.id)
            for key, (value, original) in BASS_CONFIG.items()
        }
        static_conditions.update({
            "thickness_mm": _measure(thickness, "mm", row_evidence.id),
            "sample_width_mm": _measure(width, "cm", row_evidence.id, unit="mm", scale=10),
            "burning_faces": _known(
                int(faces), faces, row_evidence.id, unit="count", original_unit="count",
            ),
            "combustion_face": ConditionValue(status="not_reported", evidence_ids=[row_evidence.id]),
            "diameter_mm": ConditionValue(
                status="not_applicable", unit="mm", evidence_ids=[configuration.id],
            ),
        })
        conditions = {
            **static_conditions,
            "burn_duration_s": _measure(duration, "min", row_evidence.id, unit="s", scale=60),
            "oxygen_initial_pct": _measure(initial, "vol%", row_evidence.id, unit="%"),
            "oxygen_final_pct": _measure(final, "vol%", row_evidence.id, unit="%"),
        }

        velocities = _series(flows)
        spread_rates = [None] * len(velocities) if rates == "Not tracked" else _series(rates)
        if len(velocities) != len(spread_rates):
            raise ValueError(f"{test}: velocity and spread rate counts differ")
        segments = []
        for sequence, (velocity, spread) in enumerate(zip(velocities, spread_rates, strict=True), 1):
            # Preserve previously issued opaque identifiers across schema versions.
            segment_id = f"{trial_id}:stage:{sequence}"
            segment_evidence = _pdf_evidence(
                f"{segment_id}:table51", f"BASS-II {test}, flow entry {sequence}",
                f"{locator}, Velocity and Spread rate columns, listed entry {sequence}",
                f"Velocity cell (cm/s): {flows}\nSpread rate cell (mm/s): {rates}\n"
                f"Entry {sequence}: {velocity} cm/s, "
                + (f"{spread} mm/s." if spread is not None else "'Not tracked' at test scope."),
            )
            evidence.append(segment_evidence)
            segments.append(ConditionSegment(
                id=segment_id, sequence=sequence,
                evidence_ids=[segment_evidence.id, row_evidence.id, configuration.id, oxygen_method.id],
                conditions={
                    **static_conditions,
                    "flow_velocity_cm_s": _measure(velocity, "cm/s", segment_evidence.id),
                    "oxygen_pct": ConditionValue(
                        status="not_measured", unit="%", evidence_ids=[oxygen_method.id],
                    ),
                },
            ))
            observations.append(Observation(
                id=f"{segment_id}:spread", trial_id=trial_id, segment_id=segment_id,
                metric="flame_spread_rate_mm_s", unit="mm/s", provenance="published",
                value=float(_decimal(spread)) if spread is not None else None,
                status="known" if spread is not None else "not_measured",
                original_value=spread if spread is not None else rates, original_unit="mm/s",
                evidence_ids=[segment_evidence.id],
            ))

        sample_id = f"{STUDY}:sample:{operating['Sample #']}"
        trials.append(Trial(
            id=trial_id, study_id=STUDY, sample_id=sample_id, independent_unit_id=sample_id,
            label=f"BASS-II {test}", conditions=conditions, segments=segments,
            evidence_ids=[row_evidence.id, csv_evidence.id, configuration.id, oxygen_method.id],
            provenance="published", material_grade="clear cast",
            notes=list(issues.values()),
        ))
        trial_quality.append({
            "trial_id": trial_id, "sample_id": sample_id, "table_data_row": row_number,
            "operational_csv_line": csv_line, "table_cells": table_cells,
            "operational_cells": operating, "issues": issues,
            "segments": [{"id": segment.id, "sequence": segment.sequence} for segment in segments],
        })

    studies = [
        study.model_copy(update={
            "dataset_status": "unverified",
            "description": "Published BASS-II Table 5.1 data pending scientific review.",
            "source_urls": [*study.source_urls, f"{PDF_URL}#page={PDF_PAGE}"],
        }) if study.id == STUDY else study
        for study in catalog.studies
    ]
    bundle = DatasetBundle(
        schema_version="1.1",
        dataset_id=f"{STUDY}:table51-v1",
        description="Local scientific catalog with unverified BASS-II Table 5.1 observations.",
        studies=studies, trials=trials, observations=observations, evidence=evidence,
    )
    samples = Counter(trial.sample_id for trial in trials)
    quality = {
        "dataset_id": bundle.dataset_id,
        "review_status": "pending_scientific_review",
        "sources": {
            "pdf": {"member": PDF_MEMBER, "sha256": PDF_HASH, "url": PDF_URL,
                    "pdf_page": PDF_PAGE, "printed_page": 57, "table": "5.1"},
            "csv": {"member": CSV_MEMBER, "sha256": CSV_HASH, "url": CSV_URL},
        },
        "counts": {
            "studies": len(studies), "physical_trials": len(trials),
            "sample_based_independent_units": len(samples),
            "listed_flow_entries": len(observations),
            "spread_status": dict(Counter(obs.status for obs in observations)),
            "segment_oxygen_not_measured": len(observations),
            "issues": dict(Counter(code for row in trial_quality for code in row["issues"])),
        },
        "reused_sample_ids": [sample for sample, count in samples.items() if count > 1],
        "decisions": [
            "Flow and rate are paired by listed table order. The segment sequence does not "
            "encode timestamps or the length of each flow interval.",
            "Each segment observation belongs to its physical test and source sample.",
            "Each segment explicitly carries the documented static controls. The reported count "
            "of burning faces does not identify which face burned.",
            "Width uses the quantitative table rather than the nominal CSV description.",
            "Width converts cm to mm and test burn duration converts min to s.",
            "Oxygen endpoints remain trial conditions on the original volume percent basis. "
            "Segment oxygen is unavailable as a measurement.",
            "Operational display text is preserved separately from table velocities.",
        ],
        "trials": trial_quality,
    }
    return bundle, quality


def _checked_bytes(path: Path, expected_size: int, expected_hash: str) -> bytes:
    with path.open("rb") as source:
        contents = source.read(expected_size + 1)
    if len(contents) != expected_size or hashlib.sha256(contents).hexdigest() != expected_hash:
        raise ValueError(f"Source does not match the inspected version: {path.name}")
    return contents


def _read_pdf(contents: bytes) -> list[list[str]]:
    try:
        import pymupdf
    except ImportError as exc:
        raise ValueError("Install the isolated extractor with uv run --with pymupdf==2.1") from exc

    with pymupdf.open(stream=contents, filetype="pdf") as document:
        page = document[PDF_PAGE - 1]
        found = page.find_tables().tables
        if len(found) != 1 or found[0].col_count != len(HEADERS):
            raise ValueError("Could not isolate Table 5.1 on PDF page 65")
        # Geometry-based extraction keeps the PDF's decimal glyphs in reading order.
        return [
            [" ".join(page.get_text(clip=cell, sort=True).split()) if cell else ""
             for cell in row.cells]
            for row in found[0].rows
        ]


def load_table51(datasets: Path, catalog: DatasetBundle) -> tuple[DatasetBundle, dict]:
    """Verify both known source versions and build the BASS-II records in memory."""
    from io import StringIO

    pdf = _checked_bytes(datasets / PDF_MEMBER, 48_972_416, PDF_HASH)
    csv_text = _checked_bytes(datasets / CSV_MEMBER, 16_590, CSV_HASH).decode("utf-8-sig")
    with StringIO(csv_text, newline="") as source:
        return build_bundle(_read_pdf(pdf), csv.DictReader(source, strict=True), catalog)


def extract(datasets: Path, catalog_path: Path, output_dir: Path) -> dict:
    """Verify both inputs and write the canonical bundle and quality report locally."""
    bundle, quality = load_table51(datasets, load_bundle(catalog_path))
    files = {
        "bundle.json": bundle.model_dump_json(indent=2) + "\n",
        "quality.json": json.dumps(quality, ensure_ascii=False, indent=2) + "\n",
    }
    output_dir.mkdir(parents=True, exist_ok=False)
    for name, contents in files.items():
        (output_dir / name).write_text(contents, encoding="utf-8", newline="\n")
    return quality["counts"]
