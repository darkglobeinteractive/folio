# Family Archive — Initial Concept

This document captures the design thinking from the first planning session on 2026-05-21. It is intended as the starting point for all future sessions on this project.

---

## 1. Technologies

### Desktop App Framework: Electron
Electron packages a web app as a standalone desktop application that runs without a browser or internet connection. It includes a Node.js runtime, which gives the app direct access to the filesystem — critical since all files live on the drive. The app directory (`_Folio/`) lives in the root of the ExFAT drive alongside the archive files. See the Directory Structure document for the full layout.

**Why Electron over a plain browser app:** Browsers block local filesystem access for security reasons. Electron sidesteps this by running as a native app with Node.js handling all file I/O.

### UI Layer: React
React will power the interface. The user has prior React experience and prefers it over alternatives like Vue.js.

### Database: SQLite (via `better-sqlite3`)
A single `.db` file lives on the drive alongside the app. No server process, no setup — SQLite is self-contained and works on both Mac and Windows. The `better-sqlite3` Node.js package provides synchronous access, which simplifies Electron's main process code considerably.

### Language: JavaScript (Node.js + React)
- Electron's **main process** (Node.js): filesystem access, database queries, filename parsing
- Electron's **renderer process** (React): all UI components and user interaction
- No PHP. No backend server.

### Supporting Libraries (likely, not finalized)
- `better-sqlite3` — SQLite bindings for Node.js
- `react` + `react-dom` — UI framework
- `electron-builder` — packaging the app for Mac and Windows distribution
- `PDF.js` — in-browser PDF preview
- Native HTML5 `<img>` and `<video>` tags for image and video preview (JPG proxies for images — see Section 3)

---

## 2. Directory and Filename Parsing

### Directory Traversal
Node.js's built-in `fs` module will recursively walk the drive's directory tree. The directory browser panel in the UI will display this tree, allowing the user to expand folders and see files within them. Traversal happens in Electron's main process and results are sent to the React renderer via IPC (inter-process communication).

**Traversal exclusion rule:** Any root-level entry beginning with `_` or `.` is skipped. This keeps `_Folio/` and `.archive/` out of the directory browser without requiring a hardcoded name list.

For deeper exclusions (e.g. subdirectories kept on the drive for completeness but not relevant to the app), a `_folio-exclude.txt` file at the Media Root lists relative paths to skip. A wildcard suffix (`/*`) excludes a directory and all its contents. The app reads this file at startup; lines beginning with `#` are comments.

### Filename Parsing

Filenames follow a structured naming convention where possible, but many files deviate in predictable ways. The parser extracts whatever it can rather than treating non-conforming filenames as failures.

The canonical full format is:

```
{date} - {description} - {arrangement}-{CODE}-{CODE}-{CODE}.{ext}
```

**Example:**
```
1985-10-15 - Graduation with Family - lr-JAS-MAR-NDA.jpg
```

**Detected filename patterns:**

| Pattern | Example |
|---|---|
| Full (date + description + codes) | `1985-10-15 - Graduation - lr-JAS-MAR.tif` |
| Date + description only | `1985-10-15 - Summer Holiday.tif` |
| Description + codes (no date) | `Graduation - lr-JAS-MAR.tif` |
| Description only | `Old House.tif` |
| Numbered/Ordered | `07-02 - Front Cover.tif` |

**Parse logic (split on ` - `, space-dash-space):**

1. **Part 0** — tested against date and ordering patterns in order:
   - Matches `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` → extracted as date
   - Matches 1–3 digits or `XX-XX` (e.g. `01`, `07-02`) → ordering prefix for albums/collections, not a date. Dates are always 4-digit years; shorter numeric prefixes are never dates.
   - Otherwise → Part 0 is the start of the description
2. **Last part** — tested as a codes section (see below). If it matches, it is removed from the description.
3. **Everything remaining** → joined as the description/title.

**Codes section sub-parse (split on `-`):**

