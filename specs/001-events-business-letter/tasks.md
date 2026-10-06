---

description: "Task list for Event Categories & Business Letter Requests"
---

# Tasks: Event Categories & Business Letter Requests

**Input**: Design documents from `/specs/001-events-business-letter/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested in the spec, and the repo has no test runner (research R13). Verification uses the scenarios in `quickstart.md` plus `npm run build` and `cd ui && npm run build`.

**Organization**: Tasks are grouped by user story so each story can be built and tested on its own.

**Open decision**: Download = PDF copy of the submitted request (spec option A). The `/speckit-clarify` question about issued letters is still unanswered. If B/C is chosen later, US2 changes and an admin upload story is added.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 = Submit request (P1), US2 = History & download (P2), US3 = Events split (P3)

## Path Conventions

Web app: API in `src/` (Express + tsoa + Mongoose), client in `ui/src/` (React + Vite). The client imports server types via relative paths such as `../../../src/types/...` (see `ui/src/api/blog.ts`). The UI has no Sass build step: each component's `.scss` and its committed `.css` must be edited together, with identical rules.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Config, shared types and helpers used by every Business Letter task

- [X] T001 [P] Create `src/config/businessLetterConfig.ts` exporting:
  - `BUSINESS_LETTER_RECIPIENTS: string[]` — parse `process.env.BUSINESS_LETTER_RECIPIENTS` (comma-separated, trimmed, empties dropped). Default to `['ricco.deutscher@german-industry-club.com','philip.hoelzer@german-industry-club.com','jan.hussing@german-industry-club.com','thomas.hochberger@german-industry-club.com']`.
  - `BUSINESS_LETTER_EMAIL_TEMPLATE_ID: string` — `process.env.BUSINESS_LETTER_EMAIL_TEMPLATE_ID || "6ac4970fe31c56f3436780a0"`.
  - Call `dotenv.config()` at the top, like other server modules.
- [X] T002 [P] Create `src/types/businessLetter.types.ts` with:
  - `BusinessLetterType` (`'business_recommendation' | 'partner_recommendation'`) and `BusinessLetterLanguage` (`'en' | 'de'`).
  - `NotificationStatus` (`'pending' | 'sent' | 'failed'`).
  - `CreateBusinessLetterRequest` and `BusinessLetterRequestDto`, shaped exactly as in `specs/001-events-business-letter/contracts/business-letters.api.md`.
  - `LETTER_TYPE_LABELS: Record<BusinessLetterType,string>` and `LANGUAGE_LABELS: Record<BusinessLetterLanguage,string>`, from `data-model.md`.
  - `formatLetterType(type)`, returning the label.
- [X] T003 [P] Add `export function escapeHtml(value: unknown): string` to `src/utils/helpers.ts`. It escapes `& < > " '` and returns `""` for null or undefined.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persistence and email plumbing shared by US1 and US2

**⚠️ CRITICAL**: US1 and US2 can't start until this phase is done. US3 doesn't depend on it and can start right away.

- [X] T004 Create `src/models/businessLetterRequest.model.ts`, following `src/models/contactus.model.ts`:
  - Mongoose schema with the fields, limits and enums from `data-model.md` §1:
    - `requester`, `addressee` and `notification` as nested objects.
    - `notification.status` defaults to `'pending'`.
    - `timestamps: true`.
  - Indexes: `{ reference: 1 }` unique, and `{ userId: 1, createdAt: -1 }`.
  - Export `BusinessLetterRequestModel = model("BusinessLetterRequest", schema)`.
  - Export `mapBusinessLetterRequest(doc): BusinessLetterRequestDto`:
    - `id` as a string; `userId` omitted.
    - `letterTypeLabel` via `formatLetterType`.
    - `neededBy` as `YYYY-MM-DD` (UTC).
    - `notificationStatus` = `notification.status`.
- [X] T005 [P] Extend `sendDynamicEmailToUser` in `src/services/emailService.ts`:
  - Make `EmailParam.template_name` optional and add optional `template_id?: string`.
  - If `template_id` is set: throw `Error("Invalid email template id")` when `!ObjectId.isValid(template_id)`. Otherwise run `templateCollection.findOne({ _id: new ObjectId(template_id) })`; import `ObjectId` from `mongodb`.
  - Otherwise keep the existing `{ name: template_name }` lookup unchanged.
  - Keep the existing `"Email template not found"` throw.
  - Existing callers (`contactus.controller.ts` etc.) must still compile unchanged.

