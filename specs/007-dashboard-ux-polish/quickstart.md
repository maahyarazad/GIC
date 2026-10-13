# Quickstart / Validation: Dashboard UX Polish

Presentational feature — validation is typecheck, build, and a manual hover/visual pass. No new tests.

## Prerequisites

- `cd ui`
- Dashboard reachable at `/dashboard` (member or admin session).

## Build / typecheck gates

```bash
cd ui
npx tsc --noEmit -p .          # expect only the pre-existing @/EnvContext.jsx baseline noise
npm run build:client           # must succeed
```

Reminder: there is no sass build step wired in — every `Dashboard.scss` edit must be hand-mirrored
into `Dashboard.css` (and `.css.map` left as best-effort).

## Manual checklist

### Cursors (FR-001 / SC-001)
- [ ] Buttons, links, tabs, sidebar items → pointer on hover.
- [ ] Datagrid sortable column headers → pointer; non-sortable → default.
- [ ] Pagination prev/next and page-size select → pointer; disabled prev/next → not-allowed.
- [ ] Checkboxes/radios and their labels (e.g. newsletter toggle, sector wizard) → pointer.
- [ ] `onClick` rows/cells (e.g. Profile "view logs" cell) → pointer.
- [ ] Plain text / headings / disabled inputs → NOT pointer.

### Action icons (FR-002 / FR-003 / SC-002)
- [ ] Every datagrid action column shows icon buttons: edit (pencil), delete (trash), view (eye).
- [ ] No text-only "Edit"/"Delete" buttons remain in dashboard grids.
- [ ] Create actions on section/grid headers show a plus icon.
- [ ] Each icon button has `aria-label`/`title` (hover tooltip + screen-reader text).

### Radius (FR-004 / SC-003)
- [ ] Every dashboard button renders with a 10px corner (primary, ghost, delete, icon, Bootstrap `.btn`).
- [ ] Public pages (Home, Register, Contact) button radius unchanged.

## Regression spots
- Create Tender modal (uses `dashboard-btn` via `ModalDialog`) — buttons rounded, cursors fine.
- Confirm dialogs (`.confirm-dialog`) render outside `.dashboard`; if their buttons must match,
  confirm they already use `.dashboard-btn*` (inherit 10px only if the rule also covers those
  contexts — see plan note).
