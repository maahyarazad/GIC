---

description: "Task list for Dashboard Data Grid Fixed Height"
---

# Tasks: Dashboard Data Grid Fixed Height

**Input**: Design documents from `/specs/017-dashboard-datagrid-height/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/dashboard-grid-layout.md, quickstart.md

**Tests**: Not requested; validation is manual in the browser per quickstart.md.

**Style rule for every task that touches styles**: each `.scss` change MUST also be made by hand in the matching compiled `.css` file next to it (same selectors, plain nested-out CSS, 2-space indent as in the existing `.css`). Do not touch `.css.map` files. `sass` is not installed in `ui/` (research #7).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Confirm branch is `017-dashboard-datagrid-height` and read `ui/src/Components/GenericDataGrid/GenericDataGrid.tsx` (the returned JSX: the `copy-toast`, `.table-wrapper > table.my-table`, `.grid-pagination`), `ui/src/Components/GenericDataGrid/GenericDataGrid.scss`, `ui/src/Pages/Dashboard/Dashboard.scss` (the "Shared Dashboard Section Styles" block and `.main-content`), `ui/src/Components/Generic/SlideMenu/SlideMenu.scss` (`.slide-menu`, `.slide-menu__content`) and `ui/src/Components/Loader/Loader.scss` (`.application-loader`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared grid gets an inner scroll area and a sticky header. This must be height-neutral for any section that hasn't opted in.

- [X] T002 In `ui/src/Components/GenericDataGrid/GenericDataGrid.tsx` wrap the `<table className="my-table">…</table>` in `<div className="table-scroll">…</div>`, inside `.table-wrapper` and before the `{/* Pagination Controls */}` `.grid-pagination` div. Leave the props, handlers and other markup unchanged.
- [X] T003 In `ui/src/Components/GenericDataGrid/GenericDataGrid.scss` and `GenericDataGrid.css`:
  - Remove `overflow-x: auto;` and `-webkit-overflow-scrolling: touch;` from `.table-wrapper`.
  - Add `.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }`, so wide tables still scroll sideways while the paging bar no longer scrolls with them.
  - In the `table th` rule add `position: sticky; top: 0; z-index: 1;`. The th already has the opaque `background: var(--bgp2)`. Check the existing `@media (max-width: 600px)` block still hides `thead` (no change needed there).
  - Check the selectors still match: `.table-wrapper table …` rules keep working because `table` is now nested one level deeper.

**Checkpoint**: Every grid section looks and behaves exactly as before (natural height); `npx vite build` succeeds.

---

## Phase 3: User Story 1 - The grid fills the screen and scrolls inside itself (Priority: P1) 🎯 MVP

**Goal**: The fill mechanism, opted in on Member Requests.

**Independent Test**: `specs/017-dashboard-datagrid-height/quickstart.md` steps 1 and 3, on Member Requests only.

- [X] T004 [US1] In `ui/src/Pages/Dashboard/Dashboard.scss` and `Dashboard.css`, after the `.main-content` rule, add a block inside `@media (min-width: 601px)`. Comment it as "Fixed-height data grid sections (spec 017); sections opt in with .dash-section--grid":
  - `.main-content:has(> .dash-section--grid) { height: calc(100dvh - 70px); display: flex; flex-direction: column; }`. Keep the existing `overflow-y: auto` from `.main-content`; 70px is the fixed navbar height already used by `.sidebar`.
  - `.dash-section--grid { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }`
  - `.dash-section--grid > .application-loader, .dash-section--grid > .dash-empty { flex: 1 1 auto; }`
- [X] T005 [US1] In `ui/src/Components/GenericDataGrid/GenericDataGrid.scss` and `GenericDataGrid.css`, add inside `@media (min-width: 601px)`:
  - `.dash-section--grid > .table-wrapper { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }`
  - `.dash-section--grid > .table-wrapper > .table-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; }`
  - `.dash-section--grid > .table-wrapper > .grid-pagination { flex: none; }`
- [X] T006 [US1] In `ui/src/Components/Dashboard/ContactUsRequests/ContactUsRequests.tsx` change the root `<div className="dash-section">` to `<div className="dash-section dash-section--grid">`.
- [ ] T007 [US1] Follow `specs/017-dashboard-datagrid-height/quickstart.md` steps 1 and 3 on Member Requests at 1920×1080 and 1366×768: the paging bar sits at the screen bottom, the rows scroll under a sticky header, the height stays the same with few rows, resizing follows, and nothing jumps while loading. Fix the rules from T004/T005 if any check fails.

**Checkpoint**: Member Requests works end to end; the other sections are unchanged.

---

## Phase 4: User Story 2 - Same behavior in every dashboard grid (Priority: P1)

**Goal**: All 9 sections opt in, including the slide-out panel.

**Independent Test**: `specs/017-dashboard-datagrid-height/quickstart.md` steps 1–3, for each section.

- [X] T008 [P] [US2] Add `dash-section--grid` to the root `div.dash-section` in `ui/src/Components/Dashboard/User/Profile.tsx`.
- [X] T009 [P] [US2] Add `dash-section--grid` to the root `div.dash-section` in `ui/src/Components/Dashboard/Blog/Blog.tsx`.
- [X] T010 [P] [US2] Add `dash-section--grid` to the root `div.dash-section` in `ui/src/Components/Dashboard/Newsletter/Newsletter.tsx`.
- [X] T011 [P] [US2] Add `dash-section--grid` to the root `div.dash-section` in `ui/src/Components/Dashboard/FileManagement/FileManagement.tsx`.
- [X] T012 [P] [US2] Add `dash-section--grid` to the root `div.dash-section` in `ui/src/Components/Dashboard/EmailTemplate/EmailTemplate.tsx`.
- [X] T013 [P] [US2] Add `dash-section--grid` to the root `div.dash-section` in `ui/src/Components/Dashboard/EmailLogs/EmailLogs.tsx`. The `.email-log-toolbar` stays a direct child with natural height.
- [X] T014 [P] [US2] Add `dash-section--grid` to the root `div.dash-section` in `ui/src/Components/Dashboard/Continent/Continent.tsx`. The `DataPackageDialog` after the grid is a modal and needs no change.
- [X] T015 [P] [US2] Add `dash-section--grid` to the root `div.dash-section` in `ui/src/Components/Dashboard/NewsletterSubscribers/NewsletterSubscribers.tsx`.
- [X] T016 [US2] In `ui/src/Components/Generic/SlideMenu/SlideMenu.scss` and `SlideMenu.css` add, inside `@media (min-width: 601px)`: `.slide-menu__content:has(> .dash-section--grid) { display: flex; flex-direction: column; }`. `.slide-menu__content` is already `flex: 1; overflow-y: auto` inside the `100vh` flex-column `.slide-menu`.
- [ ] T017 [US2] For each of the 9 sections, check that the grid (or the `Loader` / `.dash-empty` shown instead) is a direct child of the `dash-section--grid` root, as required by `specs/017-dashboard-datagrid-height/contracts/dashboard-grid-layout.md`. Then follow `specs/017-dashboard-datagrid-height/quickstart.md` steps 1–3 for every section, including wrapping the header and toolbar at about 700px wide and the Newsletter Subscribers panel.

**Checkpoint**: All 9 grids fill their space; non-grid sections are unchanged.

---

## Phase 5: User Story 3 - Usable on small screens (Priority: P2)

**Goal**: A minimum height on short windows, and today's card layout on phones.

**Independent Test**: `specs/017-dashboard-datagrid-height/quickstart.md` step 4.

- [X] T018 [US3] In `ui/src/Components/GenericDataGrid/GenericDataGrid.scss` and `GenericDataGrid.css`, inside the same `@media (min-width: 601px)` block from T005, change `.dash-section--grid > .table-wrapper` to `min-height: 20rem;` instead of `0`, so the header with filters, 4 rows and the paging bar always fit. When there isn't enough room, `.main-content` scrolls.
- [ ] T019 [US3] Follow `specs/017-dashboard-datagrid-height/quickstart.md` step 4 at 1366×600, 768×1024 and 375×667: at least 4 rows show; the ☰ button sits above the section on tablet with the grid filling the rest; phones show the cards as before. Adjust the 20rem value if 4 rows don't fit with the real row height.

**Checkpoint**: All stories pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 Run the UI build (`cd ui && npx vite build --outDir <scratchpad dir> --emptyOutDir`) and `npx tsc --noEmit -p .` in `ui/`. The type-check should show no new errors (65 errors already exist).
- [ ] T021 Run `specs/017-dashboard-datagrid-height/quickstart.md` step 5 (sorting, filters, paging, row actions, sideways scroll, light/dark themes with the sticky header opaque, and non-grid sections unchanged) as a final pass.

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T003)** → **US1 (T004–T007)** → **US2 (T008–T017)** and **US3 (T018–T019)** → **Polish (T020–T021)**.
- US2 depends on the US1 rules (T004, T005). US3 changes the T005 rule. US2 and US3 don't depend on each other.
- T003 and T005 both edit `GenericDataGrid.scss/.css`, and T018 edits the same block, so run them in order.

## Parallel Opportunities

- T008–T015 each edit a different section file and can all run together.
- T016 (SlideMenu styles) can run alongside T008–T015.
- T018 can run alongside US2, since its files don't overlap with T008–T016.

```text
After T007:
  Agent A: T008, T009, T010, T011 (one-word class edits)
  Agent B: T012, T013, T014, T015, then T016
  Agent C: T018
Then: T017, T019, T020, T021
```

## Implementation Strategy

1. **MVP = Phases 1–3**: the mechanism plus Member Requests. This proves the approach on one section.
2. **US2**: roll it out to the other 8 sections, which is mostly one-word class edits plus the panel rule.
3. **US3**: the minimum height, and a check that phones are unchanged.
4. **Polish**: build, type-check, and a regression pass across all sections.
