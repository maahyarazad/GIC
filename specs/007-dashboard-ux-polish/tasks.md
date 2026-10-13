---

description: "Task list for Dashboard UX Polish (cursors, action icons, button radius)"
---

# Tasks: Dashboard UX Polish (cursors, action icons, button radius)

**Input**: Design documents from `/specs/007-dashboard-ux-polish/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅ (no data-model.md / contracts — UI-only)

**Tests**: None requested — this is a presentational change. No test tasks are generated. Validation is
`tsc --noEmit`, `build:client`, and the manual checklist in `quickstart.md`.

**Organization**: Grouped by the three user stories so each can ship independently.

**Repo conventions** (from plan.md): React 19 + Vite SPA in `ui/`. Every `*.scss` edit MUST be
hand-mirrored into the matching compiled `*.css` (no sass build step wired into the app). Icons come
from the already-installed `react-icons/fa6`. All new CSS is scoped under `.dashboard` so the public
site is never affected.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = cursors, US2 = action icons, US3 = 10px radius

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the icon source; no project init needed (existing app).

- [X] T001 Verify `react-icons/fa6` resolves by adding a throwaway import (`FaPen, FaTrash, FaEye, FaPlus`) in `ui/src/Components/Dashboard/Tenders/TenderBoard.tsx`, run `cd ui && npx tsc --noEmit -p .`, then revert the throwaway import.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared icon-action component that US2 datagrids depend on.

**⚠️ CRITICAL**: T002 blocks all US2 grid-migration tasks.

- [X] T002 [US2] Create shared `GridActions` component at `ui/src/Components/Generic/GridActions/GridActions.tsx` — optional `onEdit`/`onDelete`/`onView` props, each rendered as an icon `<button>` using `react-icons/fa6` (`FaPen`/`FaTrash`/`FaEye`) and the existing `dashboard-btn--icon` / `dashboard-btn--icon-danger` classes, each with `title` + `aria-label` ("Edit"/"Delete"/"View"). Render only the handlers passed.

**Checkpoint**: `GridActions` exists and typechecks; grids can adopt it.

---

## Phase 3: User Story 1 — Clickable things look clickable (Priority: P1) 🎯 MVP

**Goal**: Every interactive element in the dashboard shows `cursor: pointer`.

**Independent Test**: Hover across the dashboard (buttons, links, tabs, sidebar, sortable headers,
pagination, checkboxes/radios and their labels, `onClick` rows) → pointer everywhere; disabled → `not-allowed`; plain text → default.

- [X] T003 [US1] Add a dashboard-scoped cursor block to `ui/src/Pages/Dashboard/Dashboard.scss`: `.dashboard button, .dashboard a[href], .dashboard [role="button"], .dashboard [role="tab"], .dashboard summary, .dashboard select, .dashboard input[type="checkbox"], .dashboard input[type="radio"], .dashboard label:has(> input[type="checkbox"]), .dashboard label:has(> input[type="radio"])` → `cursor: pointer`; and `.dashboard button:disabled, .dashboard [disabled]` → `cursor: not-allowed`. Also add a `.dashboard .is-clickable { cursor: pointer; }` utility.
- [X] T004 [US1] Hand-mirror the T003 block into the compiled `ui/src/Pages/Dashboard/Dashboard.css` (insert before the trailing `/*# sourceMappingURL */`).
- [X] T005 [P] [US1] Audit clickable non-semantic elements (`div`/`span`/`tr`/`td` with `onClick`) in `ui/src/Components/Dashboard/**` and `ui/src/Components/GenericDataGrid/GenericDataGrid.tsx`; add `className="is-clickable"` (or merge into existing className) to each. Known spot: `ui/src/Components/Dashboard/User/Profile.tsx` view-logs cell (already inline `cursor:pointer` — leave or switch to the utility for consistency).
- [X] T006 [P] [US1] Verify `ui/src/Components/GenericDataGrid/GenericDataGrid.(scss|css)` pagination buttons and page-size `select` carry pointer (they are `button`/`select`, covered by T003); confirm sortable headers keep their existing inline `cursor` logic and non-sortable stay default.

**Checkpoint**: Pointer audit from `quickstart.md` passes; US1 shippable on its own.

---

## Phase 4: User Story 2 — Icon actions in datagrids (Priority: P1)

**Goal**: Datagrid row actions are Font Awesome icon buttons (edit/delete/view-eye); create uses a plus icon.

**Independent Test**: Open each dashboard grid → row actions are pencil/trash/eye icon buttons with
tooltips; section "create/new" buttons show a plus; no text-only Edit/Delete remain.

**Depends on**: T002 (`GridActions`).

- [X] T007 [P] [US2] Migrate the Actions column in `ui/src/Components/Dashboard/Continent/Continent.tsx` (`renderCell`) to `GridActions` (edit + delete) — remove the text "Edit"/"Delete" buttons.
- [X] T008 [P] [US2] Migrate action buttons in `ui/src/Components/Dashboard/EmailTemplate/EmailTemplate.tsx` to `GridActions`/`react-icons/fa6` (edit + delete).
- [X] T009 [P] [US2] Replace the delete (and edit/view if present) text buttons in `ui/src/Components/Dashboard/Blog/Blog.tsx` with `react-icons/fa6` icon buttons.
- [X] T010 [P] [US2] Replace the delete (and edit/view if present) text buttons in `ui/src/Components/Dashboard/Newsletter/Newsletter.tsx` with icon buttons.
- [X] T011 [P] [US2] Add icon actions to `ui/src/Components/Dashboard/NewsletterSubscribers/NewsletterSubscribers.tsx` (view/delete as applicable).
- [X] T012 [P] [US2] Add icon actions to `ui/src/Components/Dashboard/ContactUsRequests/ContactUsRequests.tsx` — use the eye (`FaEye`) for the existing "view details" action; delete if present.
- [X] T013 [P] [US2] Replace action buttons in `ui/src/Components/Dashboard/FileManagement/FileManagement.tsx` with icon buttons (view/delete as applicable).
- [X] T014 [P] [US2] Add icon actions to `ui/src/Components/Dashboard/ManageEvents/EventsTable.tsx` (edit/delete/view) if the grid exposes row actions; otherwise record "no row actions" and skip.
- [X] T015 [P] [US2] Use `FaEye` for the view-logs action cell in `ui/src/Components/Dashboard/User/Profile.tsx`.
- [X] T016 [US2] Add a `FaPlus` icon to each section/grid "Create/New" header button (e.g. Blog, Newsletter, ManageEvents, EmailTemplate, Continent, `ui/src/Components/Dashboard/Tenders/TenderBoard.tsx`) — icon + existing visible label, keeping the current button classes.

**Checkpoint**: Every dashboard grid uses the icon set; no text-only Edit/Delete remain.

---

## Phase 5: User Story 3 — Unified 10px button radius (Priority: P2)

**Goal**: All dashboard buttons have `border-radius: 10px`.

**Independent Test**: Every dashboard button (primary, ghost, delete, icon, Bootstrap `.btn`) renders a
10px corner; public pages unchanged.

**Note**: T017/T018 edit the same files as T003/T004 (`Dashboard.scss`/`.css`) → run after US1's edits, not in parallel with them.

- [X] T017 [US3] In `ui/src/Pages/Dashboard/Dashboard.scss`, replace the existing 8px block with a 10px rule covering `.dashboard button, .dashboard .btn, .dashboard .dashboard-btn, .dashboard .btn-primary-contrast, .dashboard .btn-primary-contrast-inverse { border-radius: 10px; }`. (Decision pending from plan: optionally also include `.dashboard-modal`, `.confirm-dialog`, `.json-node-dialog` contexts so detached dialog buttons match.)
- [X] T018 [US3] Hand-mirror the T017 rule into `ui/src/Pages/Dashboard/Dashboard.css` (replace the current `border-radius: 8px` block).

**Checkpoint**: All dashboard buttons at 10px; public pages unaffected.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T019 Run `cd ui && npx tsc --noEmit -p .` — expect only the baseline `@/EnvContext.jsx` noise; fix any new errors introduced by US1–US3.
- [X] T020 Run `cd ui && npm run build:client` — must succeed.
- [X] T021 Walk the `quickstart.md` manual checklist (cursors, action icons, 10px radius) and confirm the public site (Home/Register/Contact) is visually unchanged.

---

## Dependencies & Execution Order

- **Setup (T001)**: no dependencies.
- **Foundational (T002)**: blocks all US2 tasks (T007–T016).
- **US1 (T003–T006)**: independent of US2/US3; T004 mirrors T003; T005/T006 are [P].
- **US2 (T007–T016)**: needs T002; T007–T015 are [P] (different files); T016 touches several header files.
- **US3 (T017–T018)**: edits the same `Dashboard.scss`/`.css` as US1 (T003/T004) → sequence after them.
- **Polish (T019–T021)**: after all desired stories.

## Parallel Opportunities

- US1: T005 and T006 in parallel.
- US2: T007–T015 in parallel (one file each) once T002 is done.

## Parallel Example: User Story 2

```bash
# After T002 (GridActions) lands, migrate grids in parallel:
Task: "Migrate Continent.tsx actions to GridActions"
Task: "Migrate EmailTemplate.tsx actions to GridActions"
Task: "Replace Blog.tsx action buttons with icons"
Task: "Replace Newsletter.tsx action buttons with icons"
```

## Implementation Strategy

### MVP (US1 — pointers everywhere)

1. T001 → T003/T004 → T005/T006 → validate hover. Shippable alone.

### Incremental

1. US1 (cursors) → demo.
2. US2 (icons): T002 then grids → demo.
3. US3 (10px radius) → demo.

## Notes

- `[P]` = different files, no dependencies.
- Reuse `dashboard-btn--icon` / `dashboard-btn--icon-danger` for icon buttons so radius/focus/cursor come for free.
- Commit after each phase or logical group; keep `.scss` and `.css` edits in the same commit.
