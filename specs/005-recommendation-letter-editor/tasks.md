---

description: "Task list for Recommendation Letter Editor"
---

# Tasks: Recommendation Letter Editor

**Input**: Design documents from `/specs/005-recommendation-letter-editor/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/recommendation-letters.api.md](./contracts/recommendation-letters.api.md), [quickstart.md](./quickstart.md)

**Tests**: The spec does not ask for automated tests, and the repo has no test runner. Each story is validated through the [quickstart.md](./quickstart.md) scenarios listed in its checkpoint.

**Organization**: Tasks are grouped by user story:
- **US1**: list requests and edit the prefilled letter
- **US2**: View and Download the PDF
- **US3**: Send by email

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- Paths are relative to the repo root. The API is in `src/` and the UI is in `ui/src/`.

## Conventions every task follows

- **Controllers**: tsoa, `createSuccessResponse` / `createErrorResponse` from `src/utils/helpers.ts`, `this.setStatus()`, and `@Middlewares(adminOnlyMiddleware)` from `src/middleware/adminauth.middleware.ts` on **every** method. Pattern: `src/controllers/eventAdmin.controller.ts`.
- **Admin identity**: `toObjectId((req as any).user?.userId)` (`src/mappers/objectId.mapper.ts`).
- **Error codes** (exact, from the contract): `INVALID_ID`, `NOT_FOUND`, `VALIDATION_ERROR`, `PDF_ERROR`, `LETTER_NOT_SAVED`, `SEND_FAILED`, `INTERNAL_ERROR`.
- **PDF responses**: stream with `Readable.from(Buffer.from(bytes))` and set `Content-Type` / `Content-Disposition` with `this.setHeader`, as `downloadBusinessLetterPdf` in `src/controllers/businessLetter.controller.ts` does.
- **UI types**: import from `../../../src/types/recommendationLetter.types`, adjusting the number of `../` to the file's depth.
- **Styles**: edit `.scss` and hand-update the matching `.css`; there is no sass build step.
- **Letter wording**: lives only in `src/services/recommendationLetterText.ts`. The PDF builder and controller import it and never duplicate it.

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Ship runtime assets in `dist/` (research R11):
  - Copy the logo: `mkdir -p src/assets && cp ui/public/gic-logo-main-light.png src/assets/gic-logo.png`.
  - In `package.json`, add the script `"copy-assets": "mkdir -p dist/email_templates dist/assets && cp -R src/email_templates/. dist/email_templates/ && cp -R src/assets/. dist/assets/"`, and change `"build"` to `"rm -rf dist && npm run tsoa:routes && npm run tsoa:spec && tsc && npm run copy-assets"`.
  - Run `npm run build` and confirm `dist/assets/gic-logo.png` and `dist/email_templates/event_attendance_confirmation.html` exist.
- [X] T002 [P] Create `src/types/recommendationLetter.types.ts` with the contract's DTO block exactly: `LetterStatus`, `LetterFields`, `LetterRequestListItem` and `LetterRequestDetail`. Also export:
  - `LETTER_FIELD_KEYS: (keyof LetterFields)[]`, in form order: `recipientCompany`, `recipientStreet`, `recipientCity`, `recipientCountry`, `letterDate`, `companyName`, `reference`, `salutation`, `companyLocation`, `industry`, `productsServices`, `projectName`, `closing`.
  - `LETTER_STATUS_LABELS: Record<LetterStatus, string>`: New, Draft, Sent, Send failed.

  Use plain interfaces only (the UI imports this file), and make `LetterFields` an exported interface so tsoa can use it as a request body.
- [X] T003 [P] Create `src/config/recommendationLetterConfig.ts`:
  - `SIGNATORIES = [{ name: "Jan A Hussing", title: "Chairman" }, { name: "Thomas Hochberger", title: "General Manager" }] as const`.
  - `SENDER_LINES = ["German Industry Club", "Building C1, Office 1208", "Ajman FreeZone, Ajman, UAE", "E-Mail: info@german-industry-club.com"]`.
  - `RUNNING_HEADER = "German Industry Club – Building C1, Office 1208, Ajman FreeZone, Ajman, UAE"`.
  - `DELIVERY_TEMPLATE_NAME = "recommendation_letter_delivery"`.
  - `LETTER_TIMEZONE = "Asia/Dubai"`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: All three stories need these.

- [X] T004 Edit `src/models/businessLetterRequest.model.ts` (depends on T002). Add optional nested paths to the schema:
  - `letter`: every `LetterFields` key as `{ type: String, trim: true, default: undefined }` with the data-model length limits as `maxlength`, plus `savedBy: { type: ObjectId, ref: "User" }` and `savedAt: Date`.
  - `delivery`: `status` (enum `sent|failed`), `sentAt`, `sentBy` (ObjectId → User), `sentTo`, `attemptedAt`, `count` (Number, default 0), `error` (String, maxlength 500).

  Use `default: undefined` on the parent paths (`letter: { type: new Schema({...}, { _id: false }), default: undefined }`) so requests without a draft stay without one. Add the index `BusinessLetterRequestSchema.index({ createdAt: -1 })`. Don't change `mapBusinessLetterRequest` (the member DTO stays as it is).
- [X] T005 [P] Create `src/services/pdfText.ts` by **moving** `toWinAnsi` and `wrapText` out of `src/services/businessLetterPdf.ts`, unchanged and exported. In `businessLetterPdf.ts`, import them from `./pdfText`. Its behaviour must stay identical: the member PDF from feature 001 renders as before.
- [X] T006 Create `src/services/recommendationLetterText.ts` (depends on T002 and T003):
  - **`LIMITS`**: `{ recipientCompany: 160, recipientStreet: 200, recipientCity: 120, recipientCountry: 120, companyName: 160, reference: 200, salutation: 160, companyLocation: 80, industry: 200, productsServices: 300, projectName: 200, closing: 1000 }`.
  - **`DEFAULT_CLOSING`** = "We wish the company every success in pursuing this opportunity and its future business development."
  - **`todayInDubai(): string`**: returns `YYYY-MM-DD`, using `Intl.DateTimeFormat("en-CA", { timeZone: LETTER_TIMEZONE })`.
  - **`buildDefaultLetter(request): LetterFields`** (research R3):
    - Split `addressee.address` on `/\r?\n|,/`, trimming and dropping empty parts.
    - Map the parts in order to `recipientCompany`, `recipientStreet` and `recipientCity`. Join any remaining parts with ", " into `recipientCountry`. Missing parts become "".
    - `companyName` = `requester.company`.
    - `projectName` = the first line of `purpose`, cut to 200 characters.
    - `letterDate` = `todayInDubai()`.
    - `salutation` = "Dear Sir or Madam,".
    - `reference` = "RFQ, Tender, Project".
    - `companyLocation` = "Dubai-based".
    - `industry` = "", `productsServices` = "".
    - `closing` = `DEFAULT_CLOSING`.
  - **`validateLetter(input: Partial<LetterFields>, mode: "preview" | "save")`**:
    - Returns `{ value?: LetterFields, errors: Record<string, string> }`.
    - Trim every string. Non-strings count as "".
    - Enforce `LIMITS` ("<Label> must be at most N characters").
    - `letterDate` must match `^\d{4}-\d{2}-\d{2}$` and be a real calendar day (reuse the overflow check approach of `isValidEventDate` in `src/models/event.model.ts`).
    - Required in both modes: `companyName` (min 2), `salutation`, `companyLocation`, `projectName`, `closing`.
    - Required only when `mode === "save"`: `industry`, `productsServices`.
    - Label each field for messages: "Company name", "Recipient company", and so on.
  - **`buildSections(f: LetterFields): { heading: string; paragraphs: string[] }[]`**: the three template sections, with the values substituted. The wording comes verbatim from the template:
    1. "1. Company Introduction & Business Relationship":
       - "On behalf of the German Industry Club, we are pleased to provide this letter of recommendation for ${companyName}, a ${companyLocation} company operating in the ${industry} across the Middle East and Africa (MEA) region."
       - "The company specializes in ${productsServices} and demonstrates a strong commitment to professional business practices, customer-oriented solutions, and the development of sustainable international business relationships."
    2. "2. German Emirates Club Membership & German Quality Standards":
       - "As a valued member of the German Emirates Club, ${companyName} is part of an established business network connecting German and international companies, industry professionals, and decision-makers across the UAE and the wider MEA region."
       - "Through its membership, ${companyName} demonstrates its commitment to these principles and to fostering professional cooperation, international knowledge exchange, and sustainable business development."
    3. "3. Project Reference & Recommendation":
       - "With regard to ${projectName}, we are pleased to support ${companyName} in its efforts to contribute its expertise and capabilities to this initiative."
       - "Based on our professional relationship and understanding of the company's business activities, we consider ${companyName} a suitable organization for consideration in connection with this project."
       - "We welcome the opportunity for ${companyName} to contribute to the successful implementation of this initiative and further strengthen business cooperation within the region."

    In preview mode, an empty `industry` or `productsServices` renders as "[industry]" / "[products/services]", so the gap is visible in the PDF.
  - **`letterStatus(doc): LetterStatus`** (data-model → Derived), and **`toListItem(doc)`** / **`toDetail(doc, savedByName?)`** mappers producing the contract DTOs:
    - `editedSinceSent` = `!!(letter?.savedAt && delivery?.sentAt && letter.savedAt > delivery.sentAt)`.
    - `toDetail.letter` = the saved `letter` fields if present, otherwise `buildDefaultLetter(doc)`.
    - `isDraftSaved` = `!!doc.letter`.

**Checkpoint**: `npx tsc --noEmit -p .` passes, and the feature 001 member PDF still downloads unchanged.

---

## Phase 3: User Story 1 - Admin reviews requests and edits the letter (Priority: P1) 🎯 MVP

**Goal**: The admin-only tab shows requests on the left and a prefilled, savable letter form on the right.

**Independent Test**: Quickstart scenarios 1–6.

- [X] T007 [US1] Create `src/controllers/recommendationLetterAdmin.controller.ts` with `@Route("api/v1/admin/letter-requests") @Tags("Recommendation Letters Admin") export class RecommendationLetterAdminController extends Controller` (depends on T004 and T006). Every method uses `@Middlewares(adminOnlyMiddleware)`.
  - **`GET /`**: `BusinessLetterRequestModel.find().sort({ createdAt: -1 }).limit(500).lean()`, mapped with `toListItem`, returned as `{ items, total }`.
  - **`GET /{id}`**:
    - Return 400 `INVALID_ID` for an invalid id, or 404 `NOT_FOUND` if the request doesn't exist.
    - Populate `letter.savedBy` with `name`, or load the user by id.
    - Return `toDetail`.
  - **`PUT /{id}/letter`**:
    - `@Body() body: LetterFields`, run through `validateLetter(body, "save")`.
    - On errors, return 400 `VALIDATION_ERROR` with the errors as `details`.
    - Otherwise `updateOne({ _id }, { $set: { letter: { ...value, savedBy: adminId, savedAt: new Date() } } })`. If 0 documents matched, return 404.
    - Return the detail with the message "Letter saved".
- [X] T008 [US1] Run `npm run build` (tsoa regenerates `src/routes/routes.ts` and `src/swagger/swagger.json`) and confirm the three routes exist (depends on T007). Fix any tsoa body-type errors.
- [X] T009 [P] [US1] Create `ui/src/api/recommendationLetters.ts` using `axiosInstance` (depends on T002):
  - `listLetterRequests(): Promise<LetterRequestListItem[]>`, which throws if `data.items` isn't an array (same guard as `itemsOf` in `ui/src/api/events.ts`)
  - `getLetterRequest(id): Promise<LetterRequestDetail>`
  - `saveLetter(id, fields): Promise<LetterRequestDetail>`
  - `apiErrorMessage` and `apiFieldErrors`, re-exported from `@/api/events`
- [X] T010 [P] [US1] Create `ui/src/Components/Dashboard/RecommendationLetters/LetterRequestList.tsx`:
  - **Props**: `{ items: LetterRequestListItem[]; selectedId: string | null; onSelect(id): void; onSend?(item): void; busyId?: string | null }`.
  - **Row content**: the reference (monospace), company (bold, or "—"), requester name and email (muted), "Needed by dd MMM yyyy", and a status badge `rl-status rl-status--<letterStatus>` showing `LETTER_STATUS_LABELS[...]`.
  - **Extra tags**: append " · dd MMM" to Sent, add an "edited since" tag when `editedSinceSent`, and a "DE requested" tag when `language === "de"`.
  - **Behaviour**: the selected row has the class `is-selected`, and clicking a row calls `onSelect`.
  - **Send**: render the Send button only when `onSend` is provided (US3 wires it), with `onClick` calling `e.stopPropagation()`.
  - **Empty state**: "No letter requests yet."
- [X] T011 [US1] Create `ui/src/Components/Dashboard/RecommendationLetters/LetterEditor.tsx` (depends on T009):
  - **Props**: `{ detail: LetterRequestDetail; onSaved(detail): void; onDirtyChange(dirty: boolean): void; notify }`. Pass `notify` like `EventForm` does, or use `useToast` if the editor isn't inside a modal (it isn't, so use `useToast()` directly).
  - **Form**: Formik with `initialValues = detail.letter` and `enableReinitialize: false`; the parent remounts it with `key`.
  - **Yup schema** mirroring `validateLetter` save mode: the same limits and required fields.
  - **Field groups**, using Bootstrap `form-control`:
    - **Recipient**: 4 inputs.
    - **Letter**: date input, reference, salutation.
    - **Company**: company name, location, industry, products/services, project / opportunity.
    - **Closing**: a textarea with 4 rows.
  - **Character warning**: under any field whose value matches `/[^\x00-\xFF‘’“”–—…€•]/`, show the hint "Some characters can't be printed in the PDF and will appear as “?”".
  - **Header**: `detail.reference` and "for <requester name> (<email>)". The line `isDraftSaved ? "Last saved by <savedBy.name> at <dd MMM yyyy, HH:mm>" : "Not saved yet"`.
  - **Save button**:
    - Calls `saveLetter`, shows the toast "Letter saved", then calls `onSaved(updated)`.
    - On 400, map `apiFieldErrors` to `setErrors` and show an error toast.
    - Disabled while submitting.
  - **Dirty tracking**: `useEffect(() => onDirtyChange(dirty), [dirty])`.
  - **US2 buttons**: leave a `<div className="rl-editor__actions">` holding the Save button; T019 adds View and Download there.
- [X] T012 [US1] Create `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.tsx` plus `RecommendationLetters.scss` and a hand-written matching `RecommendationLetters.css` (depends on T010 and T011):
  - **Wrapper**: `<div className="dash-section recommendation-letters">` with `<h3>Recommendation Letters</h3>`.
  - **Grid**: a `.rl-grid` CSS grid, 1 column below 992 px and `minmax(0,5fr) minmax(0,7fr)` at ≥ 992 px. Copy the `.bl-grid` rules from `ui/src/Components/Dashboard/BusinessLetter/BusinessLetter.scss`.
  - **State**: `items`, `selectedId`, `detail`, `loadingDetail` and `dirtyRef` (a ref updated by `onDirtyChange`).
  - **Loading**: load the list on mount, with Loader and Retry like `EventsTable.tsx`.
  - **`select(id)`**:
    1. If `dirtyRef.current`, `await confirm({ title: "Unsaved changes", message: "Discard your unsaved changes to this letter?", confirmText: "Discard", cancelText: "Keep editing" })`. Return if declined.
    2. `setSelectedId(id)`, then `setDetail(await getLetterRequest(id))`.
  - **Right column**:
    - No selection: "Select a request to edit its letter."
    - Loading: `<Loader/>`.
    - Otherwise: `<LetterEditor key={detail.id + (detail.savedAt ?? "")} detail={detail} …/>`.
  - **`onSaved`**: replace `detail` and refresh the list, so the status changes to Draft.
  - **Styles**: `.rl-status` badges (new: grey, draft: amber `#b7791f`, sent: green `#2f855a`, failed: red `#9b2c2c`), `.is-selected` (a left border in `var(--ora)` and a tinted background) and `.rl-list` max-height with scroll at ≥ 992 px. Reuse the dashboard card look of `ManageEvents.scss` (`bm-card`).
