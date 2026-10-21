# Implementation Plan: Dashboard Data Grid Fixed Height

**Branch**: `017-dashboard-datagrid-height` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/017-dashboard-datagrid-height/spec.md`

## Summary

Give every dashboard data grid a fixed height equal to the screen below the 70px navbar, minus whatever sits above the grid in its section. Rows scroll inside the grid under a sticky header, and the paging bar is always visible. This is done with a CSS flex chain instead of per-section `calc()` values (research #1). The 9 grid sections opt in with a `dash-section--grid` class. `.main-content` (or the slide-out panel content) becomes a fixed-height flex column, and the section and `GenericDataGrid` fill the space left over. `GenericDataGrid` gets an inner `.table-scroll` wrapper so the rows scroll while the paging bar stays put. Phone widths (≤ 600px, card layout) keep today's behavior.

## Technical Context

**Language/Version**: TypeScript + React 19 (`ui/`), SCSS with hand-maintained compiled `.css` files next to each source

**Primary Dependencies**: The existing `GenericDataGrid`, the dashboard layout (`Dashboard.tsx` / `Dashboard.scss`), `SlideMenu`, and Bootstrap's global `box-sizing: border-box`. No new packages.

**Storage**: N/A

**Testing**: Manual browser checks at fixed window sizes per [quickstart.md](quickstart.md). There is no UI test runner.

**Target Platform**: Modern evergreen browsers (CSS `:has()`, `dvh` and `position: sticky` are all needed and supported)

**Project Type**: Web application (frontend only)

**Performance Goals**: CSS only. No JS measuring and no extra re-renders.

**Constraints**: Sections without a grid must not change. The `GenericDataGrid` props don't change. Every `.scss` edit is mirrored in its `.css` file (research #7).

**Scale/Scope**: 1 component markup change (`GenericDataGrid.tsx`), 3 stylesheet pairs (`GenericDataGrid`, `Dashboard`, `SlideMenu`), and a one-word class addition in 9 section components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is the unfilled template, so there are no project gates. Self-gates:
- No behavior change outside the 9 opted-in sections: **Pass**. The rules are scoped by `dash-section--grid`, and the new `.table-scroll` wrapper is height-neutral elsewhere.
- No API or prop change to the shared grid: **Pass**.
- No new dependencies: **Pass**.

Post-design re-check: **Pass**, unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/017-dashboard-datagrid-height/
├── spec.md
├── plan.md                         # this file
├── research.md                     # Phase 0
├── data-model.md                   # Phase 1: layout chain + opted-in sections
├── quickstart.md                   # Phase 1: browser validation
├── contracts/dashboard-grid-layout.md
├── checklists/requirements.md
└── tasks.md                        # Phase 2 (/speckit-tasks)
```

### Source Code

```text
ui/src/
├── Components/GenericDataGrid/
│   ├── GenericDataGrid.tsx         # wrap <table> in <div className="table-scroll">
│   ├── GenericDataGrid.scss/.css   # .table-scroll, sticky th, .dash-section--grid .table-wrapper fill
├── Pages/Dashboard/
│   └── Dashboard.scss/.css         # .main-content:has(> .dash-section--grid), .dash-section--grid flex column
├── Components/Generic/SlideMenu/
│   └── SlideMenu.scss/.css         # .slide-menu__content:has(> .dash-section--grid)
└── Components/Dashboard/
    ├── ContactUsRequests/ContactUsRequests.tsx  ┐
    ├── User/Profile.tsx                          │
    ├── Blog/Blog.tsx                             │
    ├── Newsletter/Newsletter.tsx                 │  root div: "dash-section"
    ├── NewsletterSubscribers/NewsletterSubscribers.tsx │  → "dash-section dash-section--grid"
    ├── FileManagement/FileManagement.tsx         │
    ├── EmailTemplate/EmailTemplate.tsx           │
    ├── EmailLogs/EmailLogs.tsx                   │
    └── Continent/Continent.tsx                   ┘
```

**Structure Decision**: Frontend only. The shared styles live with the shared components, following the existing "Shared Dashboard Section Styles" block in `Dashboard.scss`.

## Implementation Notes

1. **GenericDataGrid** ([contract](contracts/dashboard-grid-layout.md)): move `overflow-x: auto` / `-webkit-overflow-scrolling` from `.table-wrapper` to `.table-scroll`. Add `thead th { position: sticky; top: 0; z-index: 1 }`; the th already has an opaque `var(--bgp2)` background. The card layout at ≤ 600px hides `thead`, so the sticky rule has no effect there.
2. **Fill rules**, all inside `@media (min-width: 601px)`:
   - `.main-content:has(> .dash-section--grid)`: `height: calc(100dvh - 70px); display: flex; flex-direction: column;` (`overflow-y: auto` is kept).
   - `.slide-menu__content:has(> .dash-section--grid)`: `display: flex; flex-direction: column;`
   - `.dash-section--grid`: `flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column;`
   - `.dash-section--grid > .table-wrapper`: `flex: 1 1 auto; min-height: 20rem; display: flex; flex-direction: column;`
   - `.dash-section--grid > .table-wrapper > .table-scroll`: `flex: 1 1 auto; min-height: 0; overflow: auto;`
   - `.dash-section--grid > .table-wrapper > .grid-pagination`: `flex: none;`
   - `.dash-section--grid > .application-loader, .dash-section--grid > .dash-empty`: `flex: 1 1 auto;` (keeps the height while loading or empty). First check how `Loader` renders its root (`.application-loader`) and centre it.
3. **Sections**: add `dash-section--grid` to the root `div.dash-section` in the 9 files. Make sure the grid, the loader and the empty state are direct children of that root. Today they all are; Continent's `DataPackageDialog` is a modal and can stay.
4. **Mirror each `.scss` edit into its `.css`** by hand, in the same format as the existing compiled output.
5. **Order**: GenericDataGrid markup and styles → Dashboard and SlideMenu fill rules → opt in one section (Member Requests) and check it → the other 8 → full quickstart.

## Complexity Tracking

No violations to justify.
