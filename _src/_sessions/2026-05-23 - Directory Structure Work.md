# Session Summary — Directory Structure Work

**Date:** 2026-05-23
**Documents updated:** `2026-05-23 - Directory Structure.md`, `2026-05-21 - Initial Concept.md`

---

## Decisions Made

### Single Underscore Prefix Convention
All app-related items use a single `_` prefix. This sorts them above the media directories in any file browser and provides a consistent visual grouping. Double underscores were considered and rejected for consistency.

### `_Folio/` as the Unified App Directory
All app content — source code, built executables, and the database — lives under a single `_Folio/` directory at the drive root. This makes the directory traversal exclusion rule simple: skip any root-level entry beginning with `_` or `.`.

### `_Folio/` Is the Git Repository
`_Folio/` is the local clone of the GitHub repository named `folio`. The name mismatch between the local folder and the remote repo is intentional and causes no issues — Git tracks remotes by URL.

### `folio.db` Is Gitignored
The database contains personal family data (names, dates, relationships, photo metadata) and must never be committed to the repository. `schema.sql` in `_src/` serves as the version-controlled record of the database structure and is used to initialize a fresh `folio.db` on first launch.

### Distribution Strategy
Family members receive a manual drive-to-drive copy with `_src/` removed. Their copy contains only the built app and a pre-populated `folio.db`. After distribution, each database is independent — no sync mechanism exists, and they will diverge over time.

### Electron Source Structure
`_src/main/` handles the Electron main process (Node.js, SQLite, IPC). `_src/renderer/` holds the React UI. Keeping them in separate subdirectories reflects that they run in different contexts.

## Open Questions (Carried Forward)
Follow-up questions 1–5, 7, and 8 from the Initial Concept remain unresolved. See `2026-05-21 - Initial Concept.md` Section 7.
