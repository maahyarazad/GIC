# Quickstart / Validation: Recommendation Letters — editor layout & live preview

## Prerequisites

- Backend running (uses the existing `/admin/letter-requests` endpoints, incl. `…/letter/pdf`).
- UI dev server: `cd ui && npm run dev` (or validate the build with `npm run build:client`).
- Signed in as an admin with access to the Recommendation Letters section.

## Build / typecheck gate

```bash
cd ui && npx tsc --noEmit -p .      # expect only the known baseline noise
cd ui && npm run build:client        # must succeed
```

## Manual checklist

### US1 — Requests modal with search
- [ ] The page no longer shows a permanent Requests column.
- [ ] A "Requests" button in the section header opens a `dashboard-modal`.
- [ ] The modal lists all requests and has a search box.
- [ ] Typing filters live by reference, requester name, email, and company (case-insensitive).
- [ ] Selecting a row loads that letter into the editor and closes the modal.
- [ ] "Send" from a row still works from inside the modal.
- [ ] Switching requests with unsaved edits still prompts the discard confirm.

### US2 — Editor left, live PDF preview right
- [ ] The editor form is on the left; the right column shows a PDF preview.
- [ ] Editing a field and then clicking/tabbing away refreshes the preview to the real PDF.
- [ ] No refresh fires while a field is still focused (focus-out only; debounced).
- [ ] An incomplete draft shows a short "fill required fields" message in the pane — no popup, no crash.
- [ ] Below 992px the layout stacks to a single column.

### US3 — Actions at the top
- [ ] Save / View / Download PDF appear at the top of the editor.
- [ ] Save saves and shows the success toast; View opens the PDF in a new tab; Download downloads `<reference>.pdf`.
- [ ] Disabled/busy states ("Saving…", "Generating…") behave as before.

### Regression
- [ ] Public site (Home / Register / Contact) is visually unchanged.
- [ ] Other dashboard sections are unchanged.
- [ ] The `beforeunload` unsaved-changes warning still fires with a dirty editor.

## Notes

- No backend restart needed for this feature (UI-only).
- `.scss` and `.css` must be committed together.
