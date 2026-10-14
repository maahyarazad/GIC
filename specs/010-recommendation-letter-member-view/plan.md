# Implementation Plan: Recommendation Letter — member view, receipt email & approve/send

**Branch**: `010-recommendation-letter-member-view` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/010-recommendation-letter-member-view/spec.md`

## Summary

Six changes across the recommendation-letter stack:

1. **Member view** — reuse the admin editor + live-preview UI (008) in the member dashboard, in
   `mode="member"`: editable fields + save-draft, **no Send/Approve**, preview PDF watermarked DRAFT
   with signatures hidden. New member-scoped backend endpoints (list/get/save-draft/pdf for the
   caller's own requests).
2. **PDF options** — `buildRecommendationLetterPdf(fields, reference, { draft?, signatures? })`:
   diagonal 20%-opacity "DRAFT" watermark on every page when `draft`, and skip signature slots when
   `signatures === false`. Admin paths pass the current behaviour explicitly.
3. **Letter type removed** — drop from member form + admin editor + leadership email; keep the model
   field optional/defaulted for back-compat.
4. **Emails** — on submit, also send a **receipt** to the requester; migrate the **leadership
   notification** to the local-file provisioning pattern with the new HTML (no Letter-type row) and a
   CTA button to the dashboard RL page + requests modal.
5. **Approve/Send** — new `approved` status marker (approvedAt/approvedBy) + `POST .../approve`
   admin endpoint; requests modal shows Approve before Send; Send stays independent.
6. **Three-part body + scroll** — replace the single `closing` with `bodyIntro`/`bodyMain`/`bodyClosing`
   (bold / regular / regular in the PDF); editor shows three sized textareas and scrolls within ≈70vh.

## Technical Context

**Language/Version**: TypeScript — Express + tsoa 6.6 + Mongoose backend (`src/`), React 19 + Vite SPA (`ui/`)
**Primary Dependencies**: Formik (editor), `pdf-lib` (letter PDF), nodemailer + the `emailtemplates`
collection via `emailTemplateProvisioning.ts` / `emailService.ts`, `ModalDialog`, the
`recommendationLetters` API client. No new dependency.
**Storage**: MongoDB (`businessletterrequests` collection) — adds `approval` sub-doc + renamed body
fields; `receipt`/`notification` delivery sub-docs.
**Testing**: `npx tsc --noEmit -p .` (backend) + `cd ui && npx tsc --noEmit -p .` (UI baseline = 71
lines) + `cd ui && npm run build:client`; manual checklist in `quickstart.md`. No test runner.
**Target Platform**: Dashboard web UI + Node API
**Project Type**: Web (frontend + backend)
**Performance**: Member preview reuses the debounced focus-out refresh from 008 (one PDF per
edit-then-blur). Emails are fire-and-forget.
**Constraints**:
- No sass build step — every `.scss` edit hand-mirrored into the matching `.css` (never `npx sass`).
- tsoa `src/routes/routes.ts` + `src/swagger/swagger.json` are generated — regenerate with
  `npm run tsoa:routes` / `npm run tsoa:spec`, never hand-edit.
- Do NOT trigger real emails against the live SMTP/DB without the user's go-ahead (user does live tests).
- `file_storage/` (signatures) is server-only and git-ignored.
- Backend restart required for model/text/PDF/config/route/email-template changes.

**Scale/Scope**: ~6 backend files + 2 email templates + ~6 UI files + 1 stylesheet pair + generated routes/spec.

## Constitution Check

Constitution is an unfilled template (no ratified gates). No violations. Repo rules honoured:
generated tsoa artifacts regenerated not hand-edited, `.scss`↔`.css` mirrored, back-compat kept for
existing saved drafts and records, no new dependency, no live email without approval.

## Project Structure

### Files touched

```
Backend (src/)
├── types/recommendationLetter.types.ts     # LetterStatus += "approved"; LetterFields body fields; approval in detail/list
├── types/businessLetter.types.ts           # letterType made optional / de-emphasised
├── models/businessLetterRequest.model.ts   # body fields in LetterSchema; approval sub-doc; receipt delivery sub-doc; letterType optional+default
├── services/recommendationLetterText.ts    # LIMITS/LABELS/required + buildDefaultLetter + buildBody for 3 body fields; legacy closing→bodyClosing map
├── services/recommendationLetterPdf.ts     # PdfOptions {draft,signatures}; diagonal DRAFT watermark; conditional signatures
├── services/emailTemplateProvisioning.ts   # register BUSINESS_LETTER_REQUEST + BUSINESS_LETTER_RECEIPT definitions
├── email_templates/business_letter_request.html   # NEW: provided leadership template, Letter-type row removed, CTA button added
├── email_templates/business_letter_receipt.html    # NEW: requester receipt
├── controllers/businessLetter.controller.ts        # send receipt + notification via provisioning; drop LETTER_TYPE var; stop requiring letterType
├── controllers/recommendationLetterAdmin.controller.ts  # POST /{id}/approve; pdf endpoint passes {draft:false,signatures:true}; member PDF uses draft/no-sig
├── controllers/recommendationLetterMember.controller.ts # NEW: member-scoped list/get/save-draft/pdf for the caller's own requests
├── config/recommendationLetterConfig.ts    # (unchanged signatories; watermark constants may live in the PDF service)
├── config/businessLetterConfig.ts          # dashboard URL base for the CTA button
├── routes/routes.ts  + swagger/swagger.json # REGENERATED (tsoa)

