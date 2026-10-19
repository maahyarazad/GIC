---
description: "Task list for Newsletter StudioEditor with base64 images, full-width"
---

# Tasks: Newsletter StudioEditor with base64 images, full-width

**Input**: Design documents from `/specs/012-newsletter-studioeditor-base64/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/editor-contract.md, quickstart.md

**Tests**: No automated test tasks — the plan specifies manual QA via `quickstart.md` (no wired UI test runner). Validation is the quickstart scenarios.

**Organization**: Tasks are grouped by user story. US1 and US2 are both P1 and together form the MVP; US3 is P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in each task

## Path Conventions

Frontend-only web app; all paths under `ui/` at the repository root (per plan.md Structure Decision).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the dependency and client env config needed by the editor.

- [X] T001 Add `@grapesjs/studio-sdk` (and its `grapesjs` peer if required by install) to dependencies in `ui/package.json`, then run the install so the lockfile updates. Do NOT remove `quill` (still used by Blog).
- [X] T002 [P] Add `VITE_GRAPESJS_LICENSE_KEY=DEMO_LOCALHOST_KEY` to `ui/.env.local` (create the file if absent) and document the variable in `ui/.env.example` if that file exists.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the client-only StudioEditor wrapper scaffold that every user story builds on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Create `ui/src/Components/StudioEditor/StudioNewsletterEditor.tsx` — a React component with props `{ value: string; onChange: (html: string) => void }` (per contracts/editor-contract.md). It imports `StudioEditor` from `@grapesjs/studio-sdk/react`, imports the stylesheet `@grapesjs/studio-sdk/style`, and renders `<StudioEditor options={...} />`. Set `licenseKey: import.meta.env.VITE_GRAPESJS_LICENSE_KEY ?? 'DEMO_LOCALHOST_KEY'`. No `window`/DOM access at module top level (SSR-safe; FR-005, FR-006, FR-008).
- [X] T004 [P] Create `ui/src/Components/StudioEditor/StudioNewsletterEditor.css` with a container rule giving the editor host an explicit height (the SDK collapses without a sized parent); full-width rules are added in US3.

**Checkpoint**: The wrapper renders the Studio SDK editor and is ready to be lazy-loaded.

---

## Phase 3: User Story 1 - Compose and edit a newsletter with StudioEditor (Priority: P1) 🎯 MVP

**Goal**: Replace Quill in the newsletter view with the Studio SDK email editor; load existing article HTML and export email-ready HTML back into `form.html` on change/autosave, preserving the save/send/preview flow.

**Independent Test**: Open the Newsletter compose/edit view — the Studio editor renders (Quill gone). Open an existing (incl. legacy Quill) article, confirm its HTML loads; make an edit, submit, confirm the saved `html` reflects the edit and renders in the preview.

- [X] T005 [US1] In `ui/src/Components/StudioEditor/StudioNewsletterEditor.tsx`, set `project: { type: 'email' }` and configure `storage: { type: 'self', autosaveChanges: 100, autosaveIntervalMs: 10000 }` with: `onLoad` returning a `{ project }` seeded as a single email page whose body is the `value` prop (so legacy Quill HTML loads); `onSave` exporting email-ready inlined HTML from the editor and calling `onChange(html)` with `""` when content is empty. No network calls (FR-002, FR-007, FR-010).
- [X] T006 [US1] Confirm the exact HTML-export call for the installed SDK version against `ui/node_modules/@grapesjs/studio-sdk/dist/index.d.ts` (e.g. `editor.runCommand('gjs-get-inlined-html')` vs an email/MJML compile) and use it in `onSave` in `ui/src/Components/StudioEditor/StudioNewsletterEditor.tsx` (resolves research.md open item for decision 2).
- [X] T007 [US1] In `ui/src/Components/Dashboard/Newsletter/Newsletter.tsx`, replace the lazy `QuillEditor` import with a lazy import of `StudioNewsletterEditor`, and swap the `<QuillEditor value={form.html} onChange={...} />` usage (keep it inside `<Suspense fallback={<Loader />}>`) for `<StudioNewsletterEditor value={form.html} onChange={(html) => setForm((prev) => ({ ...prev, html }))} />`. Remove the now-unused `onImageUpload` prop/handler wiring for the newsletter editor. Keep the existing empty-content submit guard working (wrapper emits `""` for empty) (FR-001, FR-002, FR-009).

**Checkpoint**: Newsletter composes/edits through the Studio editor and round-trips HTML; MVP editor path works.

---

## Phase 4: User Story 2 - Images embedded as base64 (Priority: P1) 🎯 MVP

**Goal**: Images added in the editor are embedded as base64 data URLs in the HTML with no asset-upload endpoint call.

**Independent Test**: With the Network tab open, insert a local image; no asset-upload request fires. Submit and reopen — the saved HTML contains a `data:image/...;base64,...` `src` and the image still renders.

- [X] T008 [US2] In `ui/src/Components/StudioEditor/StudioNewsletterEditor.tsx`, configure `assets: { storageType: 'self', onUpload, onDelete }` where `onUpload({ files })` encodes each file to a base64 data URL via `FileReader.readAsDataURL` and returns `[{ src, name, mimeType, size }]` with **no `fetch`**, and `onDelete` is a no-op (FR-003, per contracts/editor-contract.md).

**Checkpoint**: Images insert as base64; no upload requests occur. Combined with US1, the MVP is complete.

---

## Phase 5: User Story 3 - Full-width newsletter editing UI (Priority: P2)

**Goal**: The newsletter editing area uses the full width of the screen with no horizontal page scroll.

**Independent Test**: Open the editor — it spans full screen width with an explicit height; narrow the window and confirm no horizontal page scroll and the dashboard stays usable.

- [X] T009 [US3] In `ui/src/Components/Dashboard/Newsletter/Newsletter.css`, add a full-width editing layout that breaks the editor area out of the constrained dashboard content column (full viewport width) while editing, without introducing horizontal page scroll (FR-004).
- [X] T010 [P] [US3] In `ui/src/Components/StudioEditor/StudioNewsletterEditor.css`, make the editor host `width: 100%` with a tall explicit height so the SDK canvas fills the full-width container responsively.

**Checkpoint**: Editor is full-width and usable across breakpoints.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification and cleanup across the feature.

- [X] T011 [P] Verify `ui/src/Components/Dashboard/Blog/Blog.tsx` still imports and renders `QuillEditor` correctly and that `ui/src/Components/QuillEditor/*` and the `quill` dependency remain intact (FR-009 retention).
- [X] T012 Run the UI typecheck/build (`cd ui && npm run build`) and confirm feature files typecheck and the editor is not pulled into the SSR/entry bundle (lazy-loaded) (FR-005).
- [ ] T013 Run all `quickstart.md` validation scenarios (editor swap, HTML round-trip incl. legacy article, base64 no-upload via Network tab, full-width/no horizontal scroll, SSR/initial load) and confirm each passes. **(Manual QA — requires running the authenticated dashboard in a browser; not executed during implementation.)**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately. T001 blocks the wrapper (import must resolve).
- **Foundational (Phase 2)**: Depends on T001 — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
  - US1 and US2 both edit `StudioNewsletterEditor.tsx` → do US1 then US2 (same file, not parallel).
  - US3 is independent (CSS + host files) and can run in parallel with US1/US2.
- **Polish (Phase 6)**: Depends on all targeted stories being complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational. The core editor path.
- **US2 (P1)**: After Foundational. Shares `StudioNewsletterEditor.tsx` with US1 (sequence after US1 to avoid file conflict); independently testable.
- **US3 (P2)**: After Foundational. Independent of US1/US2 content logic (layout only).

### Within Each User Story

- US1: storage/export config (T005–T006) before host swap (T007).
- US3: section CSS (T009) and host CSS (T010) are parallel.

### Parallel Opportunities

- T001 and T002 (Setup) — T002 is [P].
- T003 then T004 [P] (T004 independent of T003's body).
- US3 (T009/T010) can proceed in parallel with US1/US2 work (different files).
- T011 [P] in Polish.

---

## Parallel Example: Full-width UI (US3)

```bash
# These touch different files and can run together:
Task: "Full-width editing layout in ui/src/Components/Dashboard/Newsletter/Newsletter.css"
Task: "100%-width, tall editor host in ui/src/Components/StudioEditor/StudioNewsletterEditor.css"
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2, both P1)

1. Phase 1: Setup (T001–T002)
2. Phase 2: Foundational (T003–T004)
3. Phase 3: US1 (T005–T007) — editor swap + HTML round-trip
4. Phase 4: US2 (T008) — base64 images
5. **STOP and VALIDATE**: quickstart scenarios 1–3; this is the shippable MVP.

### Incremental Delivery

1. Setup + Foundational → wrapper renders.
2. US1 + US2 → MVP (editor works, images are base64) → demo.
3. US3 → full-width polish → demo.
4. Polish → verify Blog/Quill retention, build, full quickstart.

---

## Notes

- [P] = different files, no dependencies.
- No automated tests per plan.md (manual QA via quickstart.md).
- US1 and US2 both edit `StudioNewsletterEditor.tsx`; keep them sequential.
- Do not delete `QuillEditor` or the `quill` dependency — Blog still uses them.
- Commit after each task or logical group.
