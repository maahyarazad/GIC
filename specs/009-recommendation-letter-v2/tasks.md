---
description: "Task list for Recommendation Letter v2 (expanded request fields, v2 body, new signatories)"
---

# Tasks: Recommendation Letter v2

**Input**: Design documents from `/specs/009-recommendation-letter-v2/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅ (no data-model.md / contracts — same endpoints, entities in spec + model file)

**Tests**: None requested — no test runner in this repo. Validation = `tsc --noEmit` (backend + UI),
`npm run build:client`, and the manual checklist in `quickstart.md`.

**Repo conventions**: Backend Express/tsoa/Mongoose in `src/`; React 19 + Vite SPA in `ui/`. Every
`*.scss` edit is hand-mirrored into the matching `*.css` (no sass build step). `src/routes/routes.ts`
and `src/swagger/swagger.json` are tsoa-generated — regenerate, never hand-edit. v2 source:
`Draft_Template for Letter of Recommendation - v2.docx`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = member request fields, US2 = v2 letter content, US3 = signatories

---

## Phase 1: Setup

- [X] T001 Extract the v2 body paragraphs verbatim from `Draft_Template for Letter of Recommendation - v2.docx` and record them (with variable placeholders: company, project/tender reference, member values) in a comment block at the top of `src/services/recommendationLetterText.ts` to drive T012. Confirm the Thomas signature box in `src/config/recommendationLetterConfig.ts` is unchanged.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: These shared type/model changes block US1 and US2. Keep them in one change so
`tsc` stays green.

- [X] T002 In `src/types/businessLetter.types.ts`, expand `CreateBusinessLetterRequest.addressee` and `BusinessLetterRequestDto.addressee` to `{ title, fullName, attn, city, country, address, reference }` (all strings; `reference` = project/tender reference per research R2). Keep the top-level tracking `reference` untouched.
- [X] T003 In `src/models/businessLetterRequest.model.ts`: (a) add the new `addressee` sub-fields (`title`/`fullName`/`attn`/`city`/`country`/`address`/`reference`) with `default: ""` + sensible `maxlength` (schema-optional per research R3); (b) rename the `LetterSchema` recipient keys to `recipientTitle`/`recipientFullName`/`recipientAttn`/`recipientCity`/`recipientCountry`/`recipientAddress` (drop `recipientCompany`/`recipientStreet`); (c) update `mapBusinessLetterRequest` to emit the new `addressee` fields.
- [X] T004 In `src/types/recommendationLetter.types.ts`, change `LetterFields` recipient keys to `recipientTitle`/`recipientFullName`/`recipientAttn`/`recipientCity`/`recipientCountry`/`recipientAddress` and update `LETTER_FIELD_KEYS` to match (keep `reference`, `companyName`, `salutation`, `companyLocation`, `industry`, `productsServices`, `projectName`, `closing`).

**Checkpoint**: Shared types/model compile; stories can proceed.

---

## Phase 3: User Story 1 — Member submits structured addressee + reference (Priority: P1)

**Goal**: Member form + stored request + summary PDF carry Title, Full Name, Attn, City, Country,
Address, Reference (all required).

**Independent Test**: Submit the member form — blanks are rejected; a valid submit stores the fields
and they appear on the request-summary PDF.

- [X] T005 [US1] In `src/controllers/businessLetter.controller.ts`, validate the seven addressee fields as required for new submissions (non-empty, within maxlength), persist them on `addressee`, and return `VALIDATION_ERROR` details keyed by `addressee.<field>`.
- [X] T006 [US1] In `src/services/businessLetterPdf.ts`, render the new addressee fields (Title / Full Name / Attn / City / Country / Address) and the project/tender Reference in the request-summary layout, replacing the single "Address" line.
- [X] T007 [US1] In `ui/src/Components/Dashboard/BusinessLetter/BusinessLetter.tsx`: add the seven fields to `FormValues`, `initialValues`, the Yup `validationSchema` (all required, length-limited), the form JSX (reuse `.bl-field`/`.bl-row`), `toPayload` (→ `addressee.{…}`), and `SERVER_FIELD_MAP` (`addressee.title` → `title`, etc.). Remove the old single `addresseeAddress` field.
- [X] T008 [P] [US1] Update `ui/src/Components/Dashboard/BusinessLetter/BusinessLetter.scss` for the new field rows and hand-mirror into `BusinessLetter.css`.
- [X] T009 [P] [US1] Verify `ui/src/api/businessLetter.ts` passes the expanded payload type through unchanged (adjust only if it restates the addressee shape).

**Checkpoint**: Member can submit the seven required fields; they persist and show on the summary PDF.

---

## Phase 4: User Story 2 — Admin edits the v2 letter + recipient block (Priority: P1)

**Goal**: Admin editor recipient block = new fields, prefilled from the request; generated letter uses
v2 wording with no numbered sections.

**Independent Test**: Open a request in the editor — recipient fields + reference prefill; View/Download
renders the v2 paragraphs and recipient block.

**Depends on**: Phase 2 (types/keys).

- [X] T010 [US2] In `src/services/recommendationLetterText.ts`, update `LIMITS` and `LABELS` to the new recipient keys; set the required sets appropriately (the six recipient fields + reference required to save, per spec FR1/FR4).
- [X] T011 [US2] In `src/services/recommendationLetterText.ts`, rewrite `buildDefaultLetter` to map the request's structured `addressee` (title/fullName/attn/city/country/address) → the `recipient*` fields and `addressee.reference` → `reference`; keep a fallback that splits the legacy `addressee.address` string when the structured fields are absent (research R3).
- [X] T012 [US2] In `src/services/recommendationLetterText.ts`, replace `buildSections()` with the v2 body: an ordered list of paragraphs (no headings) using the v2 wording from T001, with variables (`companyName`, `projectName`/`reference`, member values) filled; update `DEFAULT_CLOSING` / default `salutation` / default `reference` to the v2 presets. Keep `validateLetter`/`savedLetter` iterating over the new key set.
- [X] T013 [US2] In `src/services/recommendationLetterPdf.ts`, draw the recipient block from the new fields and render the v2 body as plain paragraphs (remove the numbered-section heading draw; keep wrap/leading/`ensureSpace`). Confirm subject/reference/salutation placement matches v2.
- [X] T014 [US2] In `ui/src/Components/Dashboard/RecommendationLetters/LetterEditor.tsx`, replace the recipient `TextField`s (Company/Street/City/Country) with Title / Full Name / Attn / City / Country / Address, update the Yup `base`/`saveSchema`/`previewSchema` keys and labels, and keep the Reference field (relabel to "Reference (Project / Tender / Initiative)").
- [X] T015 [P] [US2] Verify `src/controllers/recommendationLetterAdmin.controller.ts` still compiles against the new `LetterFields`/`validateLetter`/`buildDefaultLetter` (adjust any field references it names directly).

**Checkpoint**: v2 letter renders with the new recipient block; prefill works for new and legacy requests.

---

## Phase 5: User Story 3 — v2 signatories (Priority: P2)

**Goal**: Philip Hölzer (Club Director) + Thomas Hochberger (General Manager); Jan removed.

**Independent Test**: Generated PDF shows the two signatories; Thomas image renders; Philip slot shows
line + name/title; no Jan references.

- [X] T016 [US3] In `src/config/recommendationLetterConfig.ts`, set `SIGNATORIES` to `[{ name: "Philip Hölzer", title: "Club Director" }, { name: "Thomas Hochberger", title: "General Manager", signature: { file: "Thomas_Signature.pdf", box: {…unchanged} } }]`. Remove the Jan A Hussing entry and the `Jan_signiture.jpeg` reference (keep the image-embedding branch in `recommendationLetterPdf.ts` for future use).

**Checkpoint**: Signature block matches v2; no Jan references remain.

---

## Phase 6: Polish & Cross-Cutting

- [X] T017 Run `npx tsc --noEmit -p .` (backend) and fix any new errors from the key rename.
- [X] T018 Run `cd ui && npx tsc --noEmit -p .` (expect only baseline noise) and `cd ui && npm run build:client` (must pass).
- [X] T019 If any routed DTO shape changed (business-letter create/list), run `npm run tsoa:routes && npm run tsoa:spec` and confirm `swagger.json` reflects the new addressee fields.
- [ ] T020 Walk the `quickstart.md` manual checklist (US1/US2/US3 + regression); confirm a legacy request still opens and the public site is unchanged.

---

## Dependencies & Execution Order

- **Setup (T001)**: no dependencies.
- **Foundational (T002–T004)**: block US1 and US2; T002/T004 are different files ([P]-able), T003 depends on T002's types.
- **US1 (T005–T009)**: after Foundational. T005/T006 backend (different files, [P]); T007 form (needs T002 types); T008/T009 [P].
- **US2 (T010–T015)**: after Foundational. T010→T011→T012 share `recommendationLetterText.ts` (sequential); T013 after T012; T014 UI ([P] with backend); T015 [P] verify.
- **US3 (T016)**: independent of US1/US2 (config only) — can run any time after Setup.
- **Polish (T017–T020)**: after the stories you intend to ship.

## Parallel Opportunities

- Foundational: T002 + T004 in parallel; then T003.
- US1: T005 + T006 (backend) in parallel; T008 + T009 in parallel.
- US2: T014 (UI) in parallel with backend T010–T013; T015 in parallel.
- US3: T016 any time.

## Implementation Strategy

- **MVP**: Foundational + US1 (members can submit the required fields) → demo.
- **Then**: US2 (v2 letter body + recipient block) → demo.
- **Then**: US3 (signatories) → demo.
- Commit per phase; keep `.scss`+`.css` and type+model changes together. Backend restart needed to
  see model/text/PDF/config changes.

## Notes

- Reference collision: member's project/tender reference is `addressee.reference`, mapped to the
  letter's `reference` field — never the `BL-…` tracking id (research R2).
- Legacy requests (only `addressee.address`) must still open via the `buildDefaultLetter` fallback (R3).
- Jan's image-embedding code path stays; only the config entry + file reference are removed.
