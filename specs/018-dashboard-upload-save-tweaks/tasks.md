---

description: "Task list for feature 018 — Dashboard Upload & Save Improvements"
---

# Tasks: Dashboard Upload & Save Improvements

**Input**: Design documents from `/specs/018-dashboard-upload-save-tweaks/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested, and the repo has no test framework. Each story is validated manually with the matching section of [quickstart.md](./quickstart.md).

**Organization**: Tasks are grouped by user story. The three stories touch different files and can be built in any order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = Presentations lock-down, US2 = Newsletter Save / Save and Close, US3 = File Management multi-upload
- Paths: the server is in `src/` at the repo root and the SPA is in `ui/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Put the work on its own branch

- [X] T001 Create and switch to branch `018-dashboard-upload-save-tweaks` from `main` (merge or rebase `017-dashboard-datagrid-height` first if it is not yet in `main`), and confirm `.specify/feature.json` points at `specs/018-dashboard-upload-save-tweaks`

---

## Phase 2: Foundational (Blocking Prerequisites)

None. Every story reuses existing infrastructure (`requireRoles` / `adminAuthMiddleware` in `src/middleware/adminauth.middleware.ts`, `axiosInstance`, `useToast`), and no shared code has to exist first.

**Checkpoint**: The user story phases can start straight away, in parallel if needed.

---

## Phase 3: User Story 1 - Members can no longer upload presentations (Priority: P1) 🎯 MVP

**Goal**: Members (role `user`) no longer see Manage Presentations and cannot upload presentations through any route. Admin and procurement access is unchanged, and members can still view event presentations.

