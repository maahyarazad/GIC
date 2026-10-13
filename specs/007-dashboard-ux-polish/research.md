# Phase 0 Research: Dashboard UX Polish

The feature is presentational; the only open questions were "what icon source" and "how to
guarantee cursors without touching the public site." Both are resolved below. No NEEDS CLARIFICATION remain.

## Decision 1 — Font Awesome via `react-icons/fa6`

- **Decision**: Use the already-installed `react-icons` (^5.5.0), importing Font Awesome 6 glyphs from
  `react-icons/fa6`: `FaPen` (edit), `FaTrash` (delete), `FaEye` (view), `FaPlus` (create).
- **Rationale**: No new dependency; tree-shaken per-icon imports; the repo already uses `react-icons`
  and `lucide-react` elsewhere, so this matches existing conventions. The user explicitly asked for
  Font Awesome and an eye for view.
- **Alternatives considered**:
  - `@fortawesome/react-fontawesome` + icon packs — rejected: new dependencies and heavier setup for
    the same glyphs already reachable through `react-icons`.
  - `lucide-react` (also installed) — rejected: user specifically requested Font Awesome.

## Decision 2 — Cursor coverage strategy

- **Decision**: A dashboard-scoped CSS block sets `cursor: pointer` on interactive **semantic**
  selectors (`button`, `a[href]`, `[role="button"]`, `[role="tab"]`, `summary`, `select`,
  `input[type=checkbox]`, `input[type=radio]`, `label` with a control). For non-semantic clickables
  (`div`/`span`/`tr`/`td` with `onClick`), add a `.is-clickable` utility (`.dashboard .is-clickable { cursor: pointer }`)
  applied per component found in the audit. Disabled controls keep `cursor: not-allowed`.
- **Rationale**: CSS cannot select "has an onClick handler," so semantic elements are handled wholesale
  while the handful of `onClick` divs/rows are tagged explicitly. Scoping every rule under `.dashboard`
  guarantees the public site is untouched (FR-005).
- **Alternatives considered**:
  - Global `* { cursor: pointer }` — rejected: wrong on text/inputs and leaks to the public site.
  - A runtime effect that scans for `onclick` and sets cursors — rejected: fragile, unnecessary.

## Decision 3 — Unified 10px radius

- **Decision**: One dashboard-scoped rule sets `border-radius: 10px` on all button-styled elements
  (`button`, `.btn`, `.dashboard-btn`, `.btn-primary-contrast`, `.btn-primary-contrast-inverse`),
  replacing the 8px block added previously.
- **Rationale**: The user asked for 10px on all dashboard buttons. A single scoped block overrides the
  `button-style` mixin's `border-radius: 0` and the `%dashboard-btn-base` 8px, without editing the
  global mixin (which the public site shares).
- **Alternatives considered**:
  - Editing `%dashboard-btn-base`/mixin to 10px — rejected: the mixin/base are global and feed public buttons.

## Decision 4 — Centralize row actions in a shared `GridActions`

- **Decision**: Add `ui/src/Components/Generic/GridActions/GridActions.tsx` exposing optional
  `onEdit`/`onDelete`/`onView`, each rendered as an icon button reusing `dashboard-btn--icon` /
  `dashboard-btn--icon-danger`. Datagrids call it from their action-column `renderCell`.
- **Rationale**: Each datagrid currently re-implements text buttons; a shared helper makes the icon set
  consistent, inherits the dashboard button styling (radius/cursor/focus) automatically, and gives future
  grids a drop-in. Create stays a section-header button (`FaPlus`), since it is not per-row.
- **Alternatives considered**:
  - Editing each grid inline without a helper — rejected: duplication and drift across ~10 grids.
