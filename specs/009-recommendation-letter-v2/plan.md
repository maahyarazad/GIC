# Implementation Plan: Recommendation Letter v2

**Branch**: `006-industry-sector-tenders` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

## Summary

Bring the recommendation letter in line with `Draft_Template for Letter of Recommendation - v2.docx`:
(1) a structured required addressee + project/tender reference on the request and member form,
(2) the v2 letter body + recipient block in the admin editor/PDF, (3) new signatories
(Philip Hölzer + Thomas Hochberger, Jan removed).

## Technical Context

**Language/Version**: TypeScript — Express/tsoa/Mongoose backend (`src/`), React 19 + Vite SPA (`ui/`)
**Primary Dependencies**: pdf-lib, Formik + Yup, Mongoose
**Storage**: MongoDB (`BusinessLetterRequest`)
**Testing**: `npx tsc --noEmit -p .` (backend); `cd ui && npx tsc --noEmit -p .` + `npm run build:client` (UI); manual via quickstart.md
**Project Type**: Web (backend + frontend)
**Constraints**:
- No sass build step — hand-mirror every `.scss` into its `.css`.
- `src/routes/routes.ts` + `src/swagger/swagger.json` are tsoa-generated — regenerate with
  `npm run tsoa:routes` / `npm run tsoa:spec` if controller signatures change; never hand-edit.
- No test accounts / live email sends against the shared DB/SMTP without the user doing it.
- `file_storage/` is git-ignored; `Thomas_Signature.pdf` must remain on the server.

## Constitution Check

Constitution is an unfilled template — no ratified gates. Repo rules honoured (tsoa-generated files,
`.scss`↔`.css` mirroring, no secrets, back-compat per research R3).

## Project Structure — files touched

```
Backend (src/)
├── types/businessLetter.types.ts            # CreateBusinessLetterRequest + DTO: addressee fields + reference
├── models/businessLetterRequest.model.ts    # addressee sub-fields (+reference); LetterSchema recipient keys; mapper
├── controllers/businessLetter.controller.ts # validate + persist new required fields
├── services/businessLetterPdf.ts            # request-summary PDF shows new addressee + reference
├── types/recommendationLetter.types.ts      # LetterFields recipient keys + LETTER_FIELD_KEYS
├── services/recommendationLetterText.ts     # LIMITS/LABELS/required/buildDefaultLetter/validateLetter + v2 body
├── services/recommendationLetterPdf.ts      # draw recipient block + v2 paragraphs (no headings)
├── config/recommendationLetterConfig.ts     # SIGNATORIES → Philip + Thomas (remove Jan + Jan_signiture.jpeg)
└── controllers/recommendationLetterAdmin.controller.ts  # uses buildDefaultLetter/validateLetter (verify)

Frontend (ui/src/)
├── Components/Dashboard/BusinessLetter/BusinessLetter.tsx    # member form: 7 required fields + Yup + payload + server map
├── Components/Dashboard/BusinessLetter/BusinessLetter.(scss|css)  # layout for new fields (mirrored)
├── Components/Dashboard/RecommendationLetters/LetterEditor.tsx    # recipient block = new fields; Yup schema
└── api/businessLetter.ts (verify payload type only)
```

No new endpoints. tsoa regen only if a controller method signature/DTO used by a route changes shape
(the DTO grows — regenerate spec to keep swagger accurate).

## Key decisions (see research.md)

- Store the member's project/tender reference as `addressee.reference` (NOT the tracking `reference`);
  map it to `LetterFields.reference` on prefill (R2).
- New addressee fields are schema-optional with `default: ""`, enforced required in the
  controller/validator + form; `buildDefaultLetter` falls back to the legacy `address` split (R3).
- v2 body replaces the 3 numbered sections; PDF drops section headings (R4).
- Signatories: Philip Hölzer (Club Director, no image) + Thomas Hochberger (General Manager, PDF);
  signature per signatory stays optional (R5).

## Phases

- **Phase 0 — Research**: [research.md](./research.md) ✅
- **Phase 1 — Design**: [quickstart.md](./quickstart.md). No `contracts/` (same endpoints) and no
  separate `data-model.md` (entities captured in spec Key Entities + model file).
- **Phase 2 — Tasks**: [tasks.md](./tasks.md) (generated).

## Risks

- Field-key rename on `LetterFields` ripples through types, text service, PDF, editor, and the
  Mongoose `LetterSchema` — change them together; `tsc` is the guard.
- Legacy saved drafts with old recipient keys must still open (read as "").
- v2 signature layout: confirm the two-column spacing still fits with the longer "Club Director" title.
