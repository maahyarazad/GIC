# Feature Specification: Recommendation Letter v2 — expanded request fields, new body, new signatories

**Feature Branch**: `006-industry-sector-tenders` (rides existing branch; 006 not yet merged)
**Created**: 2026-10-14
**Status**: Planned
**Source template**: `Draft_Template for Letter of Recommendation - v2.docx` (repo root)

## Summary

Align the Recommendation Letter with the v2 Word template. Three coordinated changes:

1. **Expanded addressee/request fields** — the member's "Request for Letter of Recommendation"
   form (and the stored request) collects a structured addressee plus a project/tender reference.
2. **v2 letter body** — the generated letter uses the v2 wording (flowing paragraphs, no numbered
   sections) with the recipient block built from the new addressee fields.
3. **New signatories** — Jan A Hussing is removed; the letter is signed by **Philip Hölzer
   (Club Director)** and **Thomas Hochberger (General Manager)**.

## Clarifications (resolved 2026-10-14)

- Fields live in **both** the member request form and the admin editor (member supplies them; admin
  can edit before sending).
- The letter body is **rewritten** to the v2 paragraphs; the 3 numbered sections are dropped.
- Signatories are **Philip Hölzer + Thomas Hochberger**. Philip has **no signature image yet**, so
  his slot renders name + line only until a file is supplied; Thomas keeps `Thomas_Signature.pdf`.

## User Scenarios & Testing

### US1 — Member submits a structured addressee + reference (Priority: P1)

The member's request form replaces the single free-text "Address" with the required fields:
**Title, Full Name, Attn, City, Country, Address**, and a required **Reference**
(Project Name / Tender Number or Name / Business Initiative). All are required to submit.

**Acceptance**: Submitting without any of the seven shows a validation error; a valid submit stores
them on the request; the member's request-summary PDF shows the new fields.

### US2 — Admin edits the v2 letter and the recipient block (Priority: P1)

The admin Letter Editor's recipient block becomes Title / Full Name / Attn / City / Country /
Address, prefilled from the request's addressee; the Reference field is prefilled from the request's
reference. The generated letter (View / Download / Send) uses the **v2 body wording** with no
numbered section headings.

**Acceptance**: Opening a request prefills the new recipient fields and reference; the PDF renders
the v2 paragraphs with the recipient block, subject, and reference in place; existing Save / View /
Download / Send flows still work.

### US3 — v2 signatories (Priority: P2)

The letter is signed by Philip Hölzer (Club Director) and Thomas Hochberger (General Manager).
Jan A Hussing and the `Jan_signiture.jpeg` usage are removed.

**Acceptance**: The PDF shows two signatories in the new order; Thomas's signature image appears;
Philip's slot shows the signature line + name/title (no image) without error.

## Requirements

- **FR1**: Request `addressee` stores `title`, `fullName`, `attn`, `city`, `country`, `address`,
  all required (non-empty, length-limited); plus a required project/tender reference.
- **FR2**: The member form validates and submits the seven fields; server validation mirrors it;
  400 field errors map back to the form.
- **FR3**: `LetterFields` recipient keys change to the new structure; the admin editor renders them.
- **FR4**: Default/prefill maps the request addressee → letter recipient block and request reference
  → letter reference.
- **FR5**: The letter body is the v2 wording; `buildSections()` is replaced by v2 paragraphs and the
  PDF no longer draws numbered section headings.
- **FR6**: Signatories are Philip Hölzer (Club Director) + Thomas Hochberger (General Manager);
  signature image is optional per signatory.
- **FR7**: The request-summary PDF (member download) shows the new addressee fields + reference.

## Success Criteria

- SC1: A member cannot submit the request without all seven required fields.
- SC2: A generated letter matches the v2 template's wording, recipient block, and two signatories.
- SC3: No references to Jan A Hussing or `Jan_signiture.jpeg` remain in the letter output.
- SC4: Backend and UI typecheck; `build:client` succeeds; the public site is unaffected.

## Key Entities

- **BusinessLetterRequest.addressee** (expanded): title, fullName, attn, city, country, address.
- **BusinessLetterRequest reference fields**: existing tracking `reference` (BL-… id, unchanged) vs.
  the new **project/tender reference** supplied by the member — stored under a distinct name to avoid
  colliding with the tracking id (see research R2).
- **LetterFields** (admin editable): recipient block (title/fullName/attn/city/country/address),
  letterDate, companyName, reference, salutation, companyLocation, industry, productsServices,
  projectName, closing.
- **Signatory**: name, title, optional signature source.

## Assumptions

- The recommended company (`companyName`) and the member-recommendation body variables
  (industry, productsServices, projectName, companyLocation) are retained; v2 keeps referencing the
  company and the project/tender/initiative.
- The member's "Download PDF" remains the request-summary PDF (`businessLetterPdf.ts`); the v2 letter
  body changes apply to the admin letter PDF (`recommendationLetterPdf.ts`).
- Rides the current `006-industry-sector-tenders` branch (consistent with 007/008).

## Out of Scope

- The editor layout / live preview rework (that is feature 008).
- German-language (`de`) letter generation beyond existing behaviour.
- A signature image for Philip Hölzer (slot left image-less until a file is provided).

## Dependencies / Migration

- Existing requests have only `addressee.address`. New required fields must tolerate legacy docs:
  reads default missing fields to empty; validation applies to new submissions and admin save
  (see research R3 for the back-compat approach).
