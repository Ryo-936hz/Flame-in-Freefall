# P2 source audit

## Local corpus

All 24 study IDs in [the catalog](../data/catalog/psi_metadata.json) have a directory under `datasets/`. All 123 original file paths in [the archive inventory](../data/catalog/zip_inventory.json) are present there and match their recorded SHA-256 hashes. The scan excluded files whose names contain `Zone.Identifier`.

The 26 directories include `PS-21` and `PSL-10`, which hold copies of `PSI-21` and `PSI-10` metadata. The six metadata pairs outside the inventory paths are byte-identical to their corresponding files under `Investigation Metadata Files/`. The pairs occur under those two aliases and under `PSI-20`, `PSI-22`, `PSI-23` and `PSI-25`. The 135 loose files below the study directories therefore contain 123 inventoried originals and 12 additional copies.

| Local archive | Bytes | File members | SHA-256 |
| --- | ---: | ---: | --- |
| `datasets/datasets_lujan.zip` | 130464918 | 123 | `5fcfa48e95a7c9ff84462c9fb498e144fc401bb22c0b09e18ff36d582e61c644` |
| `datasets/datasets.zip` | 130412582 | 75 | `11e60661704b71ccf5075b64a2029a43530642a9c53b0de1496395f9e92183f7` |

The first archive matches the original inventory. All 75 files in the second archive match inventoried paths and digests. That archive omits the 48 loose ISA text copies and includes the 24 study metadata ZIPs. The audit read the archives in place.

## BASS-II Table 5.1

The primary quantitative source is Olson et al., NASA/TM-20210011385 (October 2021), Table 5.1 on PDF page 65, printed page 57. The operational CSV supplies the PSI sample number. Use the exact source filenames and hashes below relative to `datasets/`. [NASA Technical Memorandum, Table 5.1](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65) · [NASA PSI-25 investigation](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25)

| Source file | SHA-256 | Locator |
| --- | --- | --- |
| `PSI-25/Reports/PSI-25_Reports_BASS-II Summary Report.pdf` | `5ffa911fd9b6356f204646003fb9342e341810dcdfdf5cb15756e7f01ec5f770` | PDF page 65, Table 5.1, data rows 1–20 |
| `PSI-25/Experimental table/PSI-25_Experimental table_BASS-II.csv` | `71e792bf6b5fb5ea620c5dd70fbbac05515992e12aefcf5dff47312caa48c042` | Physical lines 28–47, `PI`, `Test #`, `Sample #`, `Fuel Sample Material`, `Air display` and calibrated oxygen columns |

- **Experimental unit.** Sections 5.1 and 5.3 describe clear cast PMMA slabs in opposed flow in the ISS Microgravity Science Glovebox. The report describes changes to flow during a single burn. Table 5.1 has 20 physical tests and the CSV has 20 matching Miller rows with distinct sample numbers. Pair flow and spread-rate entries by their listed position. Use the table order as the sequence and keep all entries linked to the same physical test. Table 5.1 provides no start or end timestamps for individual conditions.
- **Coverage and absence.** The table lists 43 flow entries, 39 paired numeric spread rates and four absent rates. M6 and M12 each list two flows and report `Not tracked` once for the test. Preserve that original cell and retain both nulls per test.
- **Oxygen.** All 20 published initial/final pairs match their calibrated CSV fields numerically. Section 5.4 on PDF page 68 describes a linear estimate from two endpoints. The endpoints are test-scoped, and per-condition oxygen is unmeasured. The table cannot supply a measured constant-oxygen comparison. [NASA Technical Memorandum, section 5.4](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=68)
- **Dimensions and faces.** Table 5.1 and PDF page 66 report widths of 1.2 and 2.2 cm. The prose on PDF pages 63–64 and some `Fuel Sample Material` descriptions use nominal 1 or 2 cm. Preserve both sources and use the table width for its reported measurements. Keep the number of burning faces as a distinct condition and burn time as test duration in minutes in the source.
- **Airflow and rate discrepancies.** PDF page 13 distinguishes the fan-voltage display and velocity transducer. The operational `Air display` and the Appendix A.4 matrix (PDF pages 116–117) list settings or readings that can differ from Table 5.1. For example, M12's CSV line 39 reports `<1` while Table 5.1 lists 12 and 10 cm/s. Figure 5.2 shows three successive flows in M8. In listed flow order, its printed fit slopes are 0.0637, 0.0557 and 0.0391 mm/s, while the table reports 0.057, 0.056 and 0.04 mm/s. Retain the table's values with the discrepancy visible to the reviewer.

The investigation DOI `10.60555/4qc4-de67` matches the local ISA record, and NASA PSI lists license `CC0-1.0` for the investigation. The separate NTRS memorandum record lists public distribution and copyright metadata “Use by or on behalf of the US Gov. Permitted.” The generated transcription and original files stay local. These catalog statements have distinct scope. [NASA PSI-25 investigation](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25) · [NASA NTRS record](https://ntrs.nasa.gov/citations/20210011385?linkId=139860916)

Checks performed in WSL used Python `hashlib`, `zipfile` and `csv`. PyMuPDF 2.1 produced the text and image for the visual review of Table 5.1 and Figure 5.2. An independent reading-order extraction matched all 180 data cells in the generated quality report after normalizing whitespace. Direct comparison returned 39 known points across 18 sample IDs. With flow as the varied condition, unresolved controls kept the 20 selected tests in separate groups, including two groups without known spread observations. An explicit 6 cm/s filter retained four points, each from the requested condition. Requiring a stage oxygen measurement yielded no eligible tests. At the time of this initial audit, P3 comparability and P1 contract reviews were pending. The subsequent decisions below supersede that blanket status without resolving every scientific question.


## Subsequent integration and limited P3 decision

The shared segment contract and its consumers have since been integrated into
`main`; PR #3 merged as `0b732cb` includes the P2/P3 data and P6 demo connections.
The [P3 decision](handoffs/P3_BASS_II_DECISION_DEMO.md) approves the descriptive
use of ten specified BASS-II observations from seven samples, with the M8
table/figure discrepancy visible and the lunar case free of an inherited flow filter.
This is not a global scientific approval or a causal estimate of the flow effect.

The [P2 demo package 1.1.1](handoffs/P2_DEMO.md) preserves the base bundle's values,
identities and review flags. Its two changes to the bundle are the M8 discrepancy
notices added to the corresponding evidence texts. It does not mark the corpus
as reviewed; the API remains `scientific_unverified`. Package/case-copy changes
and the base extraction have distinct hashes and scopes.

Per-segment oxygen remains unmeasured; the M8 discrepancy, nominal/operational
dimensions, cross-campaign comparability, and applicable redistribution terms
remain open within their documented scope. The other campaigns are not approved
by these ten points or by passing software tests.