- [X] T013 [US1] Edit `ui/src/Pages/Dashboard/Dashboard.tsx` (depends on T012): add `"recommendation_letters"` to the `MenuItem` union, `accessControl` (`["admin"]`), `menuTitles` (`"Recommendation Letters"`), the `isValidMenuItem` list and `componentMap` (`<RecommendationLetters />`). Put it right after `manage_events` in every list, so the sidebar order groups the admin tools together.

**Checkpoint**: Quickstart scenarios 1–6 pass.

---

## Phase 4: User Story 2 - View and download the PDF (Priority: P1)

**Goal**: The server renders the letter as the template's A4 PDF, which the admin can view in a new tab or download, from the form's current values.

**Independent Test**: Quickstart scenarios 7–10 and 17.

- [X] T014 [US2] Create `src/services/recommendationLetterPdf.ts`, exporting `buildRecommendationLetterPdf(fields: LetterFields, reference: string): Promise<Uint8Array>` (depends on T005 and T006). Follow the contract's "PDF layout" table:
  - **Setup**: `PDFDocument.create()`, title `Letter of Recommendation – ${companyName}`, author "German Industry Club". Embed Helvetica and HelveticaBold.
  - **Text cleaning**: `clean = (s) => toWinAnsi(regular, s)` for **every** drawn string.
  - **Page geometry**: A4 595.28 × 841.89. `MARGIN_X = 71`, `TOP = 841.89 - 60`, `BOTTOM = 50`.
  - **Logo**: read once from `path.join(__dirname, "..", "assets", "gic-logo.png")` with `fs.promises.readFile`, cached in a module-level promise. Embed with `embedPng` and draw it 140 pt wide, top right of page 1.
  - **Page 1 blocks** (cursor `y` starting below the logo):
    - Recipient lines (left, skipping empty ones) and sender lines (right-aligned, 9 pt).
    - Blank line, then `Date: <letterDate>`.
    - Blank line, then bold `Subject: Letter of Recommendation – <companyName>`.
    - `Reference: <reference>`, if non-empty.
    - Blank line, then `<salutation>`.
    - For each of `buildSections(fields)`: the bold 11 pt heading, then the paragraphs wrapped with `wrapText(…, 11, CONTENT_WIDTH)` at 15 pt leading and 6 pt between paragraphs.
    - Then `closing`, "Yours sincerely,", and bold "German Industry Club".
  - **Signature block**: two columns at `MARGIN_X` and `MARGIN_X + CONTENT_WIDTH/2`. Leave 50 pt of blank signature space, draw a 0.5 pt rule 150 pt wide, then the bold name (`SIGNATORIES[i].name`) and the title. Before drawing, call `ensureSpace(totalHeight)` so it never splits.
  - **`ensureSpace(h)`**: if `y - h < BOTTOM + 20`, add a new page and set `y = 841.89 - 70`.
  - **Final pass** over `pdf.getPages()`:
    - `RUNNING_HEADER` at 8 pt grey `rgb(0.47,0.47,0.47)`, centred at y = 841.89 − 30.
    - `${i+1} / ${n}`, centred at y = 25.
  - **Return**: `pdf.save()`.
