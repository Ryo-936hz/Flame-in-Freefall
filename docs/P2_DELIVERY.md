# P2 delivery: real data and provenance

## Task and starting point

Implement a reproducible local BASS-II Table 5.1 extraction, canonical import,
successive-condition representation, provenance, quality checks, and a documentary
Saffire contrast. Acceptance requires traceable numbers, physical-test identity,
explicit missingness, idempotent import, and source/report recovery after restart.

- Working branch: `lujan`.
- Starting HEAD: `f981bdd4df55ca8339bfb7c92f21bc50802bfcca`.
- Fetched `origin/main` and common `origin/codex/team-start-v1`:
  `422f6b03f410c6ac049b699e13fc204a3af67743`.
- `git rebase -X ours origin/main` reported the branch already up to date.
  During a rebase, `ours` is the upstream side, matching the requested preference
  for main. No conflict occurred.
- The previous incomplete attempt is preserved in the stash named
  `p2-before-fresh-restart-20261114` and backup branch
  `backup/lujan-before-p2-restart-20261114`. It was not reapplied.
- The branch-only commit retains dataset/Windows-metadata ignore rules.
  No remote branch was rewritten or published by this delivery.

The user's current instruction authorizes the shared contract and consumer changes
needed for P2. P1/P3 still need to review these provisional integration choices;
automated checks do not replace their scientific review.

## Reproduce the local dataset

Run from the repository root, with the supplied `datasets/` directory available:

```bash
uv run --locked --with pymupdf==2.1 python -m flamelab.data.cli extract-bass-table51 datasets --output-dir data/processed/bass-table51
uv run --locked python -m flamelab.data.cli validate data/processed/bass-table51/bundle.json
uv run --locked python -m flamelab.data.cli import data/processed/bass-table51/bundle.json --database-url sqlite:///work/bass-p2.db
uv run --locked python -m flamelab.data.cli import data/processed/bass-table51/bundle.json --database-url sqlite:///work/bass-p2.db
FLAMELAB_BASS_BUNDLE=data/processed/bass-table51/bundle.json uv run --locked pytest apps/api/tests/test_p2_integration.py -q
```

The extraction tool uses an isolated PyMuPDF dependency; runtime requirements and
lockfiles remain unchanged. Use a fresh output directory to reproduce extraction.
`bundle.json` is the canonical import input; `quality.json` retains discrepancies,
source hashes, and review limitations. Originals and generated quantitative files
remain ignored local artifacts. The catalog and synthetic fixtures stay separate.

To explore this imported database through the existing API, use the same explicit
database URL and turn off automatic synthetic seeding:

```bash
FLAMELAB_DATABASE_URL=sqlite:///work/bass-p2.db FLAMELAB_SEED_DEMO=false FLAMELAB_AI_PROVIDER=demo uv run --locked uvicorn flamelab.main:app --host 127.0.0.1 --port 8000
```

An existing different corpus is replaced only with the CLI's explicit `--replace`.
The examples use a separate database. No external model key is needed.

## Review boundaries

One physical Miller test remains one Trial and one independent experimental unit.
Table entries become ordered conditions within that test; observations reference
their condition. The order follows the table, without invented timestamps.
Original strings and units remain available alongside normalized values and
cell-level evidence. Initial/final oxygen are test-level values; intermediate
oxygen is not assigned from either endpoint. Missing rates remain null.

The resulting BASS-II study is `unverified`, and its evidence is not marked as
scientifically reviewed. The comparison is descriptive, with unknown controls and
source discrepancies exposed. Saffire remains documentary context without imported
numeric observations. See [source audit](P2_SOURCE_AUDIT.md) and
[Saffire context](P2_SAFFIRE_CONTEXT.md).

The extracted series contains 20 physical tests, 43 listed conditions and 39 known
spread rates. M6 and M12 contribute four explicit missing rates, leaving 18 tests
with at least one known rate. Selected-trial/independent-unit counts include those
two tests even when their comparison groups have zero usable observations; the
observation count reports the available measurements separately.

## Shared contract and consumers

The executable contract gains ordered condition stages, observation-stage links,
original observation values/units, and explicit burning-face and test-level oxygen
fields. Ranking identifies eligible stages without multiplying trials; comparison
uses each observation's linked condition. Research passes the selected stage IDs
through to comparison. Profiles and groups distinguish stage counts from trial and
independent-unit counts.

OpenAPI and TypeScript must be regenerated from the executable model. Existing
unstaged fixtures and stored research remain supported. Persistence continues to
use validated JSON snapshots; no relational table migration is needed for these
additive fields. The contract changes affect P1 storage/API, P3 science, P4 research,
and P5/P6 typed consumers and require their review before integration into main.

## Verification and next step

Executed commands and results are recorded in [VERIFICATION](VERIFICATION.md).
Final results: 132 Python tests and 6 client tests passed; Ruff, generated-contract
drift checks, typecheck, build and HTTP/restart smoke passed. The validated real
series is imported in `work/bass-p2.db`, with the second import reporting no change.
Changes remain uncommitted on `lujan`; the starting SHA above is still HEAD.
The real-source HTTP test covers import twice, stage filtering, evidence lookup,
scenario change, insufficient evidence, report persistence, corpus replacement,
and reopening the API. It requires the local extracted bundle and skips explicitly
when that source artifact is unavailable; ordinary CI does not require private
local files.

Review the diff and quality report with P3, especially width discrepancies, M8's
figure/table difference, stage oxygen, and independence. P1 should review additive
contract compatibility and merge the shared consumer changes together. Source
rights and redistribution require a separate decision; this delivery does not
publish originals or claim a license determination.
