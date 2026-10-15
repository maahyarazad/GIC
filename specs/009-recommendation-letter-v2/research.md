# Research: Recommendation Letter v2

## R1 — Two PDF paths, only one changes body wording

- **Finding**: `src/services/businessLetterPdf.ts` renders a **request-summary** PDF (field/label
  layout from the DTO) for the member's "Download PDF". The actual letter of recommendation is
  `src/services/recommendationLetterPdf.ts`, fed by `src/services/recommendationLetterText.ts`
  (`buildSections`, `buildDefaultLetter`, `validateLetter`, `LIMITS`, `LABELS`).
- **Decision**: The v2 **body rewrite** touches only `recommendationLetterText.ts` +
  `recommendationLetterPdf.ts`. `businessLetterPdf.ts` only needs the **new addressee/reference
  fields** added to its summary layout (FR7), not the v2 prose.

## R2 — Reference name collision

- **Finding**: `BusinessLetterRequest.reference` is the unique tracking id (`BL-YYYYMMDD-xxxxxx`,
  `unique`, `index`). The user's field 7 "Reference: Project Name / Tender Number or Name / Business
  Initiative" is the **letter subject reference**, which today is the letter field `reference`
  (default "RFQ, Tender, Project").
- **Decision**: Store the member-supplied value as **`addressee.reference`** (or
  `projectReference`) on the request — NOT in the tracking `reference`. On prefill, map
  `addressee.reference` → `LetterFields.reference`. Keep the tracking id untouched.
- **Rationale**: Avoids breaking the unique request id and its index; keeps the editor's existing
  `reference` field as the subject line.

## R3 — Backwards compatibility with existing requests

- **Finding**: Existing requests have only `addressee.address`; the LetterSchema recipient fields are
  `recipientCompany/Street/City/Country`.
- **Decision**:
  - Request model: add the new `addressee` sub-fields with `default: ""` (not DB-level `required`);
    enforce "required" in the **controller/validator for new submissions** and in the member form.
  - `buildDefaultLetter`: when the new structured addressee is present, map it directly; otherwise
    fall back to the current comma/newline split of `addressee.address` so legacy requests still
    prefill sensibly.
  - LetterFields keys change; `savedLetter`/`validateLetter`/`LIMITS`/`LABELS` iterate over the new
    key set. Legacy saved drafts (old recipient keys) read missing new keys as "".
- **Rationale**: No data migration; old and new requests both render.

## R4 — v2 body wording

- **Decision**: Replace `buildSections()` (3 numbered sections) with an ordered list of v2
  paragraphs (no headings), verbatim from the v2 template, with variables filled:
  company (`companyName`), project/tender reference (`projectName`/`reference`), member values.
- **PDF**: `recommendationLetterPdf.ts` currently draws `section.heading` (bold) + paragraphs. For v2
  it draws paragraphs only (keep the `ensureSpace`/wrap/leading logic; drop heading draws).
- **Alternatives considered**: Keep numbered sections — rejected by the user.

## R5 — Signatories

- **Decision**: `SIGNATORIES` = `[{ name: "Philip Hölzer", title: "Club Director" },
  { name: "Thomas Hochberger", title: "General Manager", signature: { file: "Thomas_Signature.pdf",
  box: {…} } }]`. Remove the Jan A Hussing entry and the `Jan_signiture.jpeg` reference.
- **Signature image optional**: `recommendationLetterPdf.ts` already treats `signatory.signature` as
  optional (passes `null` to the draw loop when absent), so Philip's image-less slot draws the line +
  name/title with no change required beyond config.
- **Note**: The image-branch (`.jpeg`/`.png`) added for Jan stays in the service (still valid for any
  future image signatory); only the config entry and the file reference are removed.

## R6 — Stylesheet / form conventions

- Member form is `ui/src/Components/Dashboard/BusinessLetter/BusinessLetter.tsx` (Formik + Yup;
  `.bl-*` classes in `BusinessLetter.scss`/`.css`). New fields reuse `.bl-field`/`.bl-row` layout.
- Admin editor is `LetterEditor.tsx` (`.rl-*`); recipient block uses the existing `TextField`/`rl-row2`.
- Any `.scss` change is hand-mirrored into `.css` (no sass build step).
- No tsoa/route changes expected (same endpoints; only request/response field shapes grow).