**Checkpoint**: The model and the email-by-id lookup compile (`npx tsc --noEmit`).

---

## Phase 3: User Story 1 - Submit a business letter request (Priority: P1) 🎯 MVP

**Goal**: Any signed-in role can open "Request a Business Letter" and submit a validated request. The request is saved with a `BL-YYYYMMDD-XXXXXX` reference, and the four leadership addresses receive the template `6ac4970fe31c56f3436780a0` email.

**Independent Test**: quickstart.md Scenarios B, C and D. The menu shows for all three roles; submitting gives 201 + reference, and the recipient gets the email. With a bad template id the request is still saved, with `notification.status = "failed"`.

### Implementation for User Story 1

- [X] T006 [US1] Create `src/controllers/businessLetter.controller.ts` with tsoa `@Route("api/v1/business-letters")`, `@Tags("Business Letters")`, class `BusinessLetterController extends Controller`.

  Implement `@Post("/")` with `@Middlewares(strictLimiter, authMiddleware)`, taking `@Body() body: CreateBusinessLetterRequest` and `@Request() req`:

  1. **Identify the user.** `userId = (req as any).user?.userId`. Load the user from `UserModel` (or `getCollection("users")`) by `toObjectId(userId)` from `src/mappers/objectId.mapper.ts`. Return 404 `USER_NOT_FOUND` if missing.
  2. **Validate on the server.** Use a local `validateCreate(body)` that returns `Record<string,string>`, with the rules from `data-model.md` §1:
     - required fields and length limits, enums;
     - `purpose` 10–2000 characters;
     - `neededBy` must be a `YYYY-MM-DD` date no earlier than yesterday (UTC) — 1-day timezone tolerance.

     If there are errors, return 400 `createErrorResponse("Validation failed","VALIDATION_ERROR",errors)`.
  3. **Build the document.**
     - Pre-generate `_id = new ObjectId()`.
     - `reference = "BL-" + YYYYMMDD(UTC now) + "-" + _id.toHexString().slice(-6).toUpperCase()`.
     - `requester.email` comes from the user record, never from the body.
     - Trim all strings.
     - `neededBy = new Date(Date.UTC(y, m-1, d))`.
  4. **Save.** `BusinessLetterRequestModel.create(...)`. On duplicate-key error (`code 11000`), regenerate `_id`/`reference` and retry once.
  5. **Respond and notify.** `this.setStatus(201)`, return `createSuccessResponse(mapBusinessLetterRequest(doc), "Business letter request submitted")`. Call `void notifyLeadership(doc)` before returning, without awaiting it.
  6. **Handle errors.** Wrap the method in try/catch; on unexpected errors return 500 `INTERNAL_ERROR`.

  **Body type:** declare the optional fields (`requester.phone?`, `requester.company?`, `addressee.address?`) and do **not** include `requester.email`. Note: in testing, tsoa did **not** reject the extra nested `requester.email` (despite `noImplicitAdditionalProperties: "throw"`), so the server must, and does, ignore it and use the user record's email.

  Imports: `strictLimiter` from `src/middleware/ratelimiter.middleware.ts`, `authMiddleware` from `src/middleware/auth.middleware.ts`.
- [X] T007 [US1] In `src/controllers/businessLetter.controller.ts`, add a module-level `async function notifyLeadership(doc)`:
  1. **Build the email data** with the keys in `contracts/business-letter-email.contract.md`: `REFERENCE`, `REQUESTER_NAME`, `REQUESTER_EMAIL`, `REQUESTER_PHONE`, `REQUESTER_COMPANY`, `LETTER_TYPE`, `ADDRESSEE_ADDRESS`, `LANGUAGE`, `NEEDED_BY`, `SUBMITTED_AT`, `PURPOSE`.
     - Pass every value through `escapeHtml`; optional empty values become `—`.
     - `PURPOSE`: escape, then replace `\n` with `<br />`.
     - `NEEDED_BY`: `toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"})`.
     - `SUBMITTED_AT`: `toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Dubai"})`.
  2. **Send** with `await sendDynamicEmailToUser({ template_id: BUSINESS_LETTER_EMAIL_TEMPLATE_ID, email: BUSINESS_LETTER_RECIPIENTS.join(", "), data })`.
  3. **Record the result.** On success, `updateOne({_id},{$set:{"notification.status":"sent","notification.attemptedAt":new Date()}})`. On failure, `console.error` and set `status:"failed"`, `attemptedAt`, and `error: String(err?.message).slice(0,500)`.
  4. **Never throw.** Wrap the whole function in try/catch.