**Independent Test**: [quickstart.md §1](./quickstart.md#1-presentations-lock-down-us1). The member sees no menu entry, a direct link sends them to Country Intelligence, a direct POST returns 403, and the Events modal still lists presentations. Admin and procurement uploads still work.

### Implementation for User Story 1

- [X] T002 [P] [US1] In `ui/src/Pages/Dashboard/Dashboard.tsx`, change `accessControl.manage_presentations` from `["user", "admin", "procurement"]` to `["admin", "procurement"]`. Leave `isValidMenuItem` and the tab resolver untouched, because the existing `filteredMenuItems` / `defaultTab` fallback already handles `?tab=manage_presentations` for members (research R5)
- [X] T003 [P] [US1] In `src/controllers/presentation.controller.ts`, change `uploadPresentation` (`@Post("/")`) from `@Middlewares(authMiddleware)` to `@Middlewares(adminAuthMiddleware)`, import `adminAuthMiddleware` alongside the existing `adminOnlyMiddleware` import from `../middleware/adminauth.middleware`, and update the method's doc comment to say it is admin/procurement only. Keep `listByEvent` on `authMiddleware` (FR-005, contracts/presentations-api.md)
- [X] T004 [US1] Run `npm run tsoa:routes && npm run tsoa:spec` at the repo root to regenerate `src/routes/routes.ts` and `src/swagger/swagger.json`, and confirm that the generated POST `/api/v1/presentations` entry now references `adminAuthMiddleware` (depends on T003)
- [X] T005 [US1] Search `ui/src` for any remaining member-facing link or button into `manage_presentations` or the upload flow (for example in `ui/src/Components/Dashboard/Events/EventPresentationsModal.tsx` and `ui/src/Components/Dashboard/Events/Events.tsx`). Remove any that are shown to role `user`, and leave the read-only presentation list in place

**Checkpoint**: US1 passes quickstart §1 and can ship on its own as the MVP.

---

## Phase 4: User Story 2 - Save a newsletter without leaving the editor (Priority: P2)

**Goal**: The newsletter editor header shows Cancel · Save · Save and Close. Save stores the article and stays in the editor, and Save and Close stores it and returns to the list. Neither button creates duplicates, and a failed save never closes the editor.

**Independent Test**: [quickstart.md §2](./quickstart.md#2-newsletter-save--save-and-close-us2).

### Implementation for User Story 2

- [X] T006 [US2] In `ui/src/Components/Dashboard/Newsletter/Newsletter.tsx` (form view header, about lines 337–345), replace the single submit button with two buttons inside `.newsletter-form-actions` after Cancel (contracts/dashboard-ui.md):
  - `type="button"`, class `dashboard-btn dashboard-btn--secondary` (or the existing secondary style), `onClick={() => submitArticle(form.html, { stay: true })}`, label `submitting ? "Saving…" : "Save"`
  - `type="submit" form="newsletter-form"`, class `dashboard-btn`, label `submitting ? "Saving…" : "Save and Close"`

  Both buttons are `disabled={submitting}`. `handleSubmit` stays as it is (it already calls `submitArticle(form.html)` without `stay`, which closes on success)
- [X] T007 [US2] In `submitArticle` in `ui/src/Components/Dashboard/Newsletter/Newsletter.tsx`, check the save semantics (research R6):
  - `setView("list")` only runs after a successful request, never in `catch` or on a validation failure.
  - A first `stay` save of a new article calls `setEditingArticle(res.data.data)`, so later saves `PUT` that article instead of creating another.
  - `submitting` is set before validation can return, or validation runs before `setSubmitting(true)`, so the buttons never stay stuck disabled.
  - The `onSave` from the Studio editor still passes `{ stay: true }`.

  Fix any gap found (depends on T006)
- [X] T008 [P] [US2] Add styling for the secondary Save button and the spacing between the three header buttons in `ui/src/Components/Dashboard/Newsletter/Newsletter.css` (rule `.newsletter-form-actions`, about line 131), reusing the existing dashboard button tokens and checking that it wraps cleanly at narrow widths

**Checkpoint**: US2 passes quickstart §2 independently of US1 and US3.

---

## Phase 5: User Story 3 - Upload several files at once with visible progress (Priority: P3)

**Goal**: File Management accepts several files and uploads them one after another to `POST /api/v1/files`. A blocking overlay shows progress for each file (bytes sent, then Processing…, then Uploaded or Failed) and a bytes-weighted batch percentage. When the batch finishes, the list refreshes and a summary toast appears. The `/files` write routes are guarded to admin and procurement.

**Independent Test**: [quickstart.md §3](./quickstart.md#3-file-management-multi-upload-us3).

### Implementation for User Story 3

- [X] T009 [P] [US3] In `src/controllers/file.controller.ts`:
  - Add `@Middlewares(adminAuthMiddleware)` to `uploadFile` (`@Post("/")`) and `deleteFile` (`@Delete("/{id}")`). `adminAuthMiddleware` is already imported.
  - At the start of `uploadFile`, if `!file`, call `this.setStatus(400)` and return `createErrorResponse("No file provided", "NO_FILE")`.

  Leave the response shapes and `getFiles` unchanged (contracts/files-api.md)
- [X] T010 [US3] Run `npm run tsoa:routes && npm run tsoa:spec` at the repo root to regenerate `src/routes/routes.ts` and `src/swagger/swagger.json`, and confirm that POST and DELETE `/api/v1/files` now reference `adminAuthMiddleware` (depends on T009; if US1 is done in the same session, one run covers both T004 and T010)
- [X] T011 [P] [US3] Create `ui/src/api/files.ts`, modelled on `uploadPresentation` in `ui/src/api/presentations.ts`. It exports `uploadFile(file: File, onProgress?: (loaded: number, total: number) => void, signal?: AbortSignal): Promise<{ fileId: string; extension: string }>`, which:
  - Posts `FormData` with field `file` to `/files` with `headers: { "Content-Type": "multipart/form-data" }`.
  - In `onUploadProgress`, calls `onProgress(event.loaded, event.total ?? file.size)`.
  - Throws `new Error(response.data.message)` when `response.data.success === false`, and otherwise returns `response.data.data`.
  - Re-exports or reuses `apiErrorMessage` for callers.
- [X] T012 [P] [US3] Create `ui/src/Components/Dashboard/FileManagement/UploadOverlay.tsx`. Export the `UploadItem` type `{ name; size; loaded; status: "queued" | "uploading" | "processing" | "done" | "failed"; error? }` (data-model.md). The default component takes props `{ items: UploadItem[]; batchPercent: number }` and renders:
  - A container with `role="dialog" aria-modal="true" aria-busy="true" aria-label="Uploading files"`.
  - One row per item with the file name, a determinate bar (`role="progressbar"` with `aria-valuenow`, `aria-valuemin={0}` and `aria-valuemax={100}`), the percentage, and a status label: Queued / Uploading / Processing… / Uploaded / Failed – {error}.
  - A footer with the overall bar at `batchPercent` and "{done+failed} of {total} files".

  Clamp percentages to 0–100 the way `ui/src/Components/Dashboard/Presentations/UploadProgress.tsx` does.
- [X] T013 [P] [US3] Add overlay styles to `ui/src/Components/Dashboard/FileManagement/FileManagement.scss` and regenerate or mirror them into `FileManagement.css` (and its `.css.map` if the project compiles SCSS):
  - `.dash-section` used by File Management gets `position: relative`.
  - `.file-upload-overlay` is absolutely positioned with `inset: 0`, a semi-opaque backdrop, a high `z-index` and `pointer-events: auto`, and contains a centred card.
  - Rows are scrollable when there are many files, and the bars reuse the look of `.presentation-upload__bar` from `ui/src/Components/Dashboard/Presentations/Presentations.scss`.
  - The layout works in dark mode and at phone width.
- [X] T014 [US3] In `ui/src/Components/Dashboard/FileManagement/FileManagement.tsx`, replace `handleFileUpload` with a batch flow (depends on T011, T012):
  - Copy `Array.from(e.target.files)`, then reset `e.target.value = ""`. Return early if the list is empty.
  - Initialise `items` state (`UploadItem[]`, all `queued`) and set `uploading = true`.
  - Loop sequentially (`for … of` with `await`). Set each item to `uploading`, call `uploadFile(file, (loaded) => …)` and update its `loaded`, switching to `processing` once `loaded >= size`. On resolve, mark the item `done`. On reject, mark it `failed` with `apiErrorMessage(err, "Upload failed")`, then continue with the next file (FR-017).
  - Compute `batchPercent` as described in data-model.md (done and failed items count as full).
  - When the loop ends, set `uploading = false`, clear `items`, call `fetchFiles()`, and show a toast. Use `success` ("N files uploaded") when nothing failed, `error` when everything failed, and `warning` otherwise ("N uploaded, M failed: name (reason), …").
- [X] T015 [US3] In the JSX of `ui/src/Components/Dashboard/FileManagement/FileManagement.tsx` (depends on T014):
  - Change the input to `<input type="file" multiple hidden disabled={uploading} onChange={handleFileUpload} />`.
  - Change the label text to `uploading ? "Uploading…" : "Upload Files"`, add `aria-disabled` and a disabled style while uploading.
  - Render `{uploading && <UploadOverlay items={items} batchPercent={batchPercent} />}` inside the `.dash-section` so it covers the header and grid.
- [X] T016 [US3] In `ui/src/Components/Dashboard/FileManagement/FileManagement.tsx`, add a `useEffect` keyed on `uploading` that registers a `beforeunload` handler (`e.preventDefault(); e.returnValue = ""`) while it is true, and removes the handler in the cleanup (FR-020, research R7)
- [X] T017 [US3] Confirm that the Blog image upload in `ui/src/Components/Dashboard/Blog/Blog.tsx` (`axiosInstance.post("/files", …)`) still works for admin and procurement now that the route is guarded, and that any non-2xx response is handled through its existing error path (quickstart §3 step 9)

**Checkpoint**: US3 passes quickstart §3 independently of US1 and US2.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T018 [P] Run `cd ui && npm run lint` and fix any lint errors in the changed UI files: `ui/src/Pages/Dashboard/Dashboard.tsx`, `ui/src/Components/Dashboard/Newsletter/Newsletter.tsx`, `ui/src/Components/Dashboard/FileManagement/FileManagement.tsx`, `ui/src/Components/Dashboard/FileManagement/UploadOverlay.tsx` and `ui/src/api/files.ts`
- [X] T019 [P] Run `npx tsc --noEmit` at the repo root (server) and `cd ui && npx tsc --noEmit` (or `npm run build:client`) to confirm both projects type-check
- [ ] T020 Run the full manual walkthrough in `specs/018-dashboard-upload-save-tweaks/quickstart.md` (§1–§3) with admin, procurement and member accounts, including the 403 console checks, and tick off any items that fail back into this file as follow-up tasks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: empty.
- **US1, US2 and US3 (Phases 3–5)**: each depends only on Setup. They do not depend on each other, and they touch different files.
- **Polish (Phase 6)**: comes after whichever stories are in scope.

### Within Each Story

- US1: T002 ∥ T003, then T004 (needs T003), then T005.
- US2: T006, then T007. T008 can run in parallel with either.
- US3: T009, then T010. T011 ∥ T012 ∥ T013 (these can run in parallel with T009 and T010), then T014 (needs T011 and T012), then T015, then T016, then T017.

### Parallel Opportunities

- Across stories: US1, US2 and US3 can be built at the same time by different people.
- US1: `T002` (UI access map) ∥ `T003` (server middleware).
- US2: `T008` (CSS) ∥ `T006`/`T007` (component).
- US3: `T009` (server) ∥ `T011` (api client) ∥ `T012` (overlay component) ∥ `T013` (styles).
- Polish: `T018` ∥ `T019`.

### Parallel Example: User Story 3

```text
Task: "T009 [US3] Guard POST/DELETE /files with adminAuthMiddleware + 400 on missing file in src/controllers/file.controller.ts"
Task: "T011 [US3] Create uploadFile(file, onProgress) in ui/src/api/files.ts"
Task: "T012 [US3] Create UploadOverlay component in ui/src/Components/Dashboard/FileManagement/UploadOverlay.tsx"
Task: "T013 [US3] Add overlay styles in ui/src/Components/Dashboard/FileManagement/FileManagement.scss/.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 (branch).
2. T002–T005, which closes the member upload access gap.
3. **Stop and validate** with quickstart §1, then ship.

### Incremental Delivery

1. US1, the access-control fix, ships first.
2. US2, the newsletter buttons, is small and self-contained.
3. US3, multi-upload with the overlay, is the largest piece. It also closes the unguarded `/files` routes.
4. The Polish tasks come before the PR.

### Notes

- Two separate `tsoa routes` runs (T004 and T010) collapse into one if US1 and US3 land together.
- Commit after each task or story, and keep the generated `src/routes/routes.ts` and `src/swagger/swagger.json` changes in the same commit as the controller change that caused them.
