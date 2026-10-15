# Research: Recommendation Letters — editor layout & live preview

## R1 — Live preview rendering

- **Decision**: Render the real generated PDF in an in-page `<iframe>`, refreshed on field
  focus-out, via the existing `fetchLetterPdf(id, fields, "inline")` endpoint.
- **Rationale**: User explicitly chose "Live PDF in iframe" over a client-side HTML mock.
  Pixel-accurate to the sent letter; reuses the exact server-side layout; no duplicated rendering
  logic in the UI.
- **Mechanics**: On each field `onBlur`, validate with the existing `previewSchema` (the lenient
  rules that already back the "View"/"Download" buttons). On success, POST current Formik values to
  `/admin/letter-requests/{id}/letter/pdf?disposition=inline`, create a blob URL, set it as the
  iframe `src`, and revoke the previous URL. Debounce (~400 ms) and skip the fetch when values are
  unchanged since the last successful render.
- **Invalid-draft handling**: If `previewSchema` fails, show a short "Fill the required fields to
  preview" message in the pane and keep the last good preview or a placeholder. No new tab, no popup.
- **Alternatives considered**: Client-side HTML approximation — rejected by the user (not faithful
  to the real PDF). Refresh on every keystroke — rejected (one backend call per character).

## R2 — Requests modal + search

- **Decision**: Reuse the shared `ModalDialog` (`@/Components/Generic/Dialog/Dialog`), passing a
  search input + `LetterRequestList` as `content` and `onCancel` as the close handler; no confirm
  footer. Open it from a "Requests" button in the section header.
- **Rationale**: Matches the project's existing modal pattern (same `dashboard-modal` shell used by
  Tenders/Events), so styling, backdrop, and close affordance come for free. Consistent with the
  dashboard's other modals.
- **Search**: Client-side filter over the already-fetched `items` array; case-insensitive substring
  on `reference`, `requester.name`, `requester.email`, `requester.company`. No API change — the list
  is already loaded in full by `listLetterRequests()`.
- **Selection/guard**: `onSelect` runs the existing unsaved-changes `confirm()` (in `select()`),
  then loads the detail and closes the modal. "Send" from a row keeps working inside the modal.
- **Alternatives considered**: Keep the docked list column — rejected by the request. A new
  server-side search endpoint — unnecessary; the dataset is small and already client-side.

## R3 — Actions bar at top

- **Decision**: Move the `rl-editor__actions` block above the field groups in `LetterEditor`'s
  rendered form; adjust CSS (remove top border/margin, add spacing below).
- **Rationale**: Keeps Save / View / Download in view without scrolling the long form. Pure
  reordering — no handler or state change.

## R4 — Stylesheet mirroring

- **Decision**: Edit `RecommendationLetters.scss` and hand-mirror into `RecommendationLetters.css`.
- **Rationale**: No sass build step is wired into the app; the committed `.css` carries autoprefixer
  output a plain `npx sass` recompile would strip. Hand-mirror targeted edits only.
- **Layout change**: `.rl-grid` becomes editor-left / preview-right at `min-width: 992px`
  (e.g. `minmax(0, 7fr) minmax(0, 5fr)` or similar); single column below. Add `.rl-preview`
  (sticky iframe pane) and `.rl-preview__frame` styles; keep `.rl-list`/`.rl-row` for the modal.