- [X] T015 [US2] Add to `src/controllers/recommendationLetterAdmin.controller.ts` (depends on T007 and T014): `@Post("/{id}/letter/pdf")` with `@Body() body: LetterFields` and `@Query() disposition?: string`.
  - Load the request (400 / 404 as in T007).
  - `validateLetter(body, "preview")`; on errors return 400 `VALIDATION_ERROR` with the details.
  - `buildRecommendationLetterPdf(value, doc.reference)`.
  - Set `Content-Type: application/pdf` and `Content-Disposition: ${disposition === "inline" ? "inline" : "attachment"}; filename="${doc.reference}.pdf"`.
  - Return `Readable.from(Buffer.from(bytes))`.
  - On a throw, log it and return 500 `PDF_ERROR` "Failed to generate the PDF".
- [X] T016 [US2] Run `npm run build` and confirm the PDF route is registered (depends on T015). Generate a sample PDF with curl as admin (quickstart scenario 8) and open it: check the logo, blocks, header, footer and signatures.
- [X] T017 [P] [US2] Add `fetchLetterPdf(id, fields, disposition: "inline" | "attachment"): Promise<Blob>` to `ui/src/api/recommendationLetters.ts`: `axiosInstance.post(\`/admin/letter-requests/${id}/letter/pdf\`, fields, { params: { disposition }, responseType: "blob" })` → `new Blob([res.data], { type: "application/pdf" })` (depends on T009).
  - **Error case**: on a non-2xx, axios' blob error body hides the JSON error. In the catch, if `error.response?.data instanceof Blob`, parse `JSON.parse(await error.response.data.text())` and rethrow an object shaped like `ApiError` (`{ message, error: { code, details } }`), so `apiErrorMessage` and `apiFieldErrors` work.
