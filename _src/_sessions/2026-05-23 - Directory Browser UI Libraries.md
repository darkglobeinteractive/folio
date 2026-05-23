# Directory Browser UI Libraries

**Date:** 2026-05-23
**Context:** Pre-development. Discussing library options for the browsable directory view described in the README — a folder tree that walks the drive root, skipping `_` and `.` prefixed entries.

---

## Options Considered

### react-arborist
A purpose-built, virtualized tree component for React. Handles expand/collapse, keyboard navigation, and large trees well. Best choice if the folder tree could grow deep or wide.

Search: `react-arborist` on npm or GitHub (published by Brimdata).

### Custom Recursive Component
Given the constraints — skip `_`/`.` entries, no drag-and-drop required at this stage, relatively flat structure — a hand-rolled `<FolderTree>` component with `useState` for open/closed state is around 30–50 lines of React. Avoids a dependency and fits the scope of the problem at this phase.

### @radix-ui/react-collapsible
A headless, accessible primitive for expand/collapse behavior. A good middle path if going the custom route but wanting keyboard navigation and ARIA attributes handled automatically.

Search: `@radix-ui/react-collapsible` on npm, or the Radix UI primitives docs site.

---

## Recommendation

Start with a **custom recursive component**. The directory tree is simple enough that a library would be more abstraction than the problem warrants. If virtualization or more complex interaction becomes necessary later, migrating to `react-arborist` is straightforward.
