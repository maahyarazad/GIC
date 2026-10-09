# Contract: Recommendation Letters API (admin), PDF, email and UI

All endpoints use `adminOnlyMiddleware` (admin role only; 401 or 403 otherwise). JSON responses use the existing envelope:
- success: `{ success, message, data }`
- error: `{ success: false, message, error: { message, code, details? } }`

Field rules are in [data-model.md](../data-model.md).

## DTOs — `src/types/recommendationLetter.types.ts`

```ts
type LetterStatus = "new" | "draft" | "sent" | "failed";

interface LetterFields {
  recipientCompany: string; recipientStreet: string; recipientCity: string; recipientCountry: string;
  letterDate: string;          // "YYYY-MM-DD"
  companyName: string; reference: string; salutation: string;
  companyLocation: string; industry: string; productsServices: string; projectName: string;
  closing: string;
}

interface LetterRequestListItem {
  id: string; reference: string;
  requester: { name: string; email: string; company: string };
  purpose: string; neededBy: string; language: "en" | "de"; createdAt: string;
  letterStatus: LetterStatus;
  sentAt: string | null; sendCount: number;
  editedSinceSent: boolean;
}

interface LetterRequestDetail extends LetterRequestListItem {
  requester: { name: string; email: string; phone: string; company: string };
  addresseeAddress: string;
  letter: LetterFields;        // always complete: the saved draft or the defaults
  isDraftSaved: boolean;
  savedBy: { id: string; name: string } | null; savedAt: string | null;
  delivery: { status: "sent" | "failed"; sentAt: string | null; attemptedAt: string; sentTo: string; count: number; error: string | null } | null;
}
```

## Endpoints — `RecommendationLetterAdminController`, `@Route("api/v1/admin/letter-requests")`

| Method & path | Body | Success | Errors |
|---|---|---|---|
| `GET /` | — | 200 `{ items: LetterRequestListItem[], total }`, newest first, limit 500 | 500 |
| `GET /{id}` | — | 200 `LetterRequestDetail` | 400 `INVALID_ID` · 404 `NOT_FOUND` |
| `PUT /{id}/letter` | `LetterFields` | 200 `LetterRequestDetail`, "Letter saved" | 400 `VALIDATION_ERROR` (`details`: field → message) · 404 |
| `POST /{id}/letter/pdf?disposition=inline\|attachment` | `LetterFields` (current editor values; not saved) | 200 `application/pdf`, `Content-Disposition: <disposition>; filename="<reference>.pdf"`, streamed with `Readable.from(Buffer)` as in feature 001 | 400 `VALIDATION_ERROR` · 404 · 500 `PDF_ERROR` |
| `POST /{id}/letter/send` | — (uses the saved draft) | 200 `LetterRequestDetail`, "Letter sent to <email>" | 409 `LETTER_NOT_SAVED` (no saved draft) · 404 · 502 `SEND_FAILED` (`details.error`, and `delivery` is recorded as failed) |

`disposition` defaults to `attachment`. Any value other than `inline` is treated as `attachment`.

## PDF layout (`buildRecommendationLetterPdf`)

The page is A4 portrait with 71 pt side margins. Every page has the running header "German Industry Club – Building C1, Office 1208, Ajman FreeZone, Ajman, UAE" in 8 pt grey, and the footer "n / N" centred in 8 pt. Page 1 runs top to bottom:

| Block | Content |
|---|---|
| Letterhead (right) | GIC logo, 140 pt wide |
| Recipient (left) | `recipientCompany` / `recipientStreet` / `recipientCity` / `recipientCountry` (empty lines skipped) |
| Sender (right) | German Industry Club / Building C1, Office 1208 / Ajman FreeZone, Ajman, UAE / E-Mail: info@german-industry-club.com |
| Date | `Date: <letterDate as YYYY-MM-DD>` (as in the template) |
| Subject (bold) | `Subject: Letter of Recommendation – <companyName>` |
| Reference | `Reference: <reference>` (skipped if empty) |
| Salutation | `<salutation>` |
| Sections 1–3 | Bold numbered headings plus the template sentences, with `<companyName>`, `<companyLocation>`, `<industry>`, `<productsServices>` and `<projectName>` substituted (wording in `src/services/recommendationLetterText.ts`) |
| Closing | `<closing>`, then "Yours sincerely," and bold "German Industry Club" |
| Signatures | Two columns, kept on one page: blank signature space, a rule, bold name, title. Jan A Hussing — Chairman; Thomas Hochberger — General Manager (config) |

## Email — `recommendation_letter_delivery`

- **From**: `SMTP_INFO_SENDER` (info@german-industry-club.com).
- **To**: the requester's email address. **Reply-To**: info@.
- **Subject**: `Your Letter of Recommendation – {{COMPANY_NAME}} ({{REFERENCE}})`.
- **Body**: GIC themed layout. "Dear {{REQUESTER_NAME}}, please find attached the Letter of Recommendation for {{COMPANY_NAME}} regarding {{PROJECT_NAME}}…"
- **Attachment**: `<reference>.pdf`.

## UI — Dashboard → Recommendation Letters (`recommendation_letters`, admin only)

| Area | Behaviour |
|---|---|
| Layout | Two columns at ≥ 992 px (list 5fr, editor 7fr), stacked below |
| Left: list | Rows show the reference, company, requester (name + email), "needed by" date, a status badge (New / Draft / Sent dd MMM / Send failed, "edited since"), and a "DE requested" tag when `language === "de"`. Clicking a row selects it (highlighted). The row's **Send** button opens a confirm dialog that names the email address, and says "Already sent on …" when it was sent before. On a *New* row, Send selects the row and shows "Complete and save the letter before sending" instead. |
| Right: editor | The heading shows the reference and requester. Fields are grouped as Recipient, Letter, Company and Closing, prefilled from `GET /{id}`. A "Last saved by X at T" or "Not saved yet" line. Buttons: **Save** · **View** (new tab, inline PDF) · **Download PDF**. A hint appears under any field holding characters the PDF can't print. |
| Unsaved changes | Selecting another row, or Send on the open row, while the form is dirty → confirm "Discard unsaved changes?" (switching rows) or "Save & send" (Send) |
| Snackbars | "Letter saved", "Letter sent to <email>", the server message on error |
