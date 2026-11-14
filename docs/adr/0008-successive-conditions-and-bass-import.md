# ADR 0008: successive conditions and local BASS-II import

Date: 14 November 2026.

Status: implemented provisionally on P2's `lujan` branch under the current user's
authorization; P1/P3 integration and scientific review remain pending.

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

Add ordered `Trial.condition_stages` with validated identifiers, condition maps and
contiguous source order. Each staged Observation must reference a stage belonging
to the same trial. Retain original observation values/units. Add explicit burning
faces, initial/final oxygen and total burn duration as trial-scoped conditions.
Stage values override inherited trial conditions, including explicit absence.
Order means source table order; it does not introduce timestamps.

Rank each physical trial once using its best eligible stage. Return eligible stage
IDs and pass them to comparison, keeping filters coherent. Plot each observation
using its linked stage and retain the trial/sample independent-unit identity.
Groups remain descriptive, isolate unknown controls and do not claim causality.
Expose stage counts, source notes and pending-review warnings to consumers.

The version 1.0 envelope remains readable: new fields have defaults, old unstaged
bundles and research snapshots still validate. Storage compares validated content
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