- [X] T018 [US2] Edit `ui/src/Components/Dashboard/RecommendationLetters/LetterEditor.tsx` (depends on T011 and T017): add **View** and **Download PDF** buttons to `.rl-editor__actions`. Both first run `validateForm()` with the preview rules: a second Yup schema in which `industry` and `productsServices` are optional. If there are errors, `setTouched` on those fields and stop.
  - **View**:
    1. Synchronously in the click handler, `const tab = window.open("", "_blank")`. If it's null, show the toast "Allow pop-ups to view the PDF" and stop.
    2. Write `<p style="font-family:sans-serif">Generating PDF…</p>` into `tab.document`.
    3. `const blob = await fetchLetterPdf(detail.id, values, "inline")`, then `tab.location.href = URL.createObjectURL(blob)` and `setTimeout(() => URL.revokeObjectURL(url), 60000)`.
    4. On error: `tab.close()` and an error toast with `apiErrorMessage`. Map `apiFieldErrors` with `setErrors`.
  - **Download PDF**: `fetchLetterPdf(..., "attachment")`, then a temporary `<a download="${detail.reference}.pdf">` click, as in `downloadBusinessLetterPdf` in `ui/src/api/businessLetter.ts`.
  - **Busy state**: disable both buttons while a PDF is generating (`pdfBusy` state).

