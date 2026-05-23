# Family Archive — Session Wrap-Up: Initial Project Discussion

**Date:** 2026-05-21

## What We Covered

This was the first planning session for the Family Archive project. The goal was to go from a rough idea to a defined starting point — no code written, just thinking.

We landed on **Electron + React + SQLite** as the stack, driven by the offline/self-contained requirement and the fact that the drive needs to work on both Mac and Windows.

The conversation surfaced a detail that turned out to be a significant design asset: every filename already encodes the date, a description, an arrangement indicator, and the family members present — in a consistent, parseable format. The app can use this to auto-populate metadata on file scan, meaning most files will arrive pre-tagged with little to no manual work.

We also revisited the prototype Robbie built years ago. The father/mother self-referential approach to family relationships is sound and worth keeping. The one thing worth fixing from the old design is replacing the comma-separated family member field with a proper junction table.

The session ended with the creation of **2026-05-21 - Initial Concept.md**, which captures the full tech stack, parsing logic, and database schema as a reference point for future sessions.

## Decisions Made

- Electron + React + SQLite is the confirmed stack
- Phase 1 is an admin-only interface (browse, find untagged files, add metadata)
- The public viewer is a later phase
- Filename auto-detection of family members is a planned feature
- Schema uses a junction table (`entry_members`) for the file ↔ family member relationship

## Where We Left Off

There are open questions documented at the end of the Initial Concept file that need to be answered before coding begins — particularly the full list of arrangement indicators used in existing filenames, which file types need preview support, and how to handle partial dates.
