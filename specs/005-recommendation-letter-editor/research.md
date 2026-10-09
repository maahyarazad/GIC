# Research: Recommendation Letter Editor

Phase 0 for [plan.md](./plan.md). The template was read from `Draft_Template for Letter of Recommendation.docx` in the repo root (unzipped, `word/document.xml`, headers and footer).

## R1 — Where the draft lives

- **Decision**: Add two optional subdocuments to the existing `BusinessLetterRequest` (collection `businessletterrequests`):
  - `letter`: the draft fields plus `savedBy`/`savedAt`
  - `delivery`: the send status, time, admin, count and error

  There is no new collection.
- **Rationale**: Exactly one letter belongs to each request and they're always read together. The list needs the delivery status for each row in one query. Optional subdocuments need no migration: old requests simply have no draft, so they're prefilled (R3).
- **Alternatives considered**: A separate `recommendationletters` collection. Rejected: it's a 1:1 relation and would need a join for every list row.

## R2 — Which values the editor exposes

- **Decision**: One input per placeholder in the template, plus the closing line. The fixed section wording (headings and sentences) lives in code and the values are substituted into it.

  | Field | Template source | Input |
  |---|---|---|
  | `recipientCompany`, `recipientStreet`, `recipientCity`, `recipientCountry` | address block "Company 123 / Street / City / Country" | 4 text inputs |
  | `letterDate` | "Date: 2026-10-09" | date input (stored `YYYY-MM-DD`, printed as in the template) |
  | `companyName` | "[Company Name]" in the subject and sections 1–3 (6 places) | text input |
  | `reference` | "Reference: RFQ, Tender, Project" | text input |
  | `salutation` | "Dear MS/Mr. XXXXXX," | text input |
  | `companyLocation` | "a **Dubai-based** company" | text input (default "Dubai-based") |
  | `industry` | "[industry/business sector]" | text input |
  | `productsServices` | "[products/services/solutions]" | text input |
  | `projectName` | "[Project Name / Business Opportunity]" | text input |
  | `closing` | "We wish the company every success…" | textarea |

- **Rationale**: The client asked to "modify the values". A value such as the company name appears 6 times, so one input that updates every place avoids inconsistent letters. Free-text paragraphs would drift from the fields.
- **Alternatives considered**:
  - Rich-text editing of the whole letter. Rejected: much bigger UI, and the PDF layout would have to interpret formatting.
  - Editable section paragraphs. Rejected: they compete with the value fields.

## R3 — Prefill ("every time the admin comes to this tab the values are prefilled")

- **Decision**: `GET /admin/letter-requests/{id}` always returns `letter`: the saved draft if there is one, otherwise `buildDefaultLetter(request)`:
  - `companyName` ← `requester.company`
  - recipient lines ← `addressee.address`, split on line breaks and commas into company / street / city / country, the remainder joined into the last line
  - `projectName` ← `purpose`, up to the first line break, max 200 characters
  - `letterDate` ← today (Asia/Dubai)
  - `salutation` ← "Dear Sir or Madam,"
  - `reference` ← "RFQ, Tender, Project", `companyLocation` ← "Dubai-based", `closing` ← the template sentence
  - `industry` and `productsServices` ← empty, so the admin must fill them

  The response flags `isDraftSaved: false`.
- **Rationale**: Defaults are computed on read, not stored, so a template wording change also reaches requests that were never edited. The UI always gets a complete form.

## R4 — PDF generation with pdf-lib

