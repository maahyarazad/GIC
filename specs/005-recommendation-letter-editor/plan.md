# Implementation Plan: Recommendation Letter Editor

**Branch**: `005-recommendation-letter-editor` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-recommendation-letter-editor/spec.md`.

## Summary

Admins get a new Dashboard tab, **Recommendation Letters**. The left half lists the letter requests that members submit (feature 001). The right half is a form holding every variable value of the client's letter template (`Draft_Template for Letter of Recommendation.docx`). The form is always prefilled, from the saved draft or from the request plus template defaults.

From the form, the admin can:
- **Save** the draft.
- **View** the current, possibly unsaved, letter as a PDF in a new tab.
- **Download** that PDF.

Each list row has **Send**, which emails the saved letter's PDF from info@ to the requester.

The server builds the PDF with pdf-lib (already a dependency), following the template's layout. The draft and the delivery record are stored as optional subdocuments on the existing request document.

Two findings shape the design:
- **Assets aren't deployed.** The server deploy ships only `dist/`, so the HTML email templates and the logo must be copied into it at build time ([R11](./research.md#r11--runtime-assets-must-ship-in-dist)).
- **Templates aren't seeded.** The delivery email's template inserts itself when missing, so production doesn't repeat PR #28's "template not found" failure ([R7](./research.md#r7--email-template-provisioning-lesson-from-pr-28)).

## Technical Context

**Language/Version**: TypeScript 5.9 (Node 20+, `tsx`/`tsc`); React 19 + TS (Vite 7) in `ui/`.

**Primary Dependencies**: Express 4, tsoa 6, Mongoose 9, nodemailer 8 and **pdf-lib 1.17** (already installed). UI: axios, Bootstrap 5, Formik + Yup, `useToast`, `useConfirm`. **No new dependencies.**

**Storage**: MongoDB. Two optional subdocuments (`letter`, `delivery`) on `businessletterrequests`, plus one auto-provisioned `emailtemplates` record.

**Testing**: There is no test runner. Validation is the builds plus the [quickstart.md](./quickstart.md) scenarios: API with curl, the UI in a browser, and a test inbox for Send.

**Target Platform**: Linux server under PM2 (deployed as `dist/` only); desktop browsers. The admin tool is desktop-first and stacks on small screens.

**Project Type**: A web application: the API in `src/` and the React SPA/SSR in `ui/src/`.

**Performance Goals**: PDF generation under 1 s for a 2-page letter, and under 3 s end to end for View and Download. The list returns ≤ 500 rows in under 300 ms.

**Constraints**:
- Standard PDF fonts only (WinAnsi; non-Latin characters print as "?" and a warning is shown).
- Email is sent from info@ only.
- Admin-only, enforced on both the server and the UI.
- Runtime files must reach `dist/`.
- SCSS with committed compiled CSS.

**Scale/Scope**: Tens of requests per month.
- **Server**: 1 controller, 2 services (PDF and letter text), 1 shared PDF-text helper (extracted from feature 001's PDF service), 1 template definition, a model extension, an `emailService` change (attachments in dynamic emails) and a build-script copy step.
- **UI**: 1 API client, 3 components plus SCSS, and a Dashboard menu entry.

There are no NEEDS CLARIFICATION items. Interpretation choices (email recipient, logo, signatures, English only, Send requiring a saved draft) are recorded in spec Assumptions and research.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution is still the unfilled template, so the design is checked against the repo's de-facto conventions (as in features 001–004):

| Convention | Complies? |
|---|---|
| tsoa controllers under `api/v1` with response envelopes | ✅ `RecommendationLetterAdminController` |
| `adminOnlyMiddleware`; identity from token → user | ✅ |
| Mongoose schemas declared in code, `timestamps` | ✅ optional subdocuments on the existing schema |
| Email through DB templates + `{{VAR}}` + `escapeHtml`, sent from info@ via `sendDynamicEmailDoc` | ✅ plus attachments (a small extension of an existing option type) |
| PDF streamed with `Readable.from(Buffer)` (feature 001 precedent) | ✅ |
| Dashboard components with SCSS + compiled CSS; `useToast` / `useConfirm` / `axiosInstance` | ✅ |
| No new dependencies | ✅ pdf-lib already present |

**Result (pre-research)**: PASS. **Result (post-design)**: PASS. The build-script copy step is a small addition that fixes a pre-existing deployment gap (the PR #28 HTML files don't reach production today) rather than adding a layer.

## Project Structure

### Documentation (this feature)

```text
specs/005-recommendation-letter-editor/
├── spec.md
├── plan.md                               # this file
├── research.md                           # Phase 0
├── data-model.md                         # Phase 1
├── quickstart.md                         # Phase 1
├── contracts/
│   └── recommendation-letters.api.md     # REST + PDF layout + email + UI
└── tasks.md                              # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
package.json                                    # EDIT  build += "&& npm run copy-assets"; + "copy-assets" script (R11)

