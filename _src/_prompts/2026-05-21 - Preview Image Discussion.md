# Preview Image Discussion

## The Question

All archive files on the drive are TIF files. To support previewing in the Electron app (and to avoid loading huge TIF files), JPG copies of each image need to be generated in advance. The question is where to place those JPG copies.

**Option A — Subdirectory per person folder:**
```
/John Smith/
/John Smith/preview/photo-01.jpg
/John Smith/preview/photo-02.jpg
/John Smith/photo-01.tif
/John Smith/photo-02.tif
```

**Option B — Same directory as originals:**
```
/John Smith/photo-01.jpg
/John Smith/photo-01.tif
/John Smith/photo-02.jpg
/John Smith/photo-02.tif
```

---

## Recommendation: Option A — `preview/` Subdirectory

### The decisive factor: the file scanner

The Electron app walks directories and builds database entries from what it finds. If JPGs and TIFs live side by side, the scanner has to solve an ambiguity: is this JPG a standalone archive item (a legitimate original), or is it a preview proxy for the TIF next to it? That requires heuristics that can break.

With a `preview/` subdirectory, the rule is simple and unambiguous:

> **Index everything in the main folders. Ignore `preview/` subdirectories.**

Preview lookup becomes a one-liner — swap the parent folder for `parent/preview/`, swap the extension. No guessing.

### On the Photoshop workflow

Photoshop's **Image Processor** (File > Scripts > Image Processor) handles this natively. With "Save in Same Location" checked and "Include All Subfolders" enabled, it creates a `JPEG` subdirectory alongside the source files in each person folder — preserving the directory structure automatically, with no extra scripting required:

```
/John Smith/photo-01.tif  →  /John Smith/JPEG/photo-01.jpg
/Jane Doe/photo-01.tif    →  /Jane Doe/JPEG/photo-01.jpg
```

### On the subdirectory name

The name of the subdirectory is an arbitrary convention — `preview`, `JPEG`, or anything else works equally well. What matters is that the name is consistent and the app knows to look there. Since Image Processor defaults to `JPEG` with no extra configuration, that is the working convention for this project.

### A third option considered and set aside

A single `/_previews/` folder at the drive root mirroring the directory structure (e.g. `/_previews/John Smith/photo-01.jpg`) offers even cleaner separation. However, it makes the app's preview lookup dependent on knowing the drive root path rather than just the file's own parent — slightly more brittle if the drive is ever reorganized.

---

## Summary

| | Option A (`preview/` subdir) | Option B (flat, same dir) |
|---|---|---|
| Scanner logic | Simple — skip `preview/` dirs | Complex — must distinguish originals from proxies |
| Preview lookup | Deterministic one-liner | Requires heuristics |
| Photoshop batch | Native — Image Processor handles it automatically | Easiest out of the box |
| Organization | Clean separation | Originals and proxies mixed |

**Decision: a named subdirectory per person folder, using `JPEG/` as the working convention.**

The subdirectory approach requires no extra Photoshop setup — Image Processor produces this structure automatically. The flat approach introduces ongoing scanner complexity with no benefit. The tradeoff clearly favors Option A.