- **Decision**: A new service, `src/services/recommendationLetterPdf.ts`, exporting `buildRecommendationLetterPdf(letter, reference): Promise<Uint8Array>`. It is separate from feature 001's `businessLetterPdf.ts`, which stays the member's request summary.
  - **Page**: A4 (595.28 × 841.89 pt). The template margins are left/right 2.5 cm (71 pt), bottom 1.5 cm, and a 6 cm top margin on page 1 that leaves room for the letterhead.
  - **Fonts**: `StandardFonts.Helvetica` and `HelveticaBold` (the template uses Tahoma, which isn't a standard PDF font). Reuse `toWinAnsi` and `wrapText` from `businessLetterPdf.ts`, moving them into a shared `src/services/pdfText.ts`.
  - **Logo**: a copy of `ui/public/gic-logo-main.png` at `src/assets/gic-logo.png`, resolved relative to the compiled module (R11). pdf-lib embeds it even though it is interlaced (verified 2026-10-09). It is read once and cached.
  - **Every page**: the running header "German Industry Club – Building C1, Office 1208, Ajman FreeZone, Ajman, UAE" and the footer "n / N". These are drawn after layout, when the page count is known.
  - **Flow**: the cursor moves down the page and a new page starts whenever the next block doesn't fit. Section headings are bold. Paragraphs use 11 pt with 15 pt leading. The signature block (two columns, blank signature space, bold name, title) is kept together on one page.
- **Rationale**: pdf-lib is already a dependency (`^1.17.1`) and is what the client named. Laying the text out in code gives exact control and no runtime dependency on Word or LibreOffice.
- **Alternatives considered**:
  - Fill the .docx and convert it with LibreOffice. Rejected: it needs LibreOffice on the server.
  - Render HTML with Puppeteer. Rejected: a heavy dependency, and the client asked for pdf-lib.
- **Known limit**: characters outside WinAnsi print as "?" (the same as feature 001). The editor warns about this per field (R7).

## R5 — View vs Download, including unsaved work

- **Decision**: One endpoint, `POST /admin/letter-requests/{id}/letter/pdf`, whose body is the editor's current values, and which nothing saves. `?disposition=inline|attachment` sets `Content-Disposition`. The UI fetches it as a blob:
  - **View**: opens a new tab synchronously on click (so the popup blocker allows it), shows "Generating…", then sets the tab's location to an object URL of the blob.
  - **Download**: creates an `<a download="<reference>.pdf">` for the blob.
- **Rationale**: "View his current work" means what is in the form now, which may be unsaved. The same generator serves both buttons, so they can't differ.
- **Alternatives considered**: `GET …/pdf` of the saved draft only. Rejected: View wouldn't show unsaved edits.

## R6 — Sending

- **Decision**: `POST /admin/letter-requests/{id}/letter/send`, with no body. The server:
  1. loads the request
  2. uses the saved draft. Without one it returns 409 `LETTER_NOT_SAVED`; the UI opens the request in the editor instead (spec US3-3)
  3. builds the PDF
  4. sends with `sendDynamicEmailDoc("recommendation_letter_delivery", { …vars, email: requester.email }, { sender: "info", replyTo: info@, htmlData: escaped, attachments: [{ filename: "<reference>.pdf", content: Buffer, contentType: "application/pdf" }] })`
  5. records `delivery`

  The call is **awaited**, so the admin sees the real result. This needs one change to `emailService.ts`: `DynamicEmailOptions` gains `attachments?: EmailAttachment[]`, passed through to `sendRawEmailWithAttachments`, which already supports them.
- **Unsaved edits**: Send uses only the saved draft (the admin is sending a letter they reviewed). If the row being sent is open in the editor with unsaved changes, the UI blocks with "Save your changes before sending" and offers *Save & send*.
- **Rationale**: The send is awaited because, unlike the member flows, the admin is waiting on the result and must know whether it worked.

## R7 — Email template provisioning (lesson from PR #28)

- **Decision**:
  - The delivery email's HTML lives in `src/email_templates/recommendation_letter_delivery.html`, following the folder the client set up in PR #28. The subject, text and variables live in a small definition module.
  - A helper, `ensureEmailTemplate(definition)`, inserts the template into `emailtemplates` **only if missing** (`updateOne({name}, {$setOnInsert: …}, {upsert: true})`, once per process). The send path calls it before sending.
  - Templates an admin has edited in Dashboard → Email Templates are never overwritten.
- **Rationale**: In PR #28 the event emails failed on the server because the new templates were only created by a manual seed script that the deploy never runs. This feature must not repeat that.

## R8 — UI layout and state

- **Decision**: A new component folder, `ui/src/Components/Dashboard/RecommendationLetters/`:
  - `RecommendationLetters.tsx`: the page. It reuses the `.bl-grid` two-column pattern, with a `minmax(0,5fr) minmax(0,7fr)` split at ≥ 992 px, stacked below.
  - `LetterRequestList.tsx`: the left half. Each row shows the reference, company, requester, needed-by date and a delivery badge, with **Send** and a select action.
  - `LetterEditor.tsx`: the right half. A Formik + Yup form with *Save*, *View* and *Download PDF*, and a "last saved by X at T" line.
- **Dirty tracking**: Formik `dirty`. Switching requests while dirty asks `useConfirm` "Discard unsaved changes?".
- **Menu**: the key is `recommendation_letters`, titled "Recommendation Letters", admin only. It sits next to Manage Events in `Dashboard.tsx`.
- **Non-WinAnsi warning**: a hint under a field when its value contains characters the PDF can't print. The rule is the code point range check `[^\x00-\xFF‘’“”–—…€•]`.

## R9 — Authorization

- **Decision**: Every endpoint uses `adminOnlyMiddleware`, as in features 003 and 004. The identity for `savedBy` and `sentBy` comes from the token's `userId`.

## R11 — Runtime assets must ship in `dist/`

- **Finding (2026-10-09)**: The server deploy (`.github/workflows/Deploy GIC SERVER.yml`) runs `npm run build` and then `rsync --delete dist/` to the server. `tsc` emits only `.js`, so nothing else under `src/` reaches the server. Today `dist/email_templates/` doesn't exist, and `ui/` isn't deployed to the API host at all.
- **Decision**:
  - Keep runtime files under `src/` (`src/email_templates/*.html` and a new `src/assets/gic-logo.png`).
  - Extend the build script with a copy step: `"build": "rm -rf dist && npm run tsoa:routes && npm run tsoa:spec && tsc && npm run copy-assets"`, where `"copy-assets": "mkdir -p dist/email_templates dist/assets && cp -R src/email_templates/. dist/email_templates/ && cp -R src/assets/. dist/assets/"`.
  - Code resolves these files with `path.join(__dirname, "..", "email_templates", name)`. That works under `tsx` (`src/services` → `src/email_templates`) and in production (`dist/services` → `dist/email_templates`).
- **Rationale**: The fix uses the existing deploy pipeline and keeps the HTML editable as files, which is the direction the client set in PR #28.
- **Alternatives considered**:
  - Inline the HTML and logo (base64) into `.ts` modules. Rejected: it defeats the editable HTML files.
  - Read from `process.cwd()/ui/public`. Rejected: that path doesn't exist on the server.

## R10 — Constitution

`.specify/memory/constitution.md` is still the unfilled template. As in features 001–004, the design is checked against the repo's de-facto conventions (see the plan).
