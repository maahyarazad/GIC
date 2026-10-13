---

description: "Task list for Industry Sector Selection & Tender Board"
---

# Tasks: Industry Sector Selection & Tender Board

**Input**: Design documents from `/specs/006-industry-sector-tenders/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/tenders.api.md](./contracts/tenders.api.md), [quickstart.md](./quickstart.md)

**Tests**: The spec does not ask for automated tests, and the repo has no test runner. Each story is validated through the [quickstart.md](./quickstart.md) scenarios listed in its checkpoint.

**Organization**: Tasks are grouped by user story:
- **US1** (P1): Select industry sectors at registration
- **US2** (P1): Prompt existing members without sectors to the wizard
- **US3** (P1): Create a tender for one of my sectors
- **US4** (P2): View tenders restricted to my own sectors
- **US5** (P2): Email notification when a new tender matches my sector
- **US6** (P3): Admin closes a tender early

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- Paths are relative to the repo root. The API is in `src/`, the UI in `ui/src/`.

## Conventions every task follows

- **Controllers**: tsoa, `createSuccessResponse` / `createErrorResponse` from `src/utils/helpers.ts`, `this.setStatus()`. Member-facing routes use `@Middlewares(authMiddleware)` (`src/middleware/auth.middleware.ts`); the admin-only close action uses `@Middlewares(adminOnlyMiddleware)` (`src/middleware/adminauth.middleware.ts`) — **not** `adminAuthMiddleware`, per [research R5](./research.md#r5--manual-admin-close-is-admin-only-not-adminprocurement).
- **The JWT only carries `{ userId, role }`** (see `AuthRequest`/`authMiddleware`) — it never carries `industrySectors`. Any check or snapshot that needs a user's current sectors, name, or email must read `UserModel.findById(req.user.userId)` fresh, not trust the token.
- **Error codes** (exact, from the contract): `INVALID_SECTORS`, `SECTORS_ALREADY_SET`, `MISSING_FIELD`, `SECTOR_NOT_OWNED`, `SECTOR_NOT_ASSIGNED`, `SECTOR_REQUIRED`, `ALREADY_CLOSED`.
- **File uploads**: reuse the exact pattern in `FileController.uploadPdf` (`src/controllers/file.controller.ts`) — `@UploadedFile`, `path.basename` sanitization, write under `file_storage/`.
- **UI types**: import from `../../../src/types/tender.types` / `../../../src/config/industrySectors`, adjusting the number of `../` to the file's depth (mirrors `ui/src/api/recommendationLetters.ts`).
- **Styles**: hand-write `.scss` and the matching compiled `.css`/`.css.map`; there is no sass build step in this repo (see `RecommendationLetters.scss`/`.css`).
- **Email**: new templates self-provision via `ensureEmailTemplate` (`src/services/emailTemplateProvisioning.ts`) — never a manual seed script ([research R2](./research.md#r2-email-template-self-provisioning)).

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 [P] Create `src/config/industrySectors.ts` exporting:
  - `INDUSTRY_SECTORS` — a `readonly string[]` of the exact 10 sector names, in this order: "Energy, Oil & Gas, and Sustainability"; "Aerospace, Aviation, Industrial Manufacturing, and Automation"; "Construction and Infrastructure"; "Digital Technology and AI, Information Technology (IT), and Telecommunications"; "Chemicals and Petrochemicals"; "Pharmaceuticals and Life Sciences, Medical Technology, and Healthcare"; "Logistics and Supply Chain, and Transportation"; "Food and Beverage"; "Tourism and Hospitality"; "Retail and E-Commerce".
  - `type IndustrySector = typeof INDUSTRY_SECTORS[number]`.
  - `isIndustrySector(value: unknown): value is IndustrySector` — a type guard used by both registration and tender validation.
  - `SECTOR_PERMANENCE_NOTICE` — the exact string: "Your sector selection is permanent and cannot be changed later. Please choose carefully." Used verbatim by every UI surface that shows the irreversibility notice (registration, wizard, Tender tab).

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: US1–US6 all depend on this phase (US3–US6 need the Tender model/types; US1–US3 need the User model/types extension).

- [X] T002 [P] Edit `src/types/user.types.ts` (depends on T001): add `industrySectors?: string[]` and `industrySectorsSetAt?: string` to `User`; add `industrySectors: string[]` (required) to `CreateUserRequest`. Do **not** add `industrySectors` to `UpdateUserRequest` — its absence there, combined with tsoa's `noImplicitAdditionalProperties: "throw"` (`tsoa.json`), is what makes the general update endpoint reject any attempt to change it (research R1).
- [X] T003 [P] Edit `src/models/user.model.ts` (depends on T001): import `INDUSTRY_SECTORS` from `../config/industrySectors`; add to `UserDocument`: `industrySectors?: string[]; industrySectorsSetAt?: Date;`; add to `UserSchema`: `industrySectors: { type: [String], enum: INDUSTRY_SECTORS, default: undefined }` and `industrySectorsSetAt: { type: Date, default: undefined }`.
- [X] T004 [P] Create `src/types/tender.types.ts` with exactly the DTO block from [contracts/tenders.api.md](./contracts/tenders.api.md): `TenderStatus`, `TenderAttachment`, `TenderListItem`, `CreateTenderRequest`.
- [X] T005 Create `src/models/tender.model.ts` (depends on T001, T004): `TenderDocument` and `TenderSchema` per [data-model.md](./data-model.md) — `sector: { type: String, enum: INDUSTRY_SECTORS, required: true }`, `publisher`/`announcement` (trimmed, required, with max lengths), `publishedAt`/`deadline` (`Date`, required), `closedByAdminAt: { type: Date, default: null }`, `attachment` as a `{ _id: false }` subdocument (`filename, originalName, mimetype, size`) with `default: null`, `creator` as a `{ _id: false }` subdocument (`userId: ObjectId ref "User", name, email`), `{ timestamps: true, versionKey: false }`. Export `TenderModel`.

**Checkpoint**: `npx tsc --noEmit -p .` passes. No existing endpoint's behavior has changed yet.

---

## Phase 3: User Story 1 - Select industry sectors at registration (Priority: P1) 🎯

**Goal**: New members must pick exactly 3 of the 10 sectors during registration, with a clear, permanent-choice notice, before the account is created.

**Independent Test**: Register a new account through the UI; confirm 2 or 4 selections are blocked, exactly 3 succeeds, and the created user document has exactly those 3 sectors.

- [X] T006 [US1] Edit `createUser` in `src/controllers/user.controller.ts` (depends on T002, T003): after existing field validation, require `industrySectors` to be present with exactly 3 distinct values, each passing `isIndustrySector` (from T001); on failure, `this.setStatus(400)` and `createErrorResponse("Select exactly three industry sectors.", "INVALID_SECTORS")`; on success, persist `industrySectors` and `industrySectorsSetAt: new Date()` on the new `UserModel` document.
- [X] T007 [P] [US1] Create `ui/src/Components/Dashboard/Tenders/IndustrySectorWizard.tsx`: renders the 10 sectors (from `../../../../src/config/industrySectors`, adjusting `../` depth) as a checkbox/multi-select list; disables its "Confirm" action unless exactly 3 are checked; always renders `SECTOR_PERMANENCE_NOTICE` verbatim. Props: `onConfirm(sectors: string[]): void`, `confirmLabel?: string`, `submitting?: boolean`, `error?: string`. (This component is reused by US2's wizard — do not special-case registration inside it.)
- [X] T008 [US1] Edit `ui/src/Pages/Register/Register.tsx` (depends on T007): add a 4th `registrationProcess.currentStep` shown after phone-OTP verification (step 2) and before the existing final submit; render `IndustrySectorWizard`; on confirm, store the 3 sectors in local state and include `industrySectors` in the `POST /users/` payload.
- [X] T009 [US1] In `Register.tsx`, block the final submit (defense in depth) unless exactly 3 sectors are set in state, matching the server's `INVALID_SECTORS` rule.

**Checkpoint**: Quickstart scenarios 1–2 pass.

---

## Phase 4: User Story 2 - Prompt existing members without sectors to the wizard (Priority: P1)

**Goal**: A member with no sectors on file is routed to the one-time wizard from the Tenders tab instead of the tender list; the write-once endpoint backs it and is never reachable twice.

**Independent Test**: Seed (or use) an account with no `industrySectors`; open the Tenders tab, confirm the wizard (not the board) appears, complete it, confirm it never reappears for that account.

- [X] T010 [US2] Add `PUT /api/v1/users/me/industry-sectors` to `src/controllers/user.controller.ts` (same `@Route("api/v1/users")`, depends on T002, T003): `@Middlewares(authMiddleware)`; body `{ industrySectors: string[] }`; same exactly-3/valid-values check as T006; look up the caller via `UserModel.findById(req.user.userId)`; if `industrySectors` is already set, `this.setStatus(409)` + `createErrorResponse("Sectors are already set and cannot be changed.", "SECTORS_ALREADY_SET")`; else set `industrySectors` + `industrySectorsSetAt` and return them.
- [X] T011 [P] [US2] Add `setMyIndustrySectors(sectors: string[]): Promise<{ industrySectors: string[] }>` calling `PUT /api/v1/users/me/industry-sectors` to a UI API client (extend `ui/src/api/users.ts` if present, else create `ui/src/api/userProfile.ts` following the existing `axiosInstance` pattern).
- [X] T012 [US2] Create `ui/src/Components/Dashboard/Tenders/Tenders.tsx` (depends on T007, T011): reads `userProfile` via `useSelector((state: RootState) => state.auth.user)`; if `userProfile.role === "user"` and `industrySectors` is missing or not length 3, render `IndustrySectorWizard` wired to `setMyIndustrySectors`, and on success re-fetch the profile (dispatch `checkAuthToken`) before switching views; otherwise render `TenderBoard` (placeholder stub until Phase 5 fills it in — a minimal `<div>Tenders</div>` is fine for now).
- [X] T013 [US2] Edit `ui/src/Pages/Dashboard/Dashboard.tsx` (depends on T012): import `Tenders` and replace `tenders: <UnderDevelopment withLockOverlay={false} />` with `tenders: <Tenders />` in `componentMap`. Leave `accessControl`, `menuTitles`, and `isValidMenuItem` untouched — the `tenders` entries already exist there.
- [X] T014 [US2] Edit `checkAuthToken` in `ui/src/features/authThunks.ts`: also copy `industrySectors` and `industrySectorsSetAt` from `res.data.data` into the returned payload, so the Tenders-tab gate still reflects the correct state after a page reload, not only right after an in-session wizard completion.

**Checkpoint**: Quickstart scenarios 3–4 pass.

---

## Phase 5: User Story 3 - Create a tender for one of my sectors (Priority: P1)

**Goal**: A member (or procurement/admin) publishes a tender under a valid sector, with the four required fields and an optional file attachment.

**Independent Test**: As a member with 3 sectors, create one tender with an attachment and one without; confirm both are stored with a creator snapshot and the right sector.

- [X] T015 [US3] Create `src/controllers/tender.controller.ts`, `@Route("api/v1/tenders")`, `POST /` (depends on T004, T005): `@Middlewares(strictLimiter, authMiddleware)`; accepts `CreateTenderRequest` fields (multipart) plus optional `@UploadedFile("file") file`; `this.setStatus(400)` + `MISSING_FIELD` if any of `sector/publisher/announcement/publishedAt/deadline` is missing; look up the caller via `UserModel.findById(req.user.userId)` (needed for both the sector check and the creator snapshot — never trust the JWT for either); if the caller's role is `"user"` and `sector` is not in their `industrySectors`, `this.setStatus(403)` + `SECTOR_NOT_OWNED` (admin/procurement bypass this check and may use any of the 10 sectors from `INDUSTRY_SECTORS`); if `file` is present, sanitize with `path.basename` and write to `file_storage/` exactly as `FileController.uploadPdf` does, building the `attachment` subdocument; create the `Tender` with `creator: { userId, name: user.name, email: user.email }`; respond `201` with the mapped `TenderListItem` (status derivation added in T021 — until then, hardcode `"open"`).
- [X] T016 [P] [US3] Create `ui/src/api/tenders.ts`: `createTender(formData: FormData): Promise<TenderListItem>`, `multipart/form-data POST` to `/api/v1/tenders`, mirroring `ui/src/api/recommendationLetters.ts`'s style (types imported from `../../../src/types/tender.types`).
- [X] T017 [US3] Create `ui/src/Components/Dashboard/Tenders/TenderBoard.tsx` (depends on T016) with its "Create Tender" form: a sector `<select>` restricted to `userProfile.industrySectors` for role `user`, or all 10 (`INDUSTRY_SECTORS`) for `admin`/`procurement`; required inputs for publisher, announcement, publishedAt, deadline; one optional file input; client-side required-field validation mirroring `MISSING_FIELD`; on submit, calls `createTender` and prepends the result to the in-memory list.
- [X] T018 [US3] Replace the placeholder `TenderBoard` stub in `Tenders.tsx` (from T012) with the real component (T017).
- [X] T019 [P] [US3] Create `ui/src/Components/Dashboard/Tenders/Tenders.scss` and its hand-compiled `Tenders.css` / `Tenders.css.map`, matching the layout conventions of `RecommendationLetters.scss`/`.css`.

**Checkpoint**: Quickstart scenario 5 passes.

---

## Phase 6: User Story 4 - View tenders restricted to my own sectors (Priority: P2)

**Goal**: Each viewer sees only tenders from sectors they're scoped to; expired tenders show "Closed"; the contact note always appears.

**Independent Test**: Publish tenders under two different sectors; a member assigned to only one of them sees only that one's tenders.

- [X] T020 [US4] Add `GET /` to `tender.controller.ts` (depends on T015): `@Middlewares(authMiddleware)`; `@Query() sector?: string`; look up the caller via `UserModel.findById(req.user.userId)`; for role `"user"`: if `sector` is omitted, filter `{ sector: { $in: user.industrySectors } }`; if provided and not one of `user.industrySectors`, `this.setStatus(400)` + `SECTOR_NOT_ASSIGNED`; for role `"admin"`/`"procurement"`: `this.setStatus(400)` + `SECTOR_REQUIRED` if `sector` is omitted, else filter to exactly that sector; sort `{ createdAt: -1 }`; map each to `TenderListItem`.
- [X] T021 [US4] Factor the `TenderListItem` mapping — including the derived status, `closedByAdminAt ? "closed" : (now > deadline ? "closed" : "open")` (research R4) — into one shared helper function used by both `POST /` (T015) and `GET /` (T020), so they can never disagree (e.g. `mapTenderToListItem` in `tender.controller.ts`).
- [X] T022 [P] [US4] Add `listTenders(sector?: string): Promise<TenderListItem[]>` to `ui/src/api/tenders.ts`.
- [X] T023 [US4] Extend `TenderBoard.tsx` (depends on T022): for role `user`, a filter across their 3 sectors (default: combined); for `admin`/`procurement`, a required sector `<select>` that drives the query; each row shows publisher, announcement, publishedAt, deadline, an "Open"/"Closed" badge, the attachment (if any) as a link, and `creator.email` plus the fixed line "Please contact me for any further details." (FR-016).
- [X] T024 [US4] Add a persistent header in `Tenders.tsx`/`TenderBoard.tsx`, visible only for role `user`, showing the member's own 3 assigned sectors plus `SECTOR_PERMANENCE_NOTICE` (FR-022/FR-008).

**Checkpoint**: Quickstart scenarios 6–7 pass.

---

## Phase 7: User Story 5 - Email notification when a new tender matches my sector (Priority: P2)

**Goal**: Publishing a tender emails every other sector-matched member; the creator is excluded; one bad address never blocks the others or the creation itself.

**Independent Test**: Publish a tender; confirm matching members' inboxes receive it, the creator's inbox does not, and a non-matching member's inbox does not.

- [X] T025 [P] [US5] Create `src/email_templates/tender_published_notification.html` with placeholders `{{SECTOR_NAME}}`, `{{PUBLISHER}}`, `{{ANNOUNCEMENT}}`, `{{DEADLINE}}`, `{{DASHBOARD_URL}}`, following the structure of `src/email_templates/recommendation_letter_delivery.html`.
- [X] T026 [US5] Add `TENDER_PUBLISHED_NOTIFICATION: EmailTemplateDefinition` to `src/services/emailTemplateProvisioning.ts` (depends on T025), next to `RECOMMENDATION_LETTER_DELIVERY`: `name: "tender_published_notification"`, `subject: "New tender in {{SECTOR_NAME}}"`, `htmlFile: "tender_published_notification.html"`, a plain-text fallback, `variables: ["SECTOR_NAME","PUBLISHER","ANNOUNCEMENT","DEADLINE","DASHBOARD_URL"]`.
- [X] T027 [US5] Create `src/services/tenderNotifications.ts` (depends on T026): export `notifyTenderPublished(tender)` — calls `ensureEmailTemplate(TENDER_PUBLISHED_NOTIFICATION)`; queries `UserModel.find({ industrySectors: tender.sector, _id: { $ne: tender.creator.userId } })`; for each match, builds `{ email, SECTOR_NAME: tender.sector, PUBLISHER, ANNOUNCEMENT, DEADLINE, DASHBOARD_URL }` and sends via `sendDynamicEmailDoc("tender_published_notification", ...)`; wraps all sends in `Promise.allSettled` and logs each outcome with the `toOutcome` pattern from `src/services/eventNotifications.ts` — never throws back to its caller.
- [X] T028 [US5] Call `notifyTenderPublished(tender)` from `POST /` in `tender.controller.ts` (depends on T015, T027), immediately after a successful save, inside its own `try/catch` so a notification failure never affects the `201` response.

**Checkpoint**: Quickstart scenario 8 passes.

---

## Phase 8: User Story 6 - Admin closes a tender early (Priority: P3)

**Goal**: An admin (not procurement) can close an open tender early; closing is one-directional.

**Independent Test**: Admin closes an open tender; a second close attempt on the same tender is rejected; no reopen path exists anywhere in the UI or API.

- [X] T029 [US6] Add `PATCH /{id}/close` to `tender.controller.ts` (depends on T021): `@Middlewares(adminOnlyMiddleware)`; `this.setStatus(404)` if the tender doesn't exist; `this.setStatus(409)` + `ALREADY_CLOSED` if the shared mapper (T021) already reports `"closed"`; else set `closedByAdminAt = new Date()`, save, and return the updated `TenderListItem`.
- [X] T030 [P] [US6] Add `closeTender(id: string): Promise<TenderListItem>` to `ui/src/api/tenders.ts`.
- [X] T031 [US6] In `TenderBoard.tsx`, render a "Close" button on a row only when `userProfile.role === "admin"` and that row's `status === "open"`; it calls `closeTender` and updates the row's status in place. No reopen control exists anywhere (FR-021).

**Checkpoint**: Quickstart scenarios 9–11 pass.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T032 [P] Run `npm run build` and confirm `dist/email_templates/tender_published_notification.html` exists (the existing `copy-assets` script globs the whole directory, so no script change is expected — only verify).
- [X] T033 [P] Add a one-line entry for this feature to `documentation/features-ownership.md`, matching the existing per-feature convention.
- [ ] T034 Run all 11 [quickstart.md](./quickstart.md) scenarios end to end and fix anything that doesn't match.
- [X] T035 [P] `npx tsc --noEmit -p .` (server) and the UI's equivalent type-check both pass with no new errors.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS every user story.
- **US1 (Phase 3)**: Depends on Foundational (T002, T003 for the User model/types).
- **US2 (Phase 4)**: Depends on Foundational; reuses US1's `IndustrySectorWizard` (T007).
- **US3 (Phase 5)**: Depends on Foundational (T004, T005 for the Tender model/types); its `Tenders.tsx`/`TenderBoard.tsx` integration point comes from US2 (T012).
- **US4 (Phase 6)**: Depends on US3 (extends `tender.controller.ts` and `TenderBoard.tsx` created there).
- **US5 (Phase 7)**: Depends on US3 (needs a saved `Tender` to notify about) — independent of US4.
- **US6 (Phase 8)**: Depends on US4's shared status-mapper (T021).
- **Polish (Phase 9)**: Depends on all desired stories being complete.

### Story Completion Order

US1 and US2 can be built in either order relative to each other (both P1, both depend only on Foundational), but **US3 needs US2's `Tenders.tsx` shell** to have somewhere to render its board, so the practical order is US1 → US2 → US3 → US4 → US5 → US6, matching spec.md's priority numbering.

### Same-File Sequencing

Within `src/controllers/tender.controller.ts`: T015 (US3) → T020/T021 (US4) → T029 (US6) touch the same file and must be done in that order. Within `ui/src/Components/Dashboard/Tenders/TenderBoard.tsx`: T017 (US3) → T023/T024 (US4) → T031 (US6), same rule.

---

## Parallel Execution Examples

### Foundational
```
Task: "Edit src/types/user.types.ts to add industrySectors fields" (T002)
Task: "Edit src/models/user.model.ts to add industrySectors fields" (T003)
Task: "Create src/types/tender.types.ts" (T004)
```

### User Story 3
```
Task: "Create ui/src/api/tenders.ts with createTender()" (T016)
Task: "Create Tenders.scss and compiled Tenders.css" (T019)
```

### User Story 5
```
Task: "Create tender_published_notification.html" (T025)
```
(T026–T028 are sequential on top of it.)

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

Registration alone (US1) or the wizard alone (US2) produce no visible value without somewhere to use the sectors; the smallest demonstrable increment is US1 + US2 + US3 together — a member can register, pick sectors, and publish a tender. Stop and validate there (quickstart scenarios 1–5) before continuing.

### Incremental Delivery

1. Setup + Foundational → shared sector list and schema extensions ready.
2. US1 + US2 + US3 → MVP: register, get routed through the wizard if needed, publish a tender.
3. Add US4 → sector-scoped visibility and the Closed badge.
4. Add US5 → email notifications.
5. Add US6 → admin early-close.

### Notes

- `[P]` tasks touch different files with no unfinished-task dependency between them.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently via its quickstart scenarios.
- Avoid: vague tasks, two tasks editing the same file out of the stated order, and cross-story dependencies beyond the ones documented above.
