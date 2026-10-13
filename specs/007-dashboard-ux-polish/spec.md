# Feature Specification: Dashboard UX Polish (cursors, action icons, button radius)

**Feature Branch**: `006-industry-sector-tenders` (polish delivered on the active branch; no backend change)
**Created**: 2026-10-13
**Status**: Planned
**Scope**: UI only — the authenticated dashboard (`/dashboard`), never the public site.

> Note: this spec was authored to anchor `/speckit-plan`. It is intentionally lightweight — the
> work is presentational (CSS + icon components), with no data model or API surface.

## User Scenarios & Testing

### User Story 1 — Clickable things look clickable (Priority: P1)

As a dashboard user, every element that does something when I click it shows the pointer
cursor on hover, so I can tell what is interactive.

**Acceptance**:
- Hovering any button, link, `role="button"`, sortable column header, pagination control,
  tab/sidebar item, toggle, or `onClick` row/cell in the dashboard shows `cursor: pointer`.
- Disabled controls show `not-allowed` (unchanged), and plain text/labels keep the default cursor.

### User Story 2 — Icon actions in datagrids (Priority: P1)

As a dashboard user, the datagrid row actions are consistent Font Awesome icon buttons —
**edit**, **delete**, **create**, and **view** (an eye) — instead of ad‑hoc text labels.

**Acceptance**:
- Each datagrid action column renders icon buttons: edit (pencil), delete (trash),
  view (eye); "create" (plus) appears on the grid/section header where a create action exists.
- Every icon button has an accessible label (`aria-label`/`title`) and the pointer cursor.

### User Story 3 — Unified button radius (Priority: P2)

As a dashboard user, all buttons in the dashboard share one rounded corner radius (**10px**).

**Acceptance**:
- Every `<button>` / button-styled element inside `.dashboard` has `border-radius: 10px`.
- The public site's buttons are unchanged.

## Requirements (Functional)

- **FR-001**: All interactive elements within the dashboard MUST present `cursor: pointer` on hover.
- **FR-002**: Datagrid row actions MUST use Font Awesome icons — edit, delete, view (eye) — with accessible labels.
- **FR-003**: "Create" actions MUST use a Font Awesome plus icon (icon + visible text is acceptable on section headers).
- **FR-004**: All dashboard buttons MUST have `border-radius: 10px`.
- **FR-005**: No change may affect the public (non-dashboard) pages.

## Success Criteria

- **SC-001**: 100% of dashboard interactive elements show the pointer cursor (manual hover audit).
- **SC-002**: Every datagrid action column uses the icon set above; no text-only "Edit/Delete" buttons remain in the dashboard.
- **SC-003**: Every dashboard button renders at 10px radius; public pages render unchanged.

## Assumptions

- Font Awesome is provided via the already-installed `react-icons/fa6` package (no new dependency).
- "Dashboard" = everything rendered under the `.dashboard` container (and its detached dialogs).