**Checkpoint**: Quickstart scenarios 7–10 pass. Scenario 17 runs in Polish.

---

## Phase 5: User Story 3 - Email the letter to the requester (Priority: P2)

**Goal**: The row's Send emails the saved letter's PDF from info@ to the requester and records the outcome.

**Independent Test**: Quickstart scenarios 11–16, with a member account whose email is a test inbox.

- [X] T019 [P] [US3] Edit `src/services/emailService.ts`: add `attachments?: EmailAttachment[]` to `DynamicEmailOptions`, and in `sendDynamicEmailDoc` pass `attachments: options.attachments` to `sendRawEmailWithAttachments`. Nothing else changes; existing callers pass no attachments.
- [X] T020 [P] [US3] Create `src/email_templates/recommendation_letter_delivery.html`, using the same themed layout as `src/email_templates/event_attendance_confirmation.html`:
  - **Header**: the orange bar reading "Your Letter of Recommendation".
  - **Text section**: "Dear {{REQUESTER_NAME}}," then "Please find attached the Letter of Recommendation from the German Industry Club for {{COMPANY_NAME}} regarding {{PROJECT_NAME}}."
  - **Reference section**: `{{REFERENCE}}`.
  - **Details section** "Letter Details": Company {{COMPANY_NAME}} · Project {{PROJECT_NAME}} · Date {{LETTER_DATE}}.
  - **Closing text**: "If you have any questions, simply reply to this email." and "Kind regards,<br />The German Industry Club Team".
  - **Footer**: `&copy; {{CURRENT_YEAR}} German Industry Club`.