src/
├── assets/
│   └── gic-logo.png                            # NEW   copy of ui/public/gic-logo-main.png (shipped via copy-assets)
├── email_templates/
│   └── recommendation_letter_delivery.html     # NEW   GIC themed delivery email (same layout as PR #28 files)
├── config/
│   └── recommendationLetterConfig.ts           # NEW   SIGNATORIES, SENDER_BLOCK, RUNNING_HEADER, template name
├── models/
│   └── businessLetterRequest.model.ts          # EDIT  + letter{…, savedBy, savedAt}, delivery{…}; + { createdAt: -1 } index
├── types/
│   └── recommendationLetter.types.ts           # NEW   LetterFields, LetterStatus, list/detail DTOs (contract)
├── services/
│   ├── pdfText.ts                              # NEW   toWinAnsi, wrapText (moved from businessLetterPdf.ts)
│   ├── businessLetterPdf.ts                    # EDIT  import the helpers from pdfText.ts (no behaviour change)
│   ├── recommendationLetterText.ts             # NEW   buildDefaultLetter(request), validateLetter(fields, mode), section sentences
│   ├── recommendationLetterPdf.ts              # NEW   buildRecommendationLetterPdf(fields, reference) (R4)
│   ├── emailTemplateProvisioning.ts            # NEW   ensureEmailTemplate(def): insert-if-missing, once per process (R7)
│   └── emailService.ts                         # EDIT  DynamicEmailOptions.attachments → sendRawEmailWithAttachments
├── controllers/
│   └── recommendationLetterAdmin.controller.ts # NEW   list, detail, save, pdf, send (contract)
└── routes/routes.ts, swagger/swagger.json      # REGENERATED by tsoa

ui/src/
├── api/
│   └── recommendationLetters.ts                # NEW   list, get, save, fetchPdf(blob), send
├── Components/Dashboard/RecommendationLetters/
│   ├── RecommendationLetters.tsx               # NEW   page: two-column grid, selection, dirty guard
│   ├── LetterRequestList.tsx                   # NEW   left: rows, status badge, Send
│   ├── LetterEditor.tsx                        # NEW   right: Formik form, Save / View / Download PDF
│   └── RecommendationLetters.scss / .css       # NEW
└── Pages/Dashboard/Dashboard.tsx               # EDIT  + "recommendation_letters" (admin) "Recommendation Letters"
```

**Structure Decision**: Keep the established layout. The letter's wording and defaults live in one module (`recommendationLetterText.ts`), which the PDF builder and the controller both use, so the template text exists in exactly one place.

## Design Notes

### Server

- **Validation** (`validateLetter(fields, mode)` with `mode: "preview" | "save"`):
  - Trim every field and apply the length limits from data-model.
  - The `letterDate` calendar day must be valid.
  - `companyName`, `salutation`, `companyLocation`, `projectName` and `closing` are required.
  - `industry` and `productsServices` are required only when `mode === "save"`.
  - Unknown keys are ignored: tsoa accepted them in testing (2026-10-09), and `validateLetter` copies only the 13 known fields, so nothing else is stored.
  - Errors return `{ field: message }`.
- **Save**: `updateOne({ _id }, { $set: { letter: { ...fields, savedBy, savedAt: now } } })`, then return the detail.
- **PDF**: validate (preview), then `buildRecommendationLetterPdf`, then stream.
  - **Layout engine**: a small cursor-based writer, `{ page, y }`. `ensureSpace(h)` adds a page. Headers and footers are drawn in a final pass over `pdf.getPages()`, once the page count is known.
  - **Signature block**: measured first, so it moves to a new page as one unit.
- **Send**:
  1. Load the request. Without `letter`, return 409 `LETTER_NOT_SAVED`.
  2. Validate the saved draft (save mode).
  3. Build the PDF.
  4. `await ensureEmailTemplate(DELIVERY_TEMPLATE)`.
  5. `await sendDynamicEmailDoc(..., { sender: "info", replyTo: process.env.SMTP_INFO_SENDER, htmlData: escaped, attachments })`.
  6. On success: `$set delivery.{status:"sent", sentAt, sentBy, sentTo, attemptedAt, error:null}` and `$inc delivery.count`.
  7. On failure: `$set delivery.{status:"failed", attemptedAt, sentBy, sentTo, error}` and respond 502 `SEND_FAILED`.
- **Template provisioning**: `ensureEmailTemplate({ name, subject, htmlFile, text, variables })` reads the HTML file with `path.join(__dirname, "..", "email_templates", htmlFile)` on first use. It upserts with `$setOnInsert` and memoises a promise per template name, resetting the memo on failure.
- **List status**: computed in the mapper from `letter` and `delivery` (data-model → Derived).

### UI

- **`RecommendationLetters`** holds `selectedId`, the list, the detail and a `dirty` flag reported by the editor (`onDirtyChange`).
  - **Selecting a row**: if dirty, ask `useConfirm` to discard first; then `GET /{id}`; then remount the editor with `key={id + savedAt}` so Formik reinitialises from the fetched values. That is how "prefilled every time" works.
  - **Send on a row**:
    - New row: select it and show an info toast.
    - Open row while dirty: confirm "Save & send" (save, then send).
    - Otherwise: confirm with the email address and "Already sent on …" when applicable.
    - After sending: refresh the list and the detail.
- **View**: `const tab = window.open("", "_blank")`, synchronously in the click handler. Write a "Generating PDF…" placeholder into it, `POST …/pdf?disposition=inline` with `responseType: "blob"`, then set `tab.location = URL.createObjectURL(blob)`. Revoke the URL after 60 s. On error, close the tab and show a toast.
- **Download**: the same request with `disposition=attachment`, then a temporary `<a download="<reference>.pdf">`.
- **Validation in the form**: Yup mirrors the server's save rules. View and Download use the preview rules: if they fail, the field errors are shown and no request is made.
- **WinAnsi hint**: `/[^\x00-\xFF‘’“”–—…€•]/` (research R8) under each text field.

## Out of Scope / Follow-ups

- A German letter template (requests in `de` are only flagged).
- Signature images (the template's "Digital Signature" placeholders). Add them once the client provides PNGs, as configured `src/assets/` files.
- Showing the letter status or the PDF to the member in their own tab.
- Unicode fonts in the PDF (`@pdf-lib/fontkit` plus an embedded TTF) for non-Latin names.
- PR #28's `src/email_templates/event_attendance_*.html` files also don't reach `dist/` today. They aren't read at runtime yet, but the copy step added here ships them too.

## Complexity Tracking

None. There are no constitution violations.
