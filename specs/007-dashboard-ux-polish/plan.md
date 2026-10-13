# Implementation Plan: Dashboard UX Polish (cursors, action icons, button radius)

**Branch**: `006-industry-sector-tenders` (active) | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-dashboard-ux-polish/spec.md`

## Summary

Three presentational changes, scoped strictly to the authenticated dashboard (`.dashboard`):

1. **Cursor** — guarantee `cursor: pointer` on every interactive element in the dashboard.
2. **Action icons** — replace text/ad‑hoc datagrid actions with Font Awesome icon buttons
   (edit = pencil, delete = trash, view = eye, create = plus) via `react-icons/fa6`.
3. **Radius** — set `border-radius: 10px` on all dashboard buttons (supersedes the 8px rule
   added in the previous change).

No backend, data model, or API work. CSS lives in `Dashboard.scss` (+ mirrored `Dashboard.css`);
icon changes touch each datagrid's action column and a small shared helper.

## Technical Context

**Language/Version**: TypeScript 5 / React 19 (Vite SPA in `ui/`)
**Primary Dependencies**: `react-icons` ^5.5.0 (Font Awesome 6 set at `react-icons/fa6`); existing `GenericDataGrid`
**Storage**: N/A
**Testing**: No runner in repo — validate via `cd ui && npx tsc --noEmit -p .` and `npm run build:client`, plus manual hover/visual QA
**Target Platform**: Modern browsers (desktop + mobile widths)
**Project Type**: Web application (frontend-only change)
**Performance Goals**: N/A (CSS + static icon components; no runtime cost of note)
**Constraints**: Must not alter the public site; SCSS edits hand-mirrored to compiled `.css` (no sass build step wired into the app)
**Scale/Scope**: ~10 dashboard datagrids/sections; one dashboard-scoped CSS block; one shared action-button helper

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is the unfilled template — no concrete
principles or gates are defined. No violations. **PASS** (nothing to enforce).

## Project Structure

### Documentation (this feature)

```text
specs/007-dashboard-ux-polish/
├── plan.md        # This file
├── spec.md        # Lightweight anchor spec
├── research.md    # Phase 0 decisions
└── quickstart.md  # Phase 1 validation guide
# data-model.md and contracts/ intentionally omitted — no entities, no external interface.
```

### Source Code (repository root)

```text
ui/src/
├── Pages/Dashboard/
│   ├── Dashboard.scss          # dashboard-scoped cursor + 10px radius rules (edit)
│   └── Dashboard.css           # hand-mirrored compiled output (edit)
├── Components/
│   ├── GenericDataGrid/
│   │   └── GenericDataGrid.(tsx|scss|css)   # verify sort header / pagination cursors
│   ├── Generic/GridActions/    # NEW: shared edit/delete/view/create icon-button helper
│   │   └── GridActions.tsx
│   └── Dashboard/
│       ├── Continent/Continent.tsx          # action column → GridActions
│       ├── EmailTemplate/EmailTemplate.tsx  # action column → GridActions
│       ├── Blog/Blog.tsx                     # action buttons → icons
│       ├── Newsletter/Newsletter.tsx         # action buttons → icons
│       ├── ManageEvents/EventsTable.tsx      # action column → GridActions
│       ├── ManageEvents/AttendeesTable.tsx   # action column → icons (if any)
│       ├── ContactUsRequests/ContactUsRequests.tsx
│       ├── NewsletterSubscribers/NewsletterSubscribers.tsx
│       └── FileManagement/FileManagement.tsx
```

**Structure Decision**: Frontend-only. A single dashboard-scoped CSS block covers cursor + radius
globally; a new shared `GridActions` component centralizes the icon buttons so every datagrid's
action column is consistent and future grids reuse it instead of re-inventing text buttons.

## Phase 0 — Research (see research.md)

Key decisions resolved:
- **Icon library**: reuse installed `react-icons/fa6` (`FaPen`, `FaTrash`, `FaEye`, `FaPlus`) — no new dependency.
- **Cursor strategy**: CSS can cover semantic elements (`button`, `a`, `[role=button]`, `select`,
  `summary`, `[role=tab]`, `label[for]`); `onClick` on non-semantic `div`/`span`/`tr`/`td` cannot be
  targeted by a selector, so those get a small utility class `.dashboard .is-clickable { cursor: pointer }`
  applied where such handlers exist (audited per component). Disabled → `not-allowed` preserved.
- **Radius**: one rule `.dashboard button, .dashboard .btn, .dashboard .dashboard-btn, .dashboard .btn-primary-contrast, .dashboard .btn-primary-contrast-inverse { border-radius: 10px }`
  replaces the earlier 8px block. Icon-only square buttons keep square dimensions but gain the 10px corner.

## Phase 1 — Design & Contracts

- **data-model.md**: omitted — no entities.
- **contracts/**: omitted — no new API or external interface (all existing endpoints unchanged).
- **quickstart.md**: validation/QA steps (typecheck, build, and a hover/visual checklist per grid).

### Shared component contract (internal UI)

`GridActions` (new, `ui/src/Components/Generic/GridActions/GridActions.tsx`):

```ts
interface GridAction {
  onEdit?: () => void;    // FaPen,   aria-label "Edit"
  onDelete?: () => void;  // FaTrash, aria-label "Delete"
  onView?: () => void;    // FaEye,   aria-label "View"
}
```
Renders only the handlers provided, each an icon `<button>` using the dashboard button classes
(`dashboard-btn--icon` / `dashboard-btn--icon-danger`) so radius, focus ring, and cursor come for free.
"Create" is a section-header action (`FaPlus` + label), not part of the row helper.

## Rollout / Sequencing

1. CSS: dashboard-scoped cursor rules + 10px radius (replace 8px) in `Dashboard.scss` + `Dashboard.css`.
2. Add `GridActions` helper.
3. Migrate each datagrid action column to icons (`GridActions` or inline `react-icons/fa6`).
4. Add `FaPlus` to the create buttons on grid/section headers.
5. Per-component cursor audit for `onClick` on non-semantic elements → add `.is-clickable`.
6. Validate: `cd ui && npx tsc --noEmit -p .`, `npm run build:client`, manual hover/visual pass.

## Complexity Tracking

No constitution violations — table not required.
