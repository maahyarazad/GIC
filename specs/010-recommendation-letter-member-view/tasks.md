---
description: "Task list for Recommendation Letter — member view, receipt email & approve/send"
---

# Tasks: Recommendation Letter — member view, receipt email & approve/send

**Input**: Design documents from `/specs/010-recommendation-letter-member-view/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: None requested — no test runner in this repo. Validation = `npx tsc --noEmit -p .` (backend),
`cd ui && npx tsc --noEmit -p .` (UI baseline ≈ 71 lines), `cd ui && npm run build:client`, plus the
manual checklist in `quickstart.md`. A **backend restart** (`:5612`) is required after model / text /
PDF / config / route / email-template changes. **Do not trigger real emails against the live SMTP/DB
without the user's go-ahead** — the user runs live submission tests.

**Repo conventions**: tsoa 6.6 — `src/routes/routes.ts` + `src/swagger/swagger.json` are generated;
regenerate with `npm run tsoa:routes` / `npm run tsoa:spec`, never hand-edit. Every `*.scss` edit is
hand-mirrored into the matching `*.css` (no sass build step; never `npx sass`). Keep existing saved
drafts/records loading (back-compat). No new dependency.

> **Why the three-part body lives in Foundational, not US4:** the member view (US1) reuses the shared
> admin `LetterEditor`, and reshaping `LetterFields` (body fields, removing `closing`) is a compile-gating
> change that must land atomically across types + model + text service + PDF + editor. US4 then owns the
> body-specific *deliverables* (default wording, row counts, legacy mapping) on top of that backbone.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 = member DRAFT view, US2 = emails, US3 = approve/send, US4 = three-part body,
  US5 = remove letter type, US6 = scrollable editor

---

## Phase 1: Setup

- [X] T001 Re-read the current integration points before editing: `buildRecommendationLetterPdf(fields, reference)` and the signatories/watermark area in `src/services/recommendationLetterPdf.ts`; `buildBody`/`buildDefaultLetter`/`validateLetter`/`letterStatus`/`LIMITS`/`LABELS`/`ALWAYS_REQUIRED`/`REQUIRED_TO_SAVE`/`DEFAULT_CLOSING` in `src/services/recommendationLetterText.ts`; `LetterSchema` + `notification`/`delivery` sub-docs in `src/models/businessLetterRequest.model.ts`; `notifyLeadership` + create flow in `src/controllers/businessLetter.controller.ts`; the admin endpoints in `src/controllers/recommendationLetterAdmin.controller.ts`; `ensureEmailTemplate` + `RECOMMENDATION_LETTER_DELIVERY` in `src/services/emailTemplateProvisioning.ts`; the `recommendationLetters` client in `ui/src/api/recommendationLetters.ts`; the shared editor/preview/list/page in `ui/src/Components/Dashboard/RecommendationLetters/`.
- [X] T002 Locate where the member accesses letters in the member dashboard (grep `BusinessLetter` mounts and the dashboard section router under `ui/src/Components/Dashboard/`) and confirm the member auth middleware + how the caller identity is resolved in an existing member controller (e.g. `src/controllers/businessLetter.controller.ts` create). Record both for T022/T015.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared schema/type/text/PDF/editor changes every story builds on. Must keep `tsc` and
`build:client` green as a unit. No user-story label (cross-cutting).

- [X] T003 In `src/types/recommendationLetter.types.ts`: add `bodyIntro`, `bodyMain`, `bodyClosing` to `LetterFields` (keep `closing` as `@deprecated` legacy for back-compat); add them to `LETTER_FIELD_KEYS`; extend `LetterStatus` with `"approved"` and add `LETTER_STATUS_LABELS.approved = "Approved"`; add `approvalStatus: "pending" | "approved"` and `approvedAt: string | null` to `LetterRequestListItem`; add `approval` (status/approvedAt/approvedBy name) and `receipt` outcome to `LetterRequestDetail`.
- [X] T004 In `src/models/businessLetterRequest.model.ts`: add `bodyIntro`/`bodyMain`/`bodyClosing` (String, default "") to `LetterSchema` (keep `closing`); add an `approval` sub-doc `{ status: enum["pending","approved"] default "pending", approvedAt: Date|null, approvedBy: ObjectId ref User|null }`; add a `receipt` sub-doc mirroring `notification` `{ status: enum["pending","sent","failed"], attemptedAt: Date, error: String }`; make `letterType` optional with a default (`business_recommendation`); surface `approval`/`approvedAt` in the list projection/mapper.
- [X] T005 In `src/services/recommendationLetterText.ts`: replace `closing` with `bodyIntro`/`bodyMain`/`bodyClosing` in `LIMITS` (intro 600, main 4000, closing 1000), `LABELS`, and `ALWAYS_REQUIRED`; set the default wording for each (verbatim from `data-model.md` — intro references the company, main = the long supplied block, closing = the "We wish the company every success…" line); in `buildDefaultLetter` seed the three fields and map a legacy `closing → bodyClosing` when the new fields are absent; keep `validateLetter` applying the new limits/required set; update `letterStatus(doc)` precedence to `sent > failed > approved > draft > new`.
- [X] T006 In `src/services/recommendationLetterText.ts`: rewrite `buildBody(fields)` to return the three parts as a renderable structure — intro (bold), then `bodyMain` split on blank lines (regular), then `bodyClosing` (regular). Choose a shape the PDF can consume for per-paragraph weight (e.g. `{ text: string; bold: boolean }[]`) and keep it exported.
- [X] T007 In `src/services/recommendationLetterPdf.ts`: change the signature to `buildRecommendationLetterPdf(fields, reference, opts?: { draft?: boolean; signatures?: boolean })` with defaults `{ draft: false, signatures: true }`; consume the new `buildBody` shape (intro bold, main, closing) replacing the old `buildBody(...).forEach` + `paragraph(fields.closing)`.
- [X] T008 In `src/services/recommendationLetterPdf.ts`: when `opts.draft`, draw a single large diagonal **"DRAFT"** on every page (origin near bottom-left, rotated along the A4 diagonal to the top-right, grey, ~0.2 opacity) in the existing per-page footer loop, drawn **before** body text so content sits on top; when `opts.signatures === false`, skip the entire signatories block (no reserved vertical space, no `file_storage` reads).
- [X] T009 In `ui/src/Components/Dashboard/RecommendationLetters/LetterEditor.tsx`: replace the single `closing` field/validation with three body inputs `bodyIntro` (textarea), `bodyMain` (textarea), `bodyClosing` (textarea); update the Yup `base`/`saveSchema`/`previewSchema` to the new fields + limits; remove all `closing` references so the shared editor compiles. (Row counts/labels refined in US4.)
- [X] T010 Backend compile gate for the foundational slice: `npx tsc --noEmit -p .` green; then `npm run tsoa:routes && npm run tsoa:spec` (no endpoint added yet, but regen keeps the spec consistent with the type changes).

**Checkpoint**: Schema, text service, PDF, and shared editor compile on the new field/status shape.

---

## Phase 3: User Story 1 — Member DRAFT view (Priority: P1) 🎯 MVP

**Goal**: A member opens their request in the same editor + live-preview UI as admin, can edit and save
the draft, cannot send/approve, and the preview PDF is DRAFT-watermarked with no signatures.

**Independent Test**: Sign in as a member with a request → see editor + preview; edit+blur refreshes the
preview; preview PDF shows the diagonal DRAFT watermark and no signatures; no Send/Approve control; save
persists and reloads; the server rejects any direct send/approve by a member.

**Depends on**: Foundational (PDF options, shared editor).

- [X] T011 [US1] Create `src/controllers/recommendationLetterMember.controller.ts` with `@Route("api/v1/letter-requests")` guarded by the normal member auth middleware (from T002, NOT `adminOnlyMiddleware`): `GET /` (caller's own requests → `LetterRequestListItem[]`), `GET /{id}` (own → `LetterRequestDetail`, 404 if not owner), `PUT /{id}/letter` (save own draft, reuse `validateLetter`), `POST /{id}/letter/pdf?disposition=inline` (own → PDF, server forces `buildRecommendationLetterPdf(value, ref, { draft: true, signatures: false })`). Every handler filters to `requester` = caller. No send/approve routes.
- [X] T012 [US1] Regenerate tsoa: `npm run tsoa:routes && npm run tsoa:spec`; confirm the four member routes appear and `npx tsc --noEmit -p .` is green.
- [X] T013 [US1] In `src/controllers/recommendationLetterAdmin.controller.ts`, update the admin `POST /{id}/letter/pdf` to call `buildRecommendationLetterPdf(value, ref, { draft: false, signatures: true })` explicitly (behaviour unchanged) and confirm the admin send path still builds the final signed PDF.
- [X] T014 [US1] In `ui/src/api/recommendationLetters.ts`, add a member client set against base `/letter-requests`: `listMyLetters`, `getMyLetter`, `saveMyLetter`, `fetchMyLetterPdf` (always inline). Keep the admin functions; export both sets.
- [X] T015 [US1] Parametrise the shared components with `mode: "admin" | "member"` and an injected client: in `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.tsx` accept `mode`/client props, use them for list/get/save/pdf, and in member mode hide the send action and (later) the approve action; in `LetterEditor.tsx` hide the Send-related wiring in member mode (keep Save + View/Download preview); in `LetterPreview.tsx` request the draft PDF in member mode.
- [X] T016 [US1] Mount the member view in the member dashboard (from T002) — render `RecommendationLetters` with `mode="member"` and the member client for the signed-in member, so the member reaches the editor + DRAFT preview.

**Checkpoint**: Members edit + preview their letter as a watermarked, signature-free DRAFT; no send/approve client- or server-side.

---

## Phase 4: User Story 2 — Receipt email + refreshed leadership email (Priority: P1)

**Goal**: On submit, email a receipt to the requester and the refreshed leadership notification (new
template, no Letter-type row, CTA button to the dashboard RL page + requests modal).

**Independent Test**: With the user's approval, submit a request → requester gets a receipt quoting the
reference; leadership gets the new template with no Letter-type row and a working "Open in dashboard"
button; a failed email never fails the submission; `notification` and `receipt` statuses are recorded.

**Depends on**: Foundational (model `receipt` sub-doc). Independent of US1/US3.

- [X] T017 [P] [US2] Add `src/email_templates/business_letter_request.html` (copy of `specs/010-recommendation-letter-member-view/contracts/business_letter_request.email.html` — Letter-type row removed, `{{DASHBOARD_URL}}` CTA button added) and `src/email_templates/business_letter_receipt.html` (copy of the receipt contract). Ensure `npm run copy-assets` picks up new files in `src/email_templates` (same mechanism as the existing templates).
- [X] T018 [US2] In `src/services/emailTemplateProvisioning.ts`, register `BUSINESS_LETTER_REQUEST` (htmlFile `business_letter_request.html`) and `BUSINESS_LETTER_RECEIPT` (htmlFile `business_letter_receipt.html`) definitions following the `RECOMMENDATION_LETTER_DELIVERY` pattern (name/subject/htmlFile).
- [X] T019 [US2] In `src/config/businessLetterConfig.ts`, add a `DASHBOARD_URL` (base + `/dashboard?section=recommendation-letters&requests=1`) from env with a sensible default, for the leadership CTA.
- [X] T020 [US2] In `src/controllers/businessLetter.controller.ts`, migrate `notifyLeadership` off `BUSINESS_LETTER_EMAIL_TEMPLATE_ID` to `ensureEmailTemplate(BUSINESS_LETTER_REQUEST)` + `sendDynamicEmailDoc`, drop the `LETTER_TYPE` variable, add `DASHBOARD_URL`; add a `sendReceipt(doc)` that `ensureEmailTemplate(BUSINESS_LETTER_RECEIPT)` + sends to `requester.email` (vars per contract) and records `receipt.status`/`attemptedAt`/`error`. Fire both as fire-and-forget after save (like the current `void notifyLeadership(...)`); neither throws into the request.
- [X] T021 [US2] In `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.tsx` (admin mode), read the `requests=1` (and `section`) query param on mount and auto-open the requests modal so the leadership email button lands correctly.

**Checkpoint**: Submitting sends a receipt + the new leadership email; the CTA opens the admin requests modal.

---

## Phase 5: User Story 3 — Admin Approve + Send (Priority: P2)

**Goal**: The admin requests modal shows Approve before Send; Approve is a status marker (records
who/when) and does NOT gate Send.

**Independent Test**: In the modal each request shows Approve then Send; Approve flips the list chip to
"Approved" and records approver/time; Send works on an un-approved request.

**Depends on**: Foundational (approval sub-doc + status). Independent of US1/US2.

- [X] T022 [US3] In `src/controllers/recommendationLetterAdmin.controller.ts`, add `POST /{id}/approve` (`adminOnlyMiddleware`): set `approval.status="approved"`, `approvedAt=now`, `approvedBy=adminId(req)`; idempotent; return `{ message, detail }`. Do NOT add any approval check to `send`.
- [X] T023 [US3] Regenerate tsoa: `npm run tsoa:routes && npm run tsoa:spec`; confirm `/approve` appears and `npx tsc --noEmit -p .` is green.
- [X] T024 [US3] In `ui/src/api/recommendationLetters.ts`, add `approveLetter(id): Promise<{ message; detail }>` (admin base).
- [X] T025 [US3] In `ui/src/Components/Dashboard/RecommendationLetters/LetterRequestList.tsx`, add an **Approve** button before the existing **Send** button (admin mode only), disabled/busy states like Send, and render an "Approved" chip from `approvalStatus`. Keep member mode free of both.
- [X] T026 [US3] In `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.tsx`, wire an `approve(item)` handler (admin) calling `approveLetter`, showing a toast and refreshing the list/detail; pass it down only in admin mode.
- [X] T027 [US3] In `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.scss` + `.css` (hand-mirrored), style the Approve button and the "Approved" chip (reuse `rl-action`/`rl-status` patterns).

**Checkpoint**: Admins approve (marker) and send independently from the modal.

---

## Phase 6: User Story 4 — Three-part body deliverables (Priority: P2)

**Goal**: Finalise the member/admin-visible three-part body on top of the Foundational reshape: correct
default wording, sensible row counts, and legacy-draft loading.

**Independent Test**: The editor shows three body inputs (Intro/Main/Closing) with the supplied defaults
and appropriate rows; the PDF renders intro **bold**, then main, then closing; an old saved draft (with
legacy `closing`) still opens with its text in the Closing field.

**Depends on**: Foundational (T005–T009).

- [X] T028 [US4] In `ui/src/Components/Dashboard/RecommendationLetters/LetterEditor.tsx`, set the three body textareas' labels and `rows` (Intro ≈ 3, Main ≈ 12, Closing ≈ 3) and group them under a "Body" group title; confirm the "not-printable characters" hint still applies per field.
- [X] T029 [US4] Verify defaults + back-compat: `buildDefaultLetter` fills the three fields with the verbatim wording (from `data-model.md`), and a document saved with only legacy `closing` opens with that text in `bodyClosing` and sensible intro/main defaults. Confirm the admin View/Download PDF shows intro bold / main / closing.

**Checkpoint**: Three-part body is complete end-to-end with defaults, rows, and legacy mapping.

---

## Phase 7: User Story 5 — Remove letter type from both views (Priority: P3)

**Goal**: No member or admin view offers a letter-type choice; submission works without it.

**Independent Test**: The member request form and the admin RL view show no letter-type control;
submission succeeds; the leadership email has no Letter-type row (already true from US2); old records load.

**Depends on**: Foundational (letterType optional). Shares `businessLetter.controller.ts` with US2 (sequence after T020).

- [X] T030 [US5] In `ui/src/Components/Dashboard/BusinessLetter/BusinessLetter.tsx`, remove the letter-type selector (field, FormValues, initialValues, Yup, JSX, payload) from the member request form; submission no longer sends `letterType`.
- [X] T031 [US5] Grep the admin RL UI for `letterType`/`letterTypeLabel` display (e.g. `LetterRequestList.tsx`, request detail) and remove any letter-type display from the admin view.
- [X] T032 [US5] In `src/controllers/businessLetter.controller.ts`, stop requiring/validating `letterType` on create (rely on the model default); confirm create succeeds without it and `formatLetterType` is still safe for old records.

**Checkpoint**: Letter type is gone from both views; create works without it.

---

## Phase 8: User Story 6 — Scrollable editor within ≈70% viewport (Priority: P3)

**Goal**: The editor fields scroll inside a region ≈70vh (viewport minus header + title); the action bar
stays visible and the page gains no second scrollbar.

**Independent Test**: With a long letter the fields scroll within their pane while the action bar stays
put; no page-level second scrollbar.

**Depends on**: Foundational (editor markup). Shares the SCSS with US3/US7 of 008 — sequence SCSS edits.

- [X] T033 [US6] In `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.scss`, give the editor field region `max-height: calc(70vh)` (or viewport minus header/title) + `overflow-y: auto`, keeping `.rl-editor__actions` outside the scroll area; ensure the preview pane height matches. If a scroll wrapper element is needed, add it in `LetterEditor.tsx` around the field groups (not the actions). Hand-mirror into `RecommendationLetters.css`.

**Checkpoint**: Editor scrolls within ~70% of the viewport; actions stay visible.

---

## Phase 9: Polish & Cross-Cutting

- [X] T034 Backend: `npx tsc --noEmit -p .` green; `npm run tsoa:routes && npm run tsoa:spec` run and committed artifacts up to date.
- [X] T035 UI: `cd ui && npx tsc --noEmit -p .` (no NEW errors over the ~71-line baseline) and `cd ui && npm run build:client` succeeds.
- [X] T036 Confirm every `.scss` edit is mirrored in its `.css` (no `npx sass`); diff-check `RecommendationLetters.scss`↔`.css`.
- [ ] T037 Walk `quickstart.md` manual checklist (member DRAFT view, emails [with user approval], approve/send, three-part body, no letter type, scroll) and confirm the public site and unrelated dashboard sections are unchanged. Restart the backend on `:5612` first.

---

## Dependencies & Execution Order

- **Setup (T001–T002)**: no dependencies.
- **Foundational (T003–T010)**: blocks all stories; must land as a compiling unit (shared editor + PDF + schema).
- **US1 (T011–T016)**: after Foundational. T011→T012 (regen) sequential; T014 [P] with T013; T015 after T014; T016 after T015.
- **US2 (T017–T021)**: after Foundational. T017 [P]; T018→T020; T019 [P]; T021 independent (admin page).
- **US3 (T022–T027)**: after Foundational. T022→T023 (regen); T024 [P]; T025→T026; T027 [P] (SCSS).
- **US4 (T028–T029)**: after Foundational (and after US1's shared-editor `mode`, since T028 edits the same editor).
- **US5 (T030–T032)**: after Foundational. T032 shares `businessLetter.controller.ts` with US2 (sequence after T020). T030/T031 [P] (different files).
- **US6 (T033)**: after Foundational. Shares the SCSS with US3 T027 → sequence the two SCSS edits.
- **Polish (T034–T037)**: after the stories you intend to ship.

### Shared-file sequencing (same file, must be sequential)

- `recommendationLetterPdf.ts`: T007 → T008 (then unchanged).
- `recommendationLetterText.ts`: T005 → T006.
- `LetterEditor.tsx`: T009 (foundational) → T015 (mode) → T028 (rows) → T033 wrapper.
- `RecommendationLetters.tsx`: T015 → T021 → T026.
- `recommendationLetterAdmin.controller.ts`: T013 → T022.
- `recommendationLetters.ts` (api): T014 → T024.
- `businessLetter.controller.ts`: T020 → T032.
- `RecommendationLetters.scss`/`.css`: T027 → T033.
- tsoa regen (T010, T012, T023, T034) must follow each batch of endpoint/type changes.

## Parallel Opportunities

- T017 (email templates) ∥ T019 (config) ∥ T013 (admin pdf flags) — different files.
- T024 (api approve) ∥ T025 setup — but T025→T026 sequential.
- T030 (member form) ∥ T031 (admin display) — different files.
- Across stories: once Foundational is done, US2 (emails) and US3 (approve) are largely independent and
  can proceed in parallel with US1 except where they share `RecommendationLetters.tsx` (sequence those).

## Implementation Strategy

- **MVP**: Setup + Foundational + **US1** (member DRAFT view) → demo the member editable draft with
  watermark + no signatures.
- **Then**: US2 (emails) and US3 (approve/send) — both P-level, mostly independent.
- **Then**: US4 (body polish), US5 (remove letter type), US6 (scroll).
- Commit per phase; keep `.scss` and `.css` in the same commit; regenerate tsoa artifacts in the same
  commit as the endpoint/type change. Backend restart for any model/text/PDF/config/route/email change.