- [X] T021 [US3] Create `src/services/emailTemplateProvisioning.ts` (depends on T020):
  - **Type**: `export interface EmailTemplateDefinition { name: string; subject: string; htmlFile: string; text: string; variables: string[] }`.
  - **`ensureEmailTemplate(def): Promise<void>`**:
    - Memoised per `def.name` in a `Map<string, Promise<void>>`. On rejection, delete the entry so the next call retries.
    - Read `path.join(__dirname, "..", "email_templates", def.htmlFile)` and run `getCollection("emailtemplates").updateOne({ name: def.name }, { $setOnInsert: { name, subject, html, text, variables, createdAt: now, updatedAt: now } }, { upsert: true })`.
    - Log "Email template created: <name>" when `upsertedCount > 0`.
  - **Definition**: also export `RECOMMENDATION_LETTER_DELIVERY: EmailTemplateDefinition`, with name `DELIVERY_TEMPLATE_NAME`, subject `Your Letter of Recommendation – {{COMPANY_NAME}} ({{REFERENCE}})`, `htmlFile` `recommendation_letter_delivery.html`, a one-paragraph `text`, and the variables from the data model.
- [X] T022 [US3] Add `@Post("/{id}/letter/send")` to `src/controllers/recommendationLetterAdmin.controller.ts` (depends on T015, T019 and T021):
  1. Load the request (400 / 404).
  2. If there's no `doc.letter`, return 409 `LETTER_NOT_SAVED` "Complete and save the letter before sending".
  3. `validateLetter(doc.letter, "save")`; on errors return 400 `VALIDATION_ERROR` with the details.
  4. `bytes = await buildRecommendationLetterPdf(value, doc.reference)`.
  5. `await ensureEmailTemplate(RECOMMENDATION_LETTER_DELIVERY)`.
  6. Build `vars = { REQUESTER_NAME, COMPANY_NAME, REFERENCE, PROJECT_NAME, LETTER_DATE }` and `htmlData` = the same values passed through `escapeHtml` (`src/utils/helpers.ts`).
  7. `await sendDynamicEmailDoc(DELIVERY_TEMPLATE_NAME, { ...vars, email: doc.requester.email }, { sender: "info", replyTo: process.env.SMTP_INFO_SENDER, htmlData, attachments: [{ filename: \`${doc.reference}.pdf\`, content: Buffer.from(bytes), contentType: "application/pdf" }] })`.
  8. **Success**: `updateOne` with `$set: { "delivery.status": "sent", "delivery.sentAt": now, "delivery.attemptedAt": now, "delivery.sentBy": adminId, "delivery.sentTo": email, "delivery.error": null }, $inc: { "delivery.count": 1 }`. Return the detail with the message `Letter sent to ${email}`.
  9. **Failure** (catch around steps 5–7): `$set` `delivery.status: "failed"`, `attemptedAt`, `sentBy`, `sentTo` and `error` (the message, cut to 500). Return 502 `SEND_FAILED` "Failed to send the letter: <message>" with `details: { error }`.