- [X] T008 [US1] Regenerate routes and swagger with `npm run tsoa:routes && npm run tsoa:spec`. The controller is picked up by the `src/controllers/*.ts` glob in `tsoa.json`. Confirm that `src/routes/routes.ts` registers `BusinessLetterController` and that `npx tsc --noEmit` passes.
- [X] T009 [P] [US1] Create `ui/src/api/businessLetter.ts`, following `ui/src/api/blog.ts`. Export `createBusinessLetterRequest(body: CreateBusinessLetterRequest)`, which POSTs to `/business-letters` and returns `res.data`. Import the types from `../../../src/types/businessLetter.types`.
- [X] T010 [P] [US1] Create `ui/src/Components/Dashboard/BusinessLetter/BusinessLetter.scss` and the identical `BusinessLetter.css`:
  - `.business-letter` section wrapper in the style of `.dash-section`.
  - Two-column grid on ≥ 992px (form | history), stacked below.
  - Form field spacing, an `.invalid-feedback` colour using `var(--ora)`, a character-counter style, and a history table style matching existing dashboard tables.
  - Use the existing CSS variables from `ui/src/index.scss` (`--bg2`, `--bdr`, `--ora`).
- [X] T011 [US1] Create `ui/src/Components/Dashboard/BusinessLetter/BusinessLetter.tsx` (default export `BusinessLetter`). It imports `./BusinessLetter.css` and renders `<div className="dash-section business-letter">` with `<div className="dash-header"><h3>Request a Business Letter</h3></div>` and a "New request" card containing a Formik form with a Yup schema mirroring T006:
  - **Contact fields:**
    - `requester.name` — prefilled from `useSelector((s: RootState) => s.auth.user)?.name`.
    - Email — read-only, shown from `user.email` and not submitted.
    - `requester.phone` — prefilled from `user.phone`.
    - `requester.company` — empty.
  - **Letter fields:**
    - `letterType` select, using `LETTER_TYPE_LABELS`.
    - `addressee.address` (optional).
    - `purpose` — `<textarea maxLength={2000}>` with an `n/2000` counter.
    - `neededBy` — `<input type="date" min={todayLocalISO}>`.
    - `language` — radio buttons English/German, default `en`.
  - **Submit:** the button is disabled while `isSubmitting`. On success, `useToast().show({type:"success", message:`Request submitted – ${reference}`})`, then `resetForm` back to the prefilled values. On error, show a toast with `err.response?.data?.message`. Map a 400 `error.details` to Formik `setErrors`.
  - **Plain text only:** never use `dangerouslySetInnerHTML`.
  - **Payload:** build it explicitly from the form values. Don't send the read-only email or any UI-only fields.
  - Expose an `onCreated` hook point (e.g. a `refreshKey` state) so US2 can refresh the history.
- [X] T012 [US1] Register the tab in `ui/src/Pages/Dashboard/Dashboard.tsx`:
  - Add `"business_letter"` to the `MenuItem` union, with `accessControl.business_letter = ["user","admin","procurement"]` and `menuTitles.business_letter = "Request a Business Letter"`.
  - Add it to the `isValidMenuItem` array, and set `componentMap.business_letter = <BusinessLetter />` (import from `@/Components/Dashboard/BusinessLetter/BusinessLetter`).
  - Place the key right after `events` in `componentMap` so the menu shows it next to Events.