- Arrangement indicators are all-lowercase tokens (e.g. `lr`, `cw`, `ccw`, `br`, `fr`)
- Family member codes start with an uppercase letter, followed by 0–4 characters of any case or digit (e.g. `JAS`, `ESg`, `J1Sa`, `U`)
- `U` is a valid single-character code meaning "Unidentified"
- Digits in codes (e.g. `J1Sa`, `J2Sa`) disambiguate relatives who share the same name across generations
- Multiple arrangement groups are allowed (e.g. `br-AJB-ESg-fr-DMSa` = back row / front row)
- A codes section with no arrangement indicator is valid when all tokens are codes (e.g. `ACS-RDI` — two people, arrangement not specified)

### Auto-Detection of Family Members
On file scan, the app will:
1. Parse the filename using the above logic
2. Pre-populate the entry form with date and title already filled in
3. Look up each code against `family_members.code` in the database
4. Pre-tag matched members in positional order (position 1, 2, 3...)
5. Flag any unrecognized codes — surfacing them as warnings in the UI so the user knows to add that family member first

This means the majority of files will arrive partially or fully tagged with zero manual work.

---

## 3. Image Preview Strategy

All archive images are archival-quality TIF files. TIFs are not natively previewable in a browser context (Electron's renderer) and are too large to load on demand. Before the app is put into use, JPG copies of every image must be generated and placed on the drive.

### JPG Generation

Photoshop's **Image Processor** (File > Scripts > Image Processor) handles bulk conversion. Configured with:
- Source: the drive root folder
- "Include All Subfolders" checked
- "Save in Same Location" checked
- Output format: JPEG at the desired quality

Image Processor creates a subdirectory named `JPEG` alongside the source files in each person folder, preserving the directory structure automatically:

```
/John Smith/photo-01.tif
/John Smith/photo-02.tif
/John Smith/JPEG/photo-01.jpg
/John Smith/JPEG/photo-02.jpg
```

### Convention

The subdirectory name (`JPEG`) is a convention, not a technical requirement. What matters:
- The subdirectory sits alongside the TIF files (same parent folder)
- The JPG filename matches the TIF filename exactly (minus extension)
- The app knows the subdirectory name and uses it consistently for preview lookups

Since Photoshop defaults to `JPEG`, that name requires no extra configuration and is the current working convention. The app will look for `[parent]/JPEG/[filename].jpg` when rendering a preview for any TIF file.

---

## 4. Database Schema

### `family_members`

```sql
CREATE TABLE family_members (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT UNIQUE NOT NULL,   -- e.g. "JAS" derived from name
    first_name  TEXT NOT NULL,
    middle_name TEXT,
    last_name   TEXT NOT NULL,
    birth_date  TEXT,                  -- approximate ok, stored as text
    death_date  TEXT,                  -- nullable
    notes       TEXT,
    father_id   INTEGER REFERENCES family_members(id),
    mother_id   INTEGER REFERENCES family_members(id),
    spouse_id   INTEGER REFERENCES family_members(id)
);
```

**Relationship design note:** Storing `father_id` and `mother_id` as self-referential foreign keys is a sound genealogy pattern (adjacency list). From two parent IDs, all other relationships — grandparents, siblings, aunts, uncles, children — can be derived. SQLite supports recursive CTEs (Common Table Expressions) that can traverse the family tree in a single query, which is an upgrade over firing multiple sequential queries.

---

### `entries`

```sql
CREATE TABLE entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path   TEXT UNIQUE NOT NULL,  -- relative to drive root
    title       TEXT,
    description TEXT,
    date        TEXT,                  -- parsed from filename; may be partial
    location    TEXT,
    tags        TEXT,                  -- comma-separated free-form tags
    arrangement TEXT                   -- e.g. "lr", "cw", "ccw"
);
```

---

### `entry_members` (junction table)

```sql
CREATE TABLE entry_members (
    entry_id  INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    position  INTEGER,                 -- order of appearance (1, 2, 3...)
    PRIMARY KEY (entry_id, member_id)
);
```

This replaces the comma-separated family member field from the earlier prototype. It is a proper many-to-many relationship: one entry can tag many members, and one member can appear in many entries. The `position` field preserves the left-to-right (or clockwise, etc.) order extracted from the filename.

---

## 5. Version Control & Distribution

### Repository
The source code lives in a GitHub repository named `folio`. The local clone is in a directory named `_Folio/` — the name mismatch is intentional and causes no issues; Git tracks the remote by URL, not by local folder name.

### What Is and Is Not in the Repository
`_src/` and its contents are tracked by git. The following are excluded via `.gitignore`:

| Excluded | Reason |
|---|---|
| `folio.db` | Contains personal family data — names, dates, relationships. Never committed. |
| `_Folio.app` / `_Folio.exe` | Build artifacts; regenerated by `electron-builder`. |
| `_src/node_modules/` | Installed by `npm install`; too large to commit. |
| `_src/dist/` | Build output directory. |

### `schema.sql`
The database schema is tracked in `_src/schema.sql`. On first launch — when no `folio.db` is found — the app reads this file and initializes a fresh database. This means the repository documents the data structure without exposing any data.

### Distribution
Family members receive a copy of the drive with `_src/` removed from `_Folio/`. Their copy contains only:

```
_Folio/
├── folio.db        ← pre-populated copy from master
├── _Folio.app
└── _Folio.exe
```

`folio.db` is copied manually drive-to-drive, never distributed through GitHub. Once a family member receives their copy, their database is their own — there is no sync mechanism, and databases will diverge as each person adds notes and metadata through the app.

---

## 6. Planned Admin MVP — Screen Outline

The first phase of the project is an **admin interface** for metadata management. A public-facing viewer comes later.

1. **Directory Browser** — left panel, collapsible tree of the drive's folder structure
2. **File List** — right panel, files in the selected folder; visual badge indicates whether a metadata record exists yet
3. **File Detail / Editor** — clicking a file opens:
   - A preview (JPG proxy for TIF images loaded from the `JPEG/` subdirectory; native video; PDF.js for PDFs)
   - A metadata form pre-populated from the filename parse
   - A multi-select family member picker (dynamically populated from the database)
   - A Save button that writes to SQLite

---

## 6. Follow-Up Questions for Next Session

The following items were not finalized and should be addressed before writing code:

1. **`family_members` fields not fully decided** — Beyond what's listed above, are there additional fields needed? (e.g. a profile photo field pointing to a file on the drive, a bio/notes field, living/deceased flag)

2. **Known arrangement indicators** — `lr` and `cw` are confirmed. What is the full list of indicators used in existing filenames? Knowing all variants ensures the parser handles them correctly.

3. **Tags field design** — Currently proposed as comma-separated text on `entries`. Should tags be a controlled vocabulary (a separate `tags` table) or free-form? Free-form is simpler to start.

4. **File types in scope** — The archive contains `.tif`, `.mov`, `.aif`, `.pdf`, `.txt`, `.doc` and likely others. TIF image preview is resolved (JPG proxies via Photoshop Image Processor — see Section 3). Audio files (`.aif`) and Word documents (`.doc`) still need a decision: real preview vs. a placeholder icon.

5. **Partial dates** — Some filenames may have only a year (`1985`) or year and month (`1985-10`). The UI and database should handle approximate dates gracefully. Agree on a display and sort strategy.

6. ~~**Database file location and name**~~ — **Resolved.** `folio.db` lives in `_Folio/` at the repository root. It is gitignored (privacy). The schema is tracked separately in `_src/schema.sql` and used to initialize the database on first launch. See Section 5.

7. **Unrecognized codes workflow** — When the parser finds a code with no matching family member, should the UI block saving until it's resolved, or allow saving with the unknown code stored as a string for later cleanup?

8. **Public viewer phase** — Not in scope for the admin MVP, but worth a brief discussion on what the viewer would look like so the schema and data model don't need to be redesigned later to support it.
