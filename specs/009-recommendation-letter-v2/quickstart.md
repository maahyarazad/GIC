# Quickstart / Validation: Recommendation Letter v2

## Prerequisites

- Backend running (`npm run dev`, PORT 5612) — needed for request submit, prefill, and PDF.
- `file_storage/Thomas_Signature.pdf` present on the server (git-ignored).
- UI: `cd ui && npm run dev`, or validate with `npm run build:client`.
- A member account (to submit a request) and an admin account (to edit/send). Do NOT trigger live
  emails against shared SMTP without the user doing it.

## Build / typecheck gate

```bash
npx tsc --noEmit -p .                 # backend — expect clean
cd ui && npx tsc --noEmit -p .        # UI — expect only known baseline noise
cd ui && npm run build:client         # must succeed
# If a routed DTO shape changed:
npm run tsoa:routes && npm run tsoa:spec
```

## Manual checklist

### US1 — Member request fields
- [ ] The request form shows required Title, Full Name, Attn, City, Country, Address, Reference.
- [ ] Submitting with any blank shows a validation error (client and server).
- [ ] A valid submit succeeds and appears in "My requests".
- [ ] The member's "Download PDF" (request summary) shows the new addressee fields + reference.

### US2 — v2 letter content
- [ ] Opening the request in the admin editor prefills Title / Full Name / Attn / City / Country /
      Address and the Reference from the member's submission.
- [ ] View/Download renders the **v2 wording** (flowing paragraphs, no "1./2./3." headings).
- [ ] The recipient block, subject, reference, and salutation render correctly.
- [ ] Save / View / Download / Send still work; legacy (old) requests still open without crashing.

### US3 — Signatories
- [ ] The PDF shows Philip Hölzer (Club Director) and Thomas Hochberger (General Manager).
- [ ] Thomas's signature image renders; Philip's slot shows line + name/title, no error.
- [ ] No "Jan A Hussing" or `Jan_signiture.jpeg` anywhere in the output or config.

### Regression
- [ ] Public site unchanged; other dashboard sections unchanged.
- [ ] `.scss` and `.css` committed together.

## Notes

- Backend restart required for model/text/PDF/config changes to take effect.
- v2 source: `Draft_Template for Letter of Recommendation - v2.docx` (repo root).