- [ ] T013 [US1] Validate US1 using quickstart.md Scenarios B, C and D. Use `BUSINESS_LETTER_RECIPIENTS=<your test address>`, and make template `6ac4970fe31c56f3436780a0` available locally: copy the document with the same `_id` into local `emailtemplates`, or set `BUSINESS_LETTER_EMAIL_TEMPLATE_ID`. Check that every placeholder in the received email has been replaced.
  - **Status (2026-10-06)**: API checks passed against local DB: 201 + `BL-…` reference, 400 `VALIDATION_ERROR` details, 401 without a cookie, `notification.status = "failed"` with a fake template id (Scenario D). Every template placeholder is covered by the email data. **Still open**: the browser check of the menu for all three roles, and receiving a real email from template `6ac4970fe31c56f3436780a0`. No email was sent during implementation.

**Checkpoint**: Members of any role can submit requests and leadership is notified. The MVP is shippable.

---

## Phase 4: User Story 2 - View and download past requests (Priority: P2)

**Goal**: The section lists the user's own requests (newest first), and each one downloads as `<reference>.pdf`.

**Independent Test**: quickstart.md Scenarios E and F. History is ordered with an empty state, the PDF downloads and matches the submission (umlauts OK), and other users' ids return 404.

### Implementation for User Story 2

- [X] T014 [P] [US2] Create `src/services/businessLetterPdf.ts` exporting `async function buildBusinessLetterPdf(dto: BusinessLetterRequestDto): Promise<Uint8Array>` using `pdf-lib`:
  - **Page and fonts:** A4 (595×842), with `StandardFonts.Helvetica` and `HelveticaBold`.
  - **Header:** a `#C8541A` bar with white "German Industry Club" and the subtitle "Business Letter Request".
  - **Reference block:** reference in `#D9B144`, plus the submitted date.
  - **Sections:**
    - Requester: name, email, phone, company.
    - Letter details: type label, address, language, needed by.
    - Purpose: word-wrapped to the content width with `font.widthOfTextAtSize`. Add a new page if the text overflows.
  - **Footer:** `© {year} German Industry Club` and the reference.
  - **Text cleaning:** run every string through `toWinAnsi(s)` first. It keeps characters that `font.encodeText` accepts (test each char in try/catch, or use a regex for ` -~ -ÿ` plus `€–—‘’“”•`) and replaces the rest with `?`, so umlauts survive and Arabic text doesn't throw.
  - Show empty optional values as `—`.
- [X] T015 [US2] Add `@Get("/")` to `src/controllers/businessLetter.controller.ts`, with `@Middlewares(authMiddleware)` and `@Query() limit = 20, @Query() skip = 0`:
  - Clamp `limit` to 1–100 and `skip` to ≥ 0, as in `contactus.controller.ts`.
  - Filter `{ userId: toObjectId(userId) }`, sort `{ createdAt: -1 }`, using `Promise.all` of `find().skip().limit().lean()` and `countDocuments`.
  - Return `createSuccessResponse({ items: docs.map(mapBusinessLetterRequest), total, page, pages }, "Business letter requests fetched")`.
