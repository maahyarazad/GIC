---
description: "Task list for Recommendation Letters — editor layout & live preview"
---

# Tasks: Recommendation Letters — editor layout & live preview

**Input**: Design documents from `/specs/008-recommendation-letter-layout/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅ (no data-model.md / contracts — UI-only, no schema or API change)

**Tests**: None requested — no test runner in this repo. Validation = `cd ui && npx tsc --noEmit -p .`
(baseline noise only), `cd ui && npm run build:client`, and the manual checklist in `quickstart.md`.

**Repo conventions**: React 19 + Vite SPA in `ui/`. Every `*.scss` edit is hand-mirrored into the
matching compiled `*.css` (no sass build step; never regenerate with `npx sass` — it strips the
committed autoprefixer output). Reuse the shared `ModalDialog` and the existing `recommendationLetters`
API client; add no endpoint and no dependency. Keep the unsaved-changes guard, dirty tracking,
`submitRef` save-and-send, and all toasts intact.

> Note: feature 009 already edited `LetterEditor.tsx` (recipient fields). These layout tasks are
> independent of the field set; apply them on top of whatever version of the file is on the branch.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = requests modal + search, US2 = editor-left / live PDF preview, US3 = actions at top

---

## Phase 1: Setup

- [X] T001 Confirm the integration points before editing: `ModalDialog` props (`title`/`content`/`onCancel`, no confirm footer needed) in `ui/src/Components/Generic/Dialog/Dialog.tsx`; the `fetchLetterPdf(id, fields, "inline")` signature in `ui/src/api/recommendationLetters.ts`; and the current structure of `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.tsx` (`.rl-grid` two-card layout, `select()` unsaved-changes guard, `submitRef`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared layout CSS that US1 (modal search) and US2 (editor|preview columns) both build on.
Doing the `.scss`→`.css` mirror once avoids repeated churn.

- [X] T002 In `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.scss`: change `.rl-grid` from the current 5fr/7fr two-card grid to an **editor-left / preview-right** layout at `@media (min-width: 992px)` (e.g. `grid-template-columns: minmax(0, 7fr) minmax(0, 5fr)`), single column below; add `.rl-preview` (sticky pane, full height) + `.rl-preview__frame` (iframe: width 100%, tall, `border: 1px solid var(--bdr)`) + `.rl-preview__empty`/`.rl-preview__msg` (muted centered message); add `.rl-modal-search` (search input spacing) for the requests modal. Then hand-mirror every rule into `RecommendationLetters.css` (insert before the trailing `/*# sourceMappingURL */`).

**Checkpoint**: Layout + preview + modal-search styles exist; stories can wire up markup against them.

---

## Phase 3: User Story 1 — Requests modal with search (Priority: P1) 🎯 MVP

**Goal**: The requests list lives in a searchable `dashboard-modal` opened from a header button, not a
permanent column.

**Independent Test**: Click "Requests" → modal lists all requests; typing filters by reference /
name / email / company; picking a row loads the letter and closes the modal; send-from-row still works;
the unsaved-changes guard still runs before switching.

- [X] T003 [US1] In `ui/src/Components/Dashboard/RecommendationLetters/LetterRequestList.tsx`, add an optional `search`/`onSearchChange` controlled text input (rendered above the list with class `rl-modal-search`) OR accept a `query` prop and filter internally — filter `items` case-insensitively on `reference`, `requester.name`, `requester.email`, `requester.company`; show the existing `rl-empty` ("No matching requests.") when the filter clears the list. Keep the row markup, `onSelect`, and `onSend` unchanged.
- [X] T004 [US1] In `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.tsx`: add a "Requests" button to the `dash-header`; add `modalOpen` + `query` state; render `ModalDialog` (from `@/Components/Generic/Dialog/Dialog`) with `title="Requests"`, `content` = the search field + `LetterRequestList` (loading/failed/empty states preserved), and `onCancel` = close. Wrap `select()` so a successful pick closes the modal (the existing unsaved-changes `confirm()` still runs first); keep `send()` working from inside the modal. Remove the permanent Requests `rl-card` column from the page.

**Checkpoint**: Requests are reachable only via the searchable modal; US1 shippable on its own.

---

## Phase 4: User Story 2 — Editor left, live PDF preview right (Priority: P1)

**Goal**: The editor fills the left column; the right column shows a live PDF preview that refreshes on
field focus-out.

**Independent Test**: Edit a field and blur → preview refreshes to the real PDF; no refresh while a
field is focused (debounced); an incomplete draft shows a short message in the pane (no popup/crash);
below 992px the layout stacks.

**Depends on**: T002 (layout/preview CSS).

- [X] T005 [US2] Create `ui/src/Components/Dashboard/RecommendationLetters/LetterPreview.tsx` — props `{ requestId: string; fields: LetterFields; refreshKey: number }` (or an imperative `refresh()` via `useImperativeHandle`). It holds a blob-URL `<iframe className="rl-preview__frame">`; on refresh it validates with the shared `previewSchema` rules (or calls `fetchLetterPdf` and handles the 400), POSTs the current `fields` to `fetchLetterPdf(requestId, fields, "inline")`, swaps the iframe `src` to the new blob URL, and revokes the previous URL (and on unmount). While generating show a busy state; on validation/PDF failure show `.rl-preview__msg` ("Fill the required fields to preview."). Debounce refreshes ~400 ms and skip when `fields` are unchanged since the last successful render.
- [X] T006 [US2] In `ui/src/Components/Dashboard/RecommendationLetters/LetterEditor.tsx`, trigger a preview refresh on field focus-out: add an `onBlurCapture` on the `<Form>` (or an `onPreviewRefresh(values)` callback prop invoked from each field's `onBlur`) that passes the current Formik `values` up to the page. Do not change Save/View/Download handlers, `submitRef`, dirty tracking, or validation.
- [X] T007 [US2] In `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.tsx`, render the two-column body: `LetterEditor` in the left `.rl-card`, `LetterPreview` in the right `.rl-preview`. Wire the editor's focus-out callback to bump `LetterPreview`'s `refreshKey` (or call its `refresh()`); pass the latest edited `values` (fall back to `detail.letter` before the first edit). Show `.rl-preview__empty` ("Select a request to preview.") when no request is selected.

**Checkpoint**: Editing + focus-out updates the real PDF preview beside the full-width editor.

---

## Phase 5: User Story 3 — Action buttons at the top (Priority: P2)

**Goal**: Save / View / Download PDF sit at the top of the editor.

**Independent Test**: The three buttons appear above the form fields with unchanged behaviour and
disabled/busy states.

**Note**: T008 edits the same `LetterEditor.tsx` as T006 → sequence after US2's edit (or coordinate).

- [X] T008 [US3] In `ui/src/Components/Dashboard/RecommendationLetters/LetterEditor.tsx`, move the `<div className="rl-editor__actions">` block (Save / View / Download) from the bottom of the `<Form>` to directly after the `rl-editor__header`, keeping the same buttons, handlers, `disabled`/busy text.
- [X] T009 [US3] In `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.scss`, update `.rl-editor__actions` for the new top position (remove the `margin-top`/`border-top`; add bottom spacing + optionally a bottom `border`); hand-mirror into `RecommendationLetters.css`.

**Checkpoint**: Primary actions are visible without scrolling; behaviour unchanged.

---

## Phase 6: Polish & Cross-Cutting

- [X] T010 Run `cd ui && npx tsc --noEmit -p .` — expect only the known baseline noise; fix any new errors from US1–US3.
- [X] T011 Run `cd ui && npm run build:client` — must succeed.
- [ ] T012 Walk the `quickstart.md` manual checklist (modal+search, preview-on-blur, actions-at-top, responsive stack) and confirm the public site and other dashboard sections are visually unchanged.

---

## Dependencies & Execution Order

- **Setup (T001)**: no dependencies.
- **Foundational (T002)**: blocks US1 (modal search styles) and US2 (grid/preview styles).
- **US1 (T003–T004)**: after T002. T003 (LetterRequestList) and T004 (page) are different files but T004 consumes T003 → do T003 first.
- **US2 (T005–T007)**: after T002. T005 (new LetterPreview) is independent [P]; T006 (editor hook) and T007 (page wiring) depend on T005; T007 shares `RecommendationLetters.tsx` with T004 → sequence after US1's page edit.
- **US3 (T008–T009)**: T008 shares `LetterEditor.tsx` with T006 → sequence after it; T009 shares the SCSS with T002 → sequence after it.
- **Polish (T010–T012)**: after the stories you intend to ship.

## Parallel Opportunities

- T003 (LetterRequestList) ∥ T005 (LetterPreview) — different files, both after T002.
- Everything touching `RecommendationLetters.tsx` (T004, T007) is sequential; same for `LetterEditor.tsx` (T006, T008) and the SCSS (T002, T009).

## Implementation Strategy

- **MVP**: Setup + Foundational + US1 (requests modal with search) → demo.
- **Then**: US2 (editor-left + live preview) → demo.
- **Then**: US3 (actions at top) → demo.
- Commit per phase; keep `.scss` and `.css` edits in the same commit. No backend restart needed
  (UI-only).

## Notes

- Reuse `dashboard-btn--icon` / existing `.rl-*` classes; no new dependency.
- The preview POSTs to the read-only `/letter/pdf` endpoint — safe to call repeatedly; it never writes.
- Popup-blocker handling stays only on the existing "View" button (opens a tab); the preview is an
  in-page iframe.