- [X] T023 [US3] Run `npm run build` and confirm the send route exists and `dist/email_templates/recommendation_letter_delivery.html` was copied (depends on T022).
- [X] T024 [P] [US3] Add `sendLetter(id): Promise<{ message: string; detail: LetterRequestDetail }>` to `ui/src/api/recommendationLetters.ts` (depends on T009).
- [X] T025 [US3] Wire Send in `ui/src/Components/Dashboard/RecommendationLetters/RecommendationLetters.tsx`: pass `onSend` and `busyId` to `LetterRequestList` (depends on T012 and T024). `send(item)`:
  1. If `item.letterStatus === "new"`, call `select(item.id)` and show the info toast "Complete and save the letter before sending". Return.
  2. If `item.id === selectedId && dirtyRef.current`:
     - `confirm({ title: "Unsaved changes", message: "Save your changes and send the letter to <email>?", confirmText: "Save & send" })`. Return if declined.
     - Call the editor's submit: expose `saveRef` from `LetterEditor` via a `submitRef` prop that resolves to the saved detail, or rejects on validation errors.
  3. Otherwise `confirm({ title: "Send letter", message: \`Email the letter (${item.reference}.pdf) to ${item.requester.email}?${item.letterStatus === "sent" && item.sentAt ? \` It was already sent on ${formatted}.\` : ""}\`, confirmText: "Send" })`.
  4. `setBusyId`, then `sendLetter`, then a success toast. On 409 `LETTER_NOT_SAVED`, select the row and show an info toast. Show any other error as a toast.
  5. Finally refresh the list, plus the detail if the row is selected.

  Add the `submitRef` prop to `LetterEditor.tsx` (it calls Formik's `submitForm()` and resolves with the save result).

**Checkpoint**: Quickstart scenarios 11–16 pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T026 [P] Run `npm run build` and `(cd ui && npm run build)`. The UI type-check (`npx tsc --noEmit -p ui/tsconfig.json`) must not add errors beyond the pre-existing count (65 on 2026-10-09).
- [X] T027 Run quickstart scenario 17: `npm run build`, then `PORT=<free port> node dist/server.js`, then View a letter. The PDF must render (the logo resolves from `dist/assets`). Confirm `dist/email_templates/` holds all three HTML files.
- [ ] T028 Run every scenario in `specs/005-recommendation-letter-editor/quickstart.md`. Send only to a member account whose email is a test inbox you own. Record the results under this task.
  - **Result (2026-10-09, API with curl against `node dist/server.js` on the local dev DB, with temporary users and requests removed afterwards)**:
    - **Passed** (scenarios 1–5, 7, 8, 11, 13–17 through the API):
      - a member gets 403
      - the list shows both requests, with the DE tag
      - prefill splits the multi-line address correctly
      - saving with industry/products empty returns 400 naming both fields
      - an incomplete preview is allowed (`inline`), and an invalid one returns 400
      - Send without a draft returns 409 `LETTER_NOT_SAVED`
      - Save returns "Letter saved", with `savedBy` set
      - Download returns `attachment; filename="<ref>.pdf"`
      - with SMTP failing, Send returns 502 `SEND_FAILED` and the row shows *failed*
      - with real SMTP, Send #1 and #2 reached the info@ mailbox and the count went 1 → 2
      - the delivery template was auto-created from `dist/email_templates`
      - the PDF contains the logo from `dist/assets`
    - **PDF layout**: checked visually from rendered pages (logo, recipient/sender blocks, sections, the signature block kept together on page 2 when the closing is long, header and "n / N" on every page). Arabic characters render as "?" without error.
    - **Not run** (they need a browser): scenarios 6, 7 and 12 in the UI (unsaved-changes guard, View opening a new tab, Save & send), and the toast and badge rendering.
- [ ] T029 [P] Check the tab at 375 px, 768 px and 1280 px: the columns stack below 992 px, long company names wrap in the list, and the form fits without horizontal scroll.
- [X] T030 [P] Add a line to `documentation/features-ownership.md` under the business letter entry: "Admins edit, preview, download (PDF) and email letters of recommendation in Dashboard → Recommendation Letters."

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T003)**: no dependencies. T002 and T003 run in parallel. T001 is independent.
- **Foundational (T004–T006)**: T004 and T006 depend on T002 (T006 also on T003). T005 is independent. All three block the stories.
- **US1 (T007–T013)**: depends on Phase 2.
- **US2 (T014–T018)**: the server side (T014–T016) depends only on Phase 2 plus T007 (the controller file). The UI side depends on T011.
- **US3 (T019–T025)**: depends on US1 (saved drafts) and on T014 (the PDF builder).
- **Polish (T026–T030)**: after the desired stories.