- [X] T016 [US2] Add `@Get("/{id}/pdf")` to `src/controllers/businessLetter.controller.ts` with `@Middlewares(authMiddleware)`:
  - Return 404 `NOT_FOUND` if `!ObjectId.isValid(id)`. Otherwise `findOne({ _id: new ObjectId(id), userId: toObjectId(userId) }).lean()`, and return 404 if not found (don't distinguish "not yours").
  - Build the PDF with `buildBusinessLetterPdf(mapBusinessLetterRequest(doc))`.
  - Set `this.setHeader("Content-Type","application/pdf")` and `this.setHeader("Content-Disposition", `attachment; filename="${doc.reference}.pdf"`)`.
  - **`return Readable.from(Buffer.from(bytes))`** (`import { Readable } from "stream"`). A `Buffer` would be JSON-serialised by tsoa (research R10).
  - On failure, return 500 `PDF_ERROR`.
  - Then re-run `npm run tsoa:routes && npm run tsoa:spec`.
- [X] T017 [P] [US2] Add to `ui/src/api/businessLetter.ts`:
  - `listBusinessLetterRequests({ limit = 20, skip = 0 } = {})` → `GET /business-letters?limit&skip`, returning `res.data.data`.
  - `downloadBusinessLetterPdf(id: string, reference: string)` → `axiosInstance.get(`/business-letters/${id}/pdf`, { responseType: "blob" })`, then `URL.createObjectURL`, a temporary `<a download={`${reference}.pdf`}>` click, and `revokeObjectURL`. Same pattern as `ui/src/Components/EconomicInsights/EconomicInsights.tsx` ~line 137.
- [X] T018 [US2] Add a "My requests" card to `ui/src/Components/Dashboard/BusinessLetter/BusinessLetter.tsx`:
  - Fetch with `listBusinessLetterRequests` on mount and whenever `refreshKey` changes (bumped after a successful submit in T011). Show `<Loader />` from `@/Components/Loader/Loader` while loading.
  - Table columns: Reference · Submitted (`en-GB` date) · Letter type (`letterTypeLabel`) · Needed by · a Download button.
  - The Download button calls `downloadBusinessLetterPdf` and is disabled while that row is downloading. Show an error toast on failure.
  - Empty state: "You haven't requested any business letters yet."
  - If `total > items.length`, show a "Load more" button that increases `skip`.
- [ ] T019 [US2] Validate US2 using quickstart.md Scenarios E and F, including the curl isolation checks with two accounts and the umlaut check in the PDF.
  - **Status (2026-10-06)**: API checks passed: newest-first list, empty list for a second user, `BL-….pdf` download with correct headers, umlauts/ß rendered (Arabic → `?` as designed), 404 for another user's id and for a malformed id. **Still open**: clicking Download PDF in the browser.

**Checkpoint**: US1 and US2 both work.

---

## Phase 5: User Story 3 - Events split into Upcoming and Past (Priority: P3)

**Goal**: Dashboard → Events shows "Upcoming Events" and "Past Events" groups. Events without an image show the GIC logo blurred at 4px.

**Independent Test**: quickstart.md Scenario A.

### Implementation for User Story 3

- [X] T020 [P] [US3] In `ui/src/Components/Dashboard/Events/Events.tsx`, add a module-level pure helper `splitEventsByDate(events: Event[], now = new Date()): { upcoming: Event[]; past: Event[] }`:
  - Parse `event_date` as a local day: if it matches `/^(\d{4})-(\d{2})-(\d{2})/`, use `new Date(y, m-1, d)`; otherwise use `new Date(event_date)`. An invalid or missing date gives `null`.
  - `startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())`.
  - Past means `day < startOfToday`; everything else, including `null`, is upcoming.
  - Sort upcoming ascending with `null` last, and past descending.
- [X] T021 [US3] In `ui/src/Components/Dashboard/Events/Events.tsx`:
  1. **Swap the fallback image.** `import gicLogo from "../../../../public/gic-logo-main.png"`, the same way `Navbar.tsx` imports the logo. Change `getEventImageUrl` to return `null` when `!p?.Image` and delete the `german-emirates-club.com` fallback URL.
  2. **Extract the card.** Move the card JSX into a local `renderEventCard(p: Event, showUpcomingBadge: boolean)`. When the URL is `null`, render `<div className="card-bg-image card-bg-image--fallback w-100 h-100 position-absolute top-0 start-0" style={{ backgroundImage: `url("${gicLogo}")` }} />`; otherwise render the existing image/video markup. Render the pulsing `newEvent` badge only when `showUpcomingBadge && isUpcoming`.
  3. **Render the groups.** Replace the single `.products` grid with `const { upcoming, past } = useMemo(() => splitEventsByDate(events), [events])`, then two `<section className="events-group">` blocks:
     - `<h4 className="events-group__title">Upcoming Events</h4>` + `.products row mt-2` grid of `renderEventCard(p, true)`, or `<p className="events-group__empty">No upcoming events.</p>`.
     - `<h4 className="events-group__title">Past Events</h4>` + `renderEventCard(p, false)`, or `<p className="events-group__empty">No past events.</p>`.
  4. **Keep** the overall "No event found." message for when `events` is empty.
  5. Import `useMemo`.
- [X] T022 [P] [US3] Make the same edits in `ui/src/Components/Dashboard/Events/Events.scss` and `ui/src/Components/Dashboard/Events/Events.css`:
  - Add `$event-fallback-blur: 4px;` (in the `.css`, write `4px` literally).
  - `.card .card-bg-image--fallback { background-size: contain; background-repeat: no-repeat; background-position: center; background-color: var(--bg2); filter: blur(4px); transform: scale(1.08); }` inside `.economic-insights .products`.
  - `.events-group { margin-top: 1.5rem; }`, `.events-group__title { color: var(--ora); font-weight: 600; margin-bottom: .5rem; }`, `.events-group__empty { opacity: .7; }`.
  - Confirm `.card` keeps `overflow: hidden` so the scaled blur stays clipped.
- [ ] T023 [US3] Validate US3 using quickstart.md Scenario A: grouping, ordering, today counted as upcoming, the blurred logo on image-less cards, sharp title and date, and no badge on past cards. Check both desktop and ≤ 768px widths.
  - **Status (2026-10-06)**: `splitEventsByDate` was unit-checked: today and tomorrow are upcoming, undated/invalid go last, and past is sorted most recent first. The Vite dev server compiles `Events.tsx`. **Still open**: the visual check of the blurred-logo cards (Chrome extension not connected).

**Checkpoint**: All three user stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T024 Run `npm run build` (repo root: tsoa routes + spec + `tsc`) and `cd ui && npm run build`. Fix any type errors in the new or edited files.
- [X] T025 [P] Add "Request a Business Letter" (Members & Access, all roles) to `documentation/features-ownership.md`, and note the Upcoming/Past split in the Events row.
- [X] T026 [P] Document the optional env vars `BUSINESS_LETTER_RECIPIENTS` and `BUSINESS_LETTER_EMAIL_TEMPLATE_ID` in `README.md`: production defaults, and their use in dev/testing.
- [X] T027 Run quickstart.md Scenario G (6th POST within a minute → 429) and the XSS check in Scenario C step 7: text shows literally in the history table, the email and the PDF.
- [ ] T028 Pre-release check: in production, confirm that `emailtemplates` `_id 6ac4970fe31c56f3436780a0` contains every placeholder in `contracts/business-letter-email.contract.md` and the subject `New Business Letter Request – {{REFERENCE}}`. Confirm `BUSINESS_LETTER_RECIPIENTS` and `BUSINESS_LETTER_EMAIL_TEMPLATE_ID` are unset in the production env.
  - **Still open**: needs production DB access.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none. T001–T003 run in parallel.
- **Foundational (Phase 2)**: T004 needs T002 (types). T005 needs nothing. **Blocks US1 and US2.**
- **US1 (Phase 3)**: needs Phases 1–2.
- **US2 (Phase 4)**: needs Phase 2. The backend (T014–T016) can start in parallel with US1, but T015/T016 edit the same controller file as T006/T007, so do them after T007. T018 extends the component from T011.
- **US3 (Phase 5)**: **no dependencies.** It can run any time, in parallel with everything else.
- **Polish (Phase 6)**: after the stories you're shipping.

### Within each story

- US1: T006 → T007 → T008 (backend); T009 ∥ T010 → T011 → T012 (UI); T013 last.
- US2: T014 ∥ T017; then T015 → T016 (same file); T018 after T017 and T011; T019 last.
- US3: T020 ∥ T022; then T021 (needs T020); T023 last.

### Parallel Opportunities

```text
Kick-off (3 parallel tracks):
  Track A: T001, T002, T003 → T004, T005           (foundation)
  Track B: T020, T022 → T021 → T023                (US3, independent)

After foundation:
  Backend: T006 → T007 → T008 → T015 → T016
  PDF:     T014                                     (parallel with backend)
  UI:      T009 + T010 → T011 → T012 ; T017 → T018
```

---

## Implementation Strategy

### MVP first (US1)

1. Phases 1–2 (T001–T005)
2. Phase 3 (T006–T013) → members can submit and leadership is notified → **ship**

### Incremental delivery

1. MVP (US1)
2. + US2 history & PDF download (T014–T019)
3. + US3 events split (T020–T023). This can also ship first, because it's independent and lowest risk.
4. Polish (T024–T028) before the production release

### Notes

- No new npm dependencies are needed: `pdf-lib`, `formik`, `yup` and `mongodb` are already installed.
- Don't modify the production template record. The code only reads it by id.
- Commit after each checkpoint.
