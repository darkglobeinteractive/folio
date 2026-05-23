# File Renaming Session — Photo Albums

## Goal

Standardize filenames across all scanned photo album directories so that every file follows a consistent, human-readable format with spaces separating each major segment:

```
{page-photo} - {date} - {description} - {people}
```

---

## Filename Patterns Encountered

### Pattern A — No-space segment separators
The most common original format. Segments were joined by bare hyphens with no spaces:

```
XX-XX-YYYY-description - people.tif
XX-XX-YYYY-MM-description - people.tif
XX-XX-YYYY-MM-DD-description - people.tif
XX-XX-description - people.tif        ← no date present
```

The `XX-XX` prefix is a two-digit page number and two-digit photo number. Dates appear in three levels of precision (year only, year-month, or full date). Some files have no date at all. Inner hyphens within the description (e.g. season names like `Summer-Description`, location codes like `MBI-Description`) were intentionally left as-is per the project convention.

**Transformation:** Added ` - ` between each major segment boundary.

**Directories:** 1972-1973 Red, 1973-1980s Green, 1974-1976 Yellow, 1976-1980 Red, 1980-1982 Red, 1985-1990 Grey Binder, Miscellaneous Photo Album.

---

### Pattern B — Three-digit page prefix
The Brown Binder used a three-digit page number instead of two:

```
XXX-XX-YYYY-description - people.tif
```

**Transformation:** Stripped the leading zero from the three-digit page number (e.g. `001` → `01`, `073` → `73`) to produce the standard `XX-XX` prefix, then applied the same spacing as Pattern A.

**Directory:** 1981-1985 Brown Binder.

---

### Pattern C — Date embedded within description
Several Bartko trip albums already had spaces around their segment separators, but the date appeared somewhere inside the description rather than immediately after the ordering number:

```
## - description - YYYY - remainder.tif
## - description - YYYY-MM - remainder.tif
## - description - YYYY-MM-DD - remainder.tif
## - description - YYYY.tiff              ← no remainder
```

**Transformation:** Extracted the date from within the description and moved it to immediately follow the ordering number, producing:

```
## - YYYY[-MM[-DD]] - description - remainder.tiff
```

Files with no embedded date were left unchanged.

**Directories:** 1983 Bartko California, 1984-1992 Bartko Vacations, 1985 Bartko New Mexico.

---

### Pattern D — Already correct
Some directories were already in the standardized format and required no changes.

**Directories:** 1989 Bartko California + Arizona, Bartko Photo Album C, Bartko Photo Album D.

---

## Directories Processed

| Directory | Pattern | Changes Made |
|---|---|---|
| 1972-1973 - Red Photo Album | A | 106 files |
| 1973-1980s - Green Photo Album | A | 23 files |
| 1974-1976 - Yellow Photo Album | A | 94 files |
| 1976-1980 - Red Photo Album | A | 94 files |
| 1980-1982 - Red Photo Album | A | 78 files |
| 1981-1985 - Brown Binder | B | 230 files |
| 1983 - Bartko - California | C | 12 files |
| 1984-1992 - Bartko Vacations | C | ~15 files |
| 1985 - Bartko - New Mexico | C | 6 files |
| 1989 - Bartko - California + Arizona | D | None |
| 1985-1990 - Grey Binder | A | ~190 files |
| Bartko Photo Album C | D | None |
| Bartko Photo Album D | D | None |
| Miscellaneous Photo Album | A | 8 files |
