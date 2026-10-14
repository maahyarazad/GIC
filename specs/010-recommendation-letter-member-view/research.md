# Research: Recommendation Letter — member view, receipt email & approve/send

## R1 — Member view: reuse the admin UI in a `mode`

- **Decision**: Parametrise the existing 008 components (`RecommendationLetters`, `LetterEditor`,
  `LetterPreview`, `LetterRequestList`) with `mode: "admin" | "member"` plus an injected API client,
  rather than cloning them. Member mode hides the Approve/Send controls and uses the member API base.
- **Rationale**: "Same view as admin" is literally satisfied; one source of truth for the editor/preview;
  smaller diff. The components already take their data via props/clients.
- **Alternatives**: a separate member component tree (duplication, drift); extending `BusinessLetter.tsx`
  (that is the request form, not an editor) — rejected.

## R2 — Member endpoints & ownership scoping

- **Decision**: Add member-scoped routes under `api/v1/letter-requests` (not the `admin/` prefix),
  guarded by the normal member auth middleware (not `adminOnlyMiddleware`), each filtering to
  `requester` = the authenticated caller: `GET /` (own requests), `GET /{id}`, `PUT /{id}/letter`
  (save draft), `POST /{id}/letter/pdf` (preview, forced `draft:true, signatures:false`). **No** member
  send/approve routes.
- **Rationale**: Enforces "members can edit a draft but never send/approve" at the API, not just the UI.
  Mirrors the admin controller so the shared UI client just swaps the base path.
- **Alternatives**: reuse admin endpoints with role checks inside (muddier authorization); client-only
  hiding of Send (insecure) — rejected.
- **Open confirm at implement time**: the exact member auth middleware name and how the caller identity
  (`req.user`) is read — follow the pattern already used by other member controllers (e.g. the
  business-letter create controller resolves `user.email`).

## R3 — PDF: DRAFT watermark + conditional signatures

- **Decision**: `buildRecommendationLetterPdf(fields, reference, opts?: { draft?: boolean; signatures?: boolean })`
  with defaults `{ draft: false, signatures: true }`. When `draft`, draw a single large "DRAFT" word on
  each page along the diagonal (origin near bottom-left, rotated ~45–55° to the top-right corner),
  grey at ~0.2 opacity, drawn **before** the body so text sits on top. When `signatures === false`, skip
  the entire signatories block — no reserved vertical space and no `file_storage` reads.
- **Rationale**: `pdf-lib` supports `drawText` with `rotate: degrees(…)` and `opacity`. One watermark call
  per page in the existing page-footer loop. Hiding signatures is a guard around the current block.
- **Alternatives**: a pre-rendered watermark image (extra asset, scaling); CSS watermark on an HTML preview
  (not the real PDF) — rejected; the preview must be the real generated PDF (per 008).
- **Angle math**: compute the diagonal angle from A4 (595.28 × 841.89 pt) so the word runs corner-to-corner;
  size the font to fit the diagonal length; centre it on the page.

## R4 — Three-part body + back-compat

- **Decision**: Replace `closing` with `bodyIntro`, `bodyMain`, `bodyClosing` in `LetterFields`,
  `LETTER_FIELD_KEYS`, `LIMITS`, `LABELS`, required sets, and the editor. `buildBody` returns the intro
  (bold), the main block split on blank lines (regular), then the closing (regular). Defaults = the
  supplied wording. `buildDefaultLetter`/`savedLetter` map a legacy `closing` into `bodyClosing` (and
  seed the other two from defaults) so old drafts still open.
- **Rationale**: The user wants three editable inputs with their own row counts; the current auto-generated
  middle paragraphs become editable free text. Mapping legacy `closing` preserves saved drafts.
- **Suggested limits/rows**: intro ≤ 600 (3 rows), main ≤ 4000 (12 rows), closing ≤ 1000 (3 rows).
- **Alternatives**: keep auto-substitution of company/project in the main paragraph (user asked for plain
  text inputs) — rejected; keep `closing` and add two fields (leaves a stale name) — rejected for clarity.

## R5 — Emails: receipt + refreshed leadership template via provisioning

- **Decision**: Move the leadership notification off the hard-coded `BUSINESS_LETTER_EMAIL_TEMPLATE_ID`
  onto the local-file provisioning pattern (`ensureEmailTemplate` + a `src/email_templates/*.html`),
  matching `RECOMMENDATION_LETTER_DELIVERY`. Add two definitions: `BUSINESS_LETTER_REQUEST` (leadership)
  and `BUSINESS_LETTER_RECEIPT` (requester). Send both on submit, fire-and-forget, recording status in
  `notification` and a new `receipt` sub-doc.
- **Rationale**: Consistent, versioned-in-repo templates; the user supplied the exact HTML. Provisioning
  is idempotent and preserves manual DB edits.
- **Leadership template changes**: remove the `Letter type` `<tr>` and its `{{LETTER_TYPE}}` var; append a
  CTA button `<a href="{{DASHBOARD_URL}}" …>Open in dashboard</a>` before the footer. Keep the existing
  `{{REFERENCE}}`, requester, addressee, language, needed-by, submitted, purpose vars.
- **Receipt template**: confirms receipt to the requester, quotes `{{REFERENCE}}`, states the team will
  prepare the letter; no admin button.
- **Dashboard URL**: `BUSINESS_LETTER_CONFIG`/env base + a path the SPA honours to open Recommendation
  Letters with the requests modal (e.g. `/dashboard?section=recommendation-letters&requests=1`).
- **Alternatives**: edit the DB template row in place (not reproducible in the repo); SendGrid dynamic
  template id (keeps content out of the repo) — rejected.

## R6 — Approve status (marker, Send independent)

- **Decision**: Add `approval: { status: "pending" | "approved"; approvedAt: Date|null; approvedBy: ObjectId|null }`
  to the request. `LetterStatus` gains `"approved"` as a derived label (shown when approved and not yet
  sent). `POST /admin/letter-requests/{id}/approve` sets approved + approver/time. The requests modal
  renders **Approve** before **Send**; Send is unchanged and performs no approval check.
- **Rationale**: User confirmed Approve is a visibility/tracking marker, not a gate.
- **Alternatives**: hard gate (Send disabled until approved) — explicitly rejected by the user; storing
  the final signed PDF on approve — out of scope.

## R7 — Editor scroll within ≈70% viewport

- **Decision**: Wrap the editor fields in a scroll region with `max-height: calc(70vh)` and
  `overflow-y: auto`, keeping the action bar (and, on admin, Approve/Send) outside the scroll area so
  they stay visible. Mirror the `.scss` into `.css`.
- **Rationale**: Matches "scrollable within 70% of the viewport minus header and title"; avoids a second
  page-level scrollbar.
- **Alternatives**: make the whole page scroll (user asked for a contained scroll) — rejected.

## R8 — Remove letter type

- **Decision**: Remove the letter-type selector from `BusinessLetter.tsx` and the admin editor, remove the
  `{{LETTER_TYPE}}` row from the leadership email, and stop requiring `letterType` on create. Keep the
  model field optional with a default so existing records and the `formatLetterType` helper still resolve.
- **Rationale**: User asked to remove it from both views; keeping the column avoids a migration.
- **Alternatives**: drop the column (needs a migration + breaks old records) — rejected.
