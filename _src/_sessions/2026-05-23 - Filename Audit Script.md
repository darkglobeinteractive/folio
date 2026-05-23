# Session Summary — Filename Audit Script

**Date:** 2026-05-23

---

## What We Covered

This session focused on pre-work before building the app: auditing the existing media filenames to understand what can be parsed and what needs cleanup. The goal is to produce a CSV report that can be reviewed and acted on before generating preview JPEG files.

---

## Decisions Made

### Filename Parsing Is Opportunistic, Not Mandatory
The original concept described filenames as always following a structured convention. This session clarified that the convention is a target, not a guarantee — many files deviate in predictable ways. The parser should extract whatever it can rather than treating non-conforming filenames as failures.

### Detected Filename Types
Five patterns were identified:

| Type | Example |
|---|---|
| Full (date + description + codes) | `1985-10-15 - Graduation - lr-JAS-MAR.tif` |
| Date + description | `1985-10-15 - Summer Holiday.tif` |
| Description + codes (no date) | `Graduation - lr-JAS-MAR.tif` |
| Description only | `Old House.tif` |
| Numbered/Ordered | `07-02 - Front Cover.tif` |

### Date Disambiguation Rule
Dates are always 4-digit years (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`). Any numeric prefix shorter than 4 digits (e.g. `01`, `01-02`) is an ordering prefix for albums/collections, never a date.

### Family Member Code Format
Codes start with an uppercase letter, followed by 0–4 characters of any case or digit (e.g. `JAS`, `ESg`, `J1Sa`, `U`). Digits are used for disambiguation when multiple relatives share the same name across generations. `U` is a valid single-character code meaning "Unidentified."

### Multiple Arrangement Groups
The codes section can contain more than one arrangement indicator (e.g. `br-AJB-ESg-fr-DMSa` = back row / front row). Arrangement indicators are all lowercase; codes start with uppercase. The parser collects all arrangement groups.

### False Positives Are Acceptable for Now
Regular words at the end of a filename (e.g. `Back`, `Dog`) can match the code pattern. Tightening the regex was discussed and deferred — the audit is for human review anyway, and proper code validation will come later via a family members SQL file.

### Exclusion List: `_folio-exclude.txt`
A plain text file at the Media Root lists paths to exclude from the scan (and later, from the app). Supports wildcard suffix (`/*`) to exclude a directory and all its contents. Lines beginning with `#` are comments. The file is optional — if absent, nothing is excluded.

---

## Artifacts Created

- `_src/_tools/audit-filenames.js` — Node.js script that scans the Media Root and writes a `filename-audit.csv` report
- `_folio-exclude.txt` — exclusion list at the Media Root (template with commented-out examples)

---

## Open Questions / Carried Forward

- **SQL validation layer:** A family members SQL file was offered and deferred. Once shared, the audit script can cross-reference parsed codes against known family member codes and flag unrecognized ones in the Notes column.
- **JPEG subdirectory exclusion:** The audit runs before JPEG previews exist, so no issue now. On future runs, `JPEG/` subdirectories may need to be excluded to avoid auditing proxy files.
