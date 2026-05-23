# Directory Structure

This document proposes a directory structure for the Folio project.

## Proposed Structure

```
ExFAT Drive Root/
├── .archive/
├── _Folio/                              ← Git repository (GitHub: "folio")
│   ├── .gitignore
│   ├── folio.db                         ← gitignored; personal data, never in repo
│   ├── _Folio.app                       ← gitignored; Mac build output
│   ├── _Folio.exe                       ← gitignored; Windows build output
│   └── _src/                            ← all source code (tracked by git)
│       ├── _documentation/              ← maintained information regarding app functionality and build
│       ├── _prompts/                    ← author generated prompts for AI collaboration
│       ├── _sessions/                   ← summaries of AI collaboration sessions
│       ├── _tools/                      ← standalone utility scripts (not part of the app)
│       │   └── audit-filenames.js       ← pre-launch filename audit; writes filename-audit.csv
│       ├── dist/                        ← gitignored; electron-builder output
│       ├── node_modules/                ← gitignored; installed npm packages
│       ├── main/
│       │   └── index.js                 ← Electron main process (Node.js, SQLite, IPC)
│       ├── renderer/
│       │   ├── components/              ← React UI components
│       │   └── App.jsx
│       ├── img/                         ← app UI assets (icons, etc.)
│       ├── scss/
│       ├── schema.sql                   ← DB schema; used to initialize folio.db on first launch
│       └── package.json
├── _folio-exclude.txt                   ← lists paths excluded from the app and audit script
├── A Media Directory/
│   ├── Media Sub-Directory/
│   │   ├── JPEG/
│   │   │   ├── Preview Image 1.jpg
│   │   │   ├── Preview Image 2.jpg
│   │   │   ├── Preview Image 3.jpg
│   │   │   └── Preview Image 4.jpg
│   │   ├── Original Image 1.tif
│   │   ├── Original Image 2.tif
│   │   ├── Original Image 3.tif
│   │   ├── Original Image 4.tif
│   │   ├── Audio File.aif
│   │   ├── Movie File.mov
│   │   ├── PDF Document.pdf
│   │   ├── Rich Document.docx
│   │   ├── Spreadsheet.xlsx
│   │   └── Text Document.txt
│   ├── Media Sub-Directory/
│   └── etc.
├── Another Media Directory/
│   ├── Media Sub-Directory/
│   └── etc.
├── The Last Media Directory/
│   ├── Media Sub-Directory/
│   └── etc.
└── etc.
```

## Notes

### Single Underscore Prefix Convention
All app-related items use a single `_` prefix. This keeps them sorted above the media directories in any file browser and provides a consistent visual grouping. No double underscores.

### `_Folio/` — The Git Repository
`_Folio/` is both the app directory on the drive and the local clone of the GitHub repository (`folio`). Git does not require the local directory name to match the repository name — the remote URL is tracked in `.git/config` regardless of what the folder is called locally.

### `.gitignore`
The following are excluded from the repository:

```
folio.db
_Folio.app
_Folio.exe
_src/node_modules/
_src/dist/
```

### `folio.db` — Privacy and Git
The database contains full names, birth and death dates, family relationships, and photo metadata. It must never be committed to the repository. It is distributed manually — copied drive-to-drive — not through GitHub.

`schema.sql` lives in the repository instead. It defines the database structure and is used by the app to initialize a fresh `folio.db` on first launch (i.e., when no database file is found).

### Directory Traversal Exclusion
The app's directory browser skips `_Folio/` and `.archive/` when building the folder tree. This keeps app internals out of the UI. The exclusion rule is simple: skip any root-level entry beginning with `_` or `.`.

### Electron Source Structure
`_src/main/` contains the Electron main process — Node.js code responsible for filesystem access, SQLite queries, and IPC communication with the UI. `_src/renderer/` contains the React app. These are kept separate because they run in different contexts (Node.js vs. browser sandbox).

### Distribution Copies
Family members receive a copy of the drive with `_src/` removed from `_Folio/`. Their copy contains only the built apps and the pre-populated database:

```
_Folio/
├── folio.db        ← copied from master
├── _Folio.app
└── _Folio.exe
```