### Story Completion Order

```text
Setup → Foundational → US1 (list + editor + save) → US2 (view / download PDF) → US3 (send) → Polish
```

US2 can start in parallel with US1 on the server side (T014 needs only T005 and T006).

### Same-File Sequencing

- `src/controllers/recommendationLetterAdmin.controller.ts`: T007 → T015 → T022
- `ui/src/api/recommendationLetters.ts`: T009 → T017 → T024
- `LetterEditor.tsx`: T011 → T018 → T025 (adds `submitRef`)
- `RecommendationLetters.tsx`: T012 → T025

---

## Parallel Execution Examples

### Setup and Foundational

```text
Together: T001, T002, T003, T005
Then: T004 and T006 (after T002 and T003)
```

### User Story 1

```text
Server: T007 → T008
UI (in parallel with the server): T009 and T010 together → T011 → T012 → T013
```

### User Story 2

```text
Server: T014 (can start right after Phase 2) → T015 → T016
UI: T017 → T018
```

### User Story 3

```text
Together: T019, T020, T024
Then: T021 → T022 → T023; UI: T025
```

---

## Implementation Strategy

### MVP First (US1)

Phases 1–3 deliver the admin list and a saved, prefilled letter per request. That's useful on its own: the admin's work is stored and survives reloads.

### Incremental Delivery

1. **US1**: edit and save.
2. **US2**: View and Download. Admins can deliver letters by hand. This covers the client's two right-side buttons.
3. **US3**: email delivery from the list.
4. **Polish**: in particular T027, the production-layout check that guards against the `dist/` asset gap found in research R11.

### Notes

- Never read files from `ui/` or `process.cwd()` at runtime on the server. Use `__dirname`-relative paths into `src/assets` and `src/email_templates`, so they resolve to `dist/` in production.
- Every string drawn into the PDF goes through `toWinAnsi`. Every value in the email HTML goes through `escapeHtml`.
- Commit after each phase.
