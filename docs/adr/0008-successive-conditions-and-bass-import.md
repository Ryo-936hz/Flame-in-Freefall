# ADR 0008: successive conditions and local BASS-II import

Date: 14 November 2026.

Status: adapted to P1's shared 1.1 contract and P3's scientific rules on `lujan`.
Integration review and scientific review of the real corpus remain pending.

## Problem

BASS-II Table 5.1 reports successive flow/rate pairs within physical tests.
Duplicating a Trial for each pair would misrepresent the experimental unit.
Assigning one trial-level flow to every observation would plot incorrect X values.
Initial/final oxygen are not measured oxygen for every intermediate condition.

## Decision

Keeping the old single-condition model would either discard the series or require
duplicating trials. Deferring the whole import would leave P2 without an integrated
deliverable. The selected extension preserves physical identity while keeping
legacy unstaged bundles readable.

Use `Trial.segments`, `sequence` and `Observation.segment_id` from P1. The BASS-II
importer explicitly declares each segment's source-backed controls. Initial/final
oxygen and total burn duration describe the trial. `burning_faces` preserves the
published count. `combustion_face` remains unknown where the table does not identify
the face. Sequence means source order without a timestamp.

Rank on trial conditions by default. Explicit segment mode ranks each trial once
and passes eligible segment IDs to comparison. Plot each observation using its
linked segment and retain the physical unit. P3 comparison separates provenance
and isolates unknown controls by segment. P3 ranking and medians use exact
intermediate arithmetic for large finite inputs.

Version 1.0 canonical bundles remain readable alongside newly extracted version 1.1.
Storage adapts previously saved P2 research and corpus snapshots on read and compares validated content
as well as the stored digest so additive defaults do not force replacement of an
unchanged old corpus. Existing immutable snapshot payloads are not rewritten.
JSON-backed persistence needs no relational table migration for these fields.
OpenAPI and TypeScript are regenerated from Pydantic in the same increment.

Affected areas: `domain/contracts.py`, `science/`, `data/`, `ai/engine.py`,
`ai/report.py`, `storage/repository.py`, generated `packages/contracts/`, and their
tests. P5/P6 consume the additive generated types through the existing client.

## Source handling

Use a deterministic extractor for the fixed, hash-verified NASA report and
operational CSV. PyMuPDF runs as an isolated extraction dependency; server runtime
dependencies and lockfiles do not change. Join tests to source sample numbers,
preserve cells and locators, normalize units explicitly, and emit a quality report.
The local bundle is importable and marks BASS-II `unverified`; original files and
generated numerical artifacts remain outside Git. Synthetic fixtures stay separate.
Saffire remains documentary because its metadata and measurement definitions need
further reconciliation.

## Verification and limits

Contract, science, data and persistence tests cover stage references, selected-stage
filters, missing values, zero, units, duplicate identities and legacy snapshots.
The opt-in real-source integration test covers API research, source lookup,
scenario changes and report/evidence recovery after restart and corpus replacement.
Executed results are in [VERIFICATION](../VERIFICATION.md).
Software verification is not scientific review or a redistribution license.