UI (ui/src/)
├── api/recommendationLetters.ts            # admin: approve(); member client funcs (member BASE) + draft flag on pdf
├── Components/Dashboard/RecommendationLetters/
│   ├── RecommendationLetters.tsx           # accept mode="admin"|"member"; member hides Approve/Send; wire approve()
│   ├── LetterEditor.tsx                     # three body textareas; hide Send/actions per mode; 70vh scroll container; drop letterType
│   ├── LetterPreview.tsx                    # pass draft flag (member) to fetchLetterPdf
│   ├── LetterRequestList.tsx               # Approve button before Send (admin); approved status chip
│   ├── RecommendationLetters.scss / .css    # editor scroll ≈70vh; approve button; mirrored
├── Components/Dashboard/BusinessLetter/BusinessLetter.tsx  # drop letterType field from the request form
└── Components/Dashboard/<member host>       # mount RecommendationLetters mode="member" for the signed-in member
```

## Design decisions (see research.md)

- **Reuse, don't fork, the 008 UI.** Parametrise `RecommendationLetters`/`LetterEditor`/`LetterPreview`/
  `LetterRequestList` with `mode: "admin" | "member"` and an injected API client, so the member view is
  literally the admin view minus Approve/Send and with a draft preview. Member uses a member API base.
- **Member endpoints are new and ownership-scoped.** Mirror the admin list/get/save/pdf under
  `api/v1/letter-requests` (member auth, not `adminOnlyMiddleware`), filtering to `requester` = caller.
  No member send/approve endpoints exist, enforcing the "no send" rule server-side too.
- **PDF options object.** Add a 3rd arg `{ draft = false, signatures = true }`. The watermark is drawn
  once per page before body text: rotate the font, place a single large "DRAFT" along the diagonal,
  colour at ~0.2 opacity (grey). Signatures block is skipped entirely when `signatures === false`
  (no reserved space, no file reads).
- **Three body fields.** `bodyIntro`, `bodyMain`, `bodyClosing` replace `closing`; `buildBody` returns
  `[bodyIntro(bold), …bodyMain split on blank lines, bodyClosing]` with per-field render weight. Keep
  `closing` readable from old docs and map it into `bodyClosing` in `buildDefaultLetter`/save mapping.
  Defaults come from the supplied wording. Validation: intro/main/closing required to save.
- **Emails via provisioning.** Add `BUSINESS_LETTER_REQUEST` (leadership) + `BUSINESS_LETTER_RECEIPT`
  definitions; `ensureEmailTemplate` on first use; send with `sendDynamicEmailDoc`. The leadership
  template is the user's HTML minus the Letter-type `<tr>`, plus a CTA `<a>` button to
  `{{DASHBOARD_URL}}` (RL section + open-requests flag). Both sends are fire-and-forget with recorded
  status, like the current `notifyLeadership`.
- **Approve.** `approval: { status, approvedAt, approvedBy }`; `letterStatus` gains `"approved"` (derived,
  below "sent"). `POST /admin/letter-requests/{id}/approve` sets it; the list/detail surface it; the modal
  renders Approve before Send. Send logic unchanged (no approval check).
- **Scroll.** `.rl-editor` (or its scroll wrapper) gets `max-height: calc(70vh)` + `overflow-y:auto`;
  the actions bar stays outside the scroll area (top). Mirror into `.css`.

## Complexity Tracking

- **Back-compat:** old drafts have `closing` and `letterType`; new code must read them. Mitigation:
  field mapping in `buildDefaultLetter`/`savedLetter`; keep model fields.
- **Live email risk:** provisioning writes a template row and sends real mail. Mitigation: implement
  behind the existing fire-and-forget path; the user runs live submission tests themselves.
- **tsoa generation:** new endpoints require regenerating routes + spec; do not hand-edit.
- **DRAFT watermark correctness:** diagonal angle + centring on A4 must sit under text and not shift
  layout; verify visually via the member preview (quickstart).

## Phases

- **Phase 0 — Research**: [research.md](./research.md) (member endpoints & auth scoping, PDF watermark &
  conditional signatures, 3-part body model + back-compat, email provisioning + CTA, approve status, scroll).
- **Phase 1 — Design & contracts**: [data-model.md](./data-model.md), [contracts/](./contracts/),
  [quickstart.md](./quickstart.md).
- **Phase 2 — Tasks**: generated by `/speckit-tasks`.
