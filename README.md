# Folio

Folio is a local file cataloging and annotation tool built with Electron, React, and SQLite. It runs entirely offline — no server, no internet connection, no cloud dependency. Everything lives on the drive alongside the files it indexes.

The initial use case is a family archive: thousands of media files and documents spread across an ExFAT drive, with dates, descriptions, and family member codes already encoded in every filename. Folio reads that naming convention, auto-populates metadata records, and provides a browsable interface for the collection.

---

## How It Works

The app lives in a `_Folio/` directory at the root of the drive, alongside the media directories it catalogs. When launched, it walks the drive's folder tree (skipping any root-level entries beginning with `_` or `.`) and surfaces a browsable directory view.

### Filename Parsing

Every file follows a structured naming convention:

```
{date} - {description} - {arrangement}-{CODE}-{CODE}-{CODE}.{ext}
```

**Example:**
```
1985-10-15 - Graduation with Family - lr-JAS-MAR-NDA.jpg
```

| Part | Example | Notes |
|---|---|---|
| Date | `1985-10-15` | `YYYY-MM-DD`, `YYYY-MM`, or `YYYY` |
| Description | `Graduation with Family` | Becomes the entry title |
| Arrangement + codes | `lr-JAS-MAR-NDA` | Arrangement indicator + family member codes in order |

On scan, the app parses each filename, pre-populates the metadata form, and looks up each code against the `family_members` table — tagging matched members automatically. Unrecognized codes surface as warnings so the user knows to add that person first.

### Image Previews

Archive images are archival-quality TIF files. For preview purposes, JPG copies are generated in advance using Photoshop's Image Processor (File > Scripts > Image Processor) and placed in a `JPEG/` subdirectory alongside the originals:

```
/John Smith/photo-01.tif
/John Smith/JPEG/photo-01.jpg
```

The app serves `JPEG/[filename].jpg` as the preview for any TIF file. The directory scanner ignores `JPEG/` subdirectories so preview proxies are never treated as archive items.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | Electron |
| UI | React |
| Database | SQLite via `better-sqlite3` |
| Packaging | `electron-builder` (Mac + Windows) |
| PDF preview | PDF.js |
| Image/video preview | Native HTML5 `<img>` / `<video>` |

---

## Directory Structure

```
ExFAT Drive Root/
├── _Folio/                     ← This repo (local clone: "folio")
│   ├── folio.db                ← gitignored; personal data, never committed
│   ├── _Folio.app              ← gitignored; Mac build
│   ├── _Folio.exe              ← gitignored; Windows build
│   └── _src/                   ← all source code (tracked by git)
│       ├── main/               ← Electron main process (Node.js, SQLite, IPC)
│       │   └── index.js
│       ├── renderer/           ← React UI
│       │   ├── components/
│       │   └── App.jsx
│       ├── schema.sql          ← DB schema; initializes folio.db on first launch
│       └── package.json
├── A Media Directory/
│   ├── Some Sub-Directory/
│   │   ├── JPEG/               ← JPG preview proxies (excluded from scanner)
│   │   ├── photo.tif
│   │   ├── video.mov
│   │   └── document.pdf
│   └── ...
└── ...
```

---

## Database Schema (Overview)

Three tables:

- **`family_members`** — stores each person with a short code (e.g. `JAS`), name fields, birth/death dates, notes, and self-referential parent IDs for family tree traversal.
- **`entries`** — one row per file: path, title, description, date, location, tags, and arrangement indicator.
- **`entry_members`** — junction table linking entries to family members, with a `position` field preserving left-to-right (or clockwise, etc.) order.

`schema.sql` in `_src/` is the version-controlled definition of this structure. The app reads it on first launch to initialize a fresh `folio.db` if none is found.

---

## What Is and Is Not in This Repository

| In repo | Not in repo |
|---|---|
| All source code under `_src/` | `folio.db` — contains personal data; distributed manually |
| `schema.sql` | `_Folio.app` / `_Folio.exe` — build artifacts |
| Documentation and session notes | `node_modules/`, `dist/` |

---

## Distribution

Family members receive a copy of the drive with `_src/` removed. Their copy contains only the built executables and a pre-populated `folio.db` copied manually from the master. Once distributed, each database is independent — there is no sync mechanism and they will diverge over time as each person adds their own notes and metadata.

---

## Project Status

Pre-development. Stack and architecture are defined; the admin MVP (directory browser, file detail editor, family member tagging) is the first phase. A public-facing viewer for browsing the collection is planned as a later phase.
