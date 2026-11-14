# P2 handoff for the 24-study NASA corpus

The P2 implementation from `lujan` is integrated into `main`, including the PR #3
merge `0b732cb`. New work starts from `origin/main`; retain existing branch changes
when merging it. The additional catalog, metric-selector and documentary Saffire
integration is implemented and locally verified in `raul`, code `20aab80404fc2f0fc188d718cac47d0d4bf31d54`.
PR #4 delivers this closure on `main`; PR #3 records the previous integration. See
[current integration guide](INTEGRATION_P2_MAIN.md), [verification](VERIFICATION.md),
[current status](IMPLEMENTATION_STATUS.md) and [team handoff](TEAM_HANDOFF.md).
The branch/commit references below describe the extraction history.

For the versioned team demo, see [P2 demo handoff](handoffs/P2_DEMO.md) for the
portable bundle, SHA-256 checks, verified BASS-II presets and Saffire contrast.

Starting commit on `lujan`: `6e3350ef7fb2bdda2d57c26ce1111536381f60b6`.
The scope follows the [P3 study matrix](https://github.com/Ryo-936hz/Flame-in-Freefall/blob/f25a4a251769d8bd1ed31617adee486dacf34425/evals/science/NASA_24_REVIEW.md).
Every study has a profile with its question, source inventory, row granularity and review limits.

The follow-up on `lujan` starts from `cfc0795`. It uses P1's shared segment contract
(`94989a7`) and P3's comparison and evaluation baseline (`8134b1c`). The bundle
uses schema 1.1. Its canonical segment fields are `segments`, `sequence` and `segment_id`.

## Generate and open the corpus

A **bundle** is a JSON file containing the studies, evidence, trial records, and normalized
observations in the format accepted by the importer. `quality.json` records how those records
were obtained, what was excluded, and which source discrepancies remain. Both outputs are local.

For Windows, use the complete PowerShell import/start commands in [DEMO](DEMO.md).
They use the project's `.venv` and a dedicated SQLite file; importing a released
bundle does not require the original files or a globally installed uv.
The following extraction commands use Bash syntax and require the original sources.

With the inspected originals under `datasets/`, run from the repository root. Choose a new
output directory for each extraction. The extractor checks the source sizes and SHA-256 hashes.

```bash
uv run --locked --with pymupdf==2.1 python -m flamelab.data.cli \
  extract-nasa datasets --output-dir data/processed/nasa-24-v11
uv run --locked python -m flamelab.data.cli validate data/processed/nasa-24-v11/bundle.json
uv run --locked python -m flamelab.data.cli import \
  data/processed/nasa-24-v11/bundle.json --database-url sqlite:///work/nasa-24-v11.db
```

To open the integrated Evidence Canvas/Mission Lab interface, start the API with the corpus database and run `npm run dev:web`
in another terminal. Open the URL printed by Vite and use **Catálogo de estudios**.

```bash
FLAMELAB_DATABASE_URL=sqlite:///work/nasa-24-v11.db FLAMELAB_SEED_DEMO=false \
  FLAMELAB_AI_PROVIDER=demo uv run --locked uvicorn flamelab.main:app --host 127.0.0.1 --port 8000
```

Clients can list studies with `/api/v1/studies` and paginate over `evidence` and `observations`
at `/api/v1/studies/{study_id}/evidence` and `/api/v1/studies/{study_id}/observations`,
using `offset` and `limit`. The observations route also accepts a `metric` filter.
The existing `/api/v1/trials?study_id=…` returns the mapped configurations and record IDs.

## Coverage and limits

The generated corpus contains **24 studies**, **2,265 evidence entries**, **1,058 trial or
configuration records**, and **1,673 observation entries**, of which **1,283** have a value.
The source check verified 123 inventory files. The 22 CSV files contribute 2,009 nonempty
records with original cells and locators. The report identifies 861 blank records and 50 exact
duplicate rows. Documentary evidence preserves the source identity, including the inventory
path and SHA-256 for documents that were indexed without extracting their contents.

| Study | Mapped record count | Numeric or configuration use |
| --- | ---: | --- |
| BASS-II (PSI-25) | 20 | Flame spread rate by linked flow stage. Oxygen endpoints are trial-scoped. |
| FLEX (PSI-69) | 265 | Reported burn duration, termination category and visible extinction diameter where the source records extinction. |
| SAME (PSI-102) | 4 | Reported mass loss rate, aging duration and inlet flow. Audit whether the mass loss rate was measured or imposed. |
| SAME-R (PSI-101) | 107 | Separately named run, primary mixing, primary aging and net aging times. Related suffixes share a provisional sample stem. |
| CFI-G (PSI-159) | 333 | Normal/inverse configurations, selected positive reported times and peak burner temperature for affirmative hot ignition. |
| Flame Design (PSI-10) | 327 | Normal/inverse configurations, including supported pressure and composition fields. Thermochemistry and other source fields remain accessible through evidence and the quality report. |
| Saffire I (PSI-98) | 2 | Reported burn duration and supported ignition/flow conditions. Dimension discrepancies and oxygen approximations stay traceable for review. |
| Remaining 17 studies | — | Study profiles, sources, original CSV records or documentary metadata, according to source availability and interpretation. |

The new outcome metrics are specific to their source campaign. The API validates that
an observation belongs to its metric's study and filters out other campaigns in comparison.
Records with unresolved independence are counted separately from identified experimental
units. BASS-II retains its 20 sample-based units and 43 linked conditions. The scientific
status of mapped studies is `unverified`; decisions about censored runs, ambiguous fields,
derived values and cross-campaign compatibility are for P3 review.

BASS-II writes the documented effective controls into each segment. Initial/final O₂
and total duration stay with the trial. The table gives `burning_faces` as a count and
leaves the identity `combustion_face` unresolved. P3's comparison separates published,
digitized and derived observations and isolates segments with unresolved controls.
Its stable weighted scoring and midpoint arithmetic apply to queries across the corpus.
Use `condition_scope: "segment"` for ranking by an explicit segment condition.

## Analysis paths by family

| Family | Analysis supported by the current corpus | Evidence needed to extend it |
| --- | --- | --- |
| BASS/BASS-II and Saffire I–III | Show BASS-II Table 5.1 points within documented material, dimensions, face count and flow direction. Report both observations and physical trials. Present Saffire configuration and scale in a separate panel. | Match the spread metric, material, geometry, flow regime, and confinement between campaigns. The Saffire I/III CSVs lack a spread-rate field and the Saffire II field needs interpretation. |
| SAME/SAME-R and DAFT | Browse the reported flow, mass-loss and aging fields. Use DAFT as context for dust and detection instruments. | Obtain sized particle data, identify flight versus ground measurements and reconcile the instruments and protocols. The local CSVs do not provide particle-size distributions. [NASA SAME-R](https://psi.nasa.gov/physci/repo/data/investigations/PSI-101) |
| FLEX/FLEX-2 and CFI | Explore reported FLEX duration by end reason and the diameter at recorded visible extinction. Use FLEX-2 and CFI to describe the design conditions. | Diameter-versus-time needs a calibrated time series. A video extraction would require images with scale, frame timing and a published result to check. The local inventory has no videos. |
| ACME, SLICE, SPICE and PSI-142 | Use explicit CSV rules for identified ACME fields. Browse SLICE/SPICE records and use PSI-142 as a published figure index. | Resolve experiment identities and retrieve instruments, outcomes and figure axes from the cited reports where needed. Any model-assisted extraction requires a source locator and review before values enter ranking. |
| PSI-60, PSI-62, PSI-115 and PSI-117 | Keep modeling and reanalysis records linked to the source studies where confirmed. NASA identifies both BASS and BASS-II imagery as inputs to PSI-62. | Match the exact original trials before importing derived results and distinguish simulations, signal reconstructions and observations. The PSI-62 relationship is confirmed at study level. [NASA PSI-62](https://psi.nasa.gov/physci/repo/data/investigations/PSI-62) |

## Verification and handoff

- Extracted the real corpus twice in WSL and compared both JSON outputs byte-for-byte.
- Validated and imported the corpus in SQLite. Repeated import returned `changed: false`.
- Tested access to the 24 study profiles and their evidence, observation pagination, source
  links, campaign isolation, and counting unresolved independence through the API.
- Regenerated OpenAPI and TypeScript from the executable API contract. See
  [VERIFICATION](VERIFICATION.md) for the commands and results.

For the 1.1 review, validate [P1's example](examples/sequential_conditions.json)
and run both [P3 evaluation suites](../evals/science/README.md). With the local
1.1 BASS-II and NASA bundles generated, run the real-data integration tests with:

```bash
FLAMELAB_BASS_BUNDLE=data/processed/bass-table51-v11/bundle.json \
FLAMELAB_NASA_BUNDLE=data/processed/nasa-24-v11/bundle.json \
uv run --locked pytest -q apps/api/tests/test_condition_segments.py \
  apps/api/tests/test_p2_integration.py apps/api/tests/test_nasa_corpus_integration.py
```

P1 should review the additive contract, generated artifacts, and existing storage compatibility.
P3 should review the per-campaign mappings against `quality.json`. P4–P6 can use the catalog
and observation endpoints on an integrated branch to connect their evidence and report views.
