# Feature Specification: Recommendation Letter — member view, receipt email & approve/send

**Feature Branch**: `010-recommendation-letter-member-view`
**Created**: 2026-10-14
**Status**: Planned
**Scope**: Member (user) dashboard + admin Recommendation Letters section + business-letter emails + letter PDF/body

## Summary

Give members the same editor-and-live-preview view of their recommendation letter that admins
have (feature 008), but as a **draft they can edit, not send**: their preview PDF carries a big
diagonal 20%-opacity "DRAFT" watermark and shows **no signatures**. Remove the "letter type"
choice from both the member and admin views. On submission, email a **receipt to the requester**
and refresh the **leadership notification** email (new template + a button that jumps admins back
to the Recommendation Letters page with the requests modal open). In the admin requests modal add
an **Approve** action (status marker) beside **Send**. Restructure the letter body into **three
editable parts** (bold intro / main / closing) and make the editor form **scrollable within ~70%
of the viewport**.

## User Scenarios & Testing

### US1 — Member sees and edits their letter as a DRAFT (Priority: P1) 🎯 MVP

A member opens their Recommendation Letter request in the dashboard and gets the same
editor-left / live-preview-right layout admins use. The member can edit the letter fields and
save the draft, and the preview refreshes on field focus-out. The member **cannot** send or
approve. The member's preview PDF shows a large diagonal **"DRAFT"** watermark at ~20% opacity
across the A4 page and **omits all signatures**.

**Acceptance**: A member opening their request sees the editor + live preview; editing a field
and blurring refreshes the preview; the preview PDF has the diagonal DRAFT watermark and no
signature blocks; there is no Send or Approve control in the member view; saving persists the
draft and reloads it unchanged.

### US2 — Receipt email to the requester + refreshed leadership email (Priority: P1)

When a member submits a business-letter request, in addition to the leadership notification the
member (requester) receives a **receipt email** confirming the request and quoting its reference.
The leadership notification uses the updated template (provided HTML, with the "Letter type" row
removed) and ends with a **button** linking admins to the dashboard Recommendation Letters page
with the requests modal already open.

**Acceptance**: Submitting a request sends two emails — a receipt to `requester.email` and the
leadership notification to the configured recipients; the leadership email renders the new layout
with no "Letter type" row and a working "Open in dashboard" button; both sends are fire-and-forget
(a failed email never fails the submission) and their outcome is recorded.

### US3 — Admin Approve + Send in the requests modal (Priority: P2)

Inside the admin requests modal each request shows two actions in order: **Approve** then **Send**.
Approve marks the request as approved (records who/when) for tracking and visibility; it does **not**
block Send. Send keeps its existing behaviour and works whether or not the request is approved.

**Acceptance**: The modal rows (and/or the open request) show an Approve button before Send;
Approve flips the request to an "Approved" state shown in the list; Send still works independently
of approval; the approved state and approver/time are recorded and surfaced.

### US4 — Three-part letter body (Priority: P2)

The letter body is three editable text areas instead of the single closing field + auto-generated
paragraphs: **Intro** (rendered bold), **Main**, and **Closing**. Each has a sensible default and
an appropriate number of rows. The PDF renders the intro in bold, the main block (preserving
paragraph breaks) in regular, then the closing in regular.

**Acceptance**: The editor shows three body inputs with defaults; the generated PDF shows the intro
bold, the main body, and the closing, in that order; existing saved drafts still open (legacy
`closing` maps into the new closing field).

### US5 — Remove "letter type" from both views (Priority: P3)

The "letter type" selector is removed from the member request form and from the admin view, and the
"Letter type" row is removed from the leadership notification email. No view requires choosing a
letter type.

**Acceptance**: Neither the member form nor the admin screen shows a letter-type choice; submission
works without it; the leadership email has no "Letter type" row; existing records still load.

### US6 — Scrollable editor within ~70% of the viewport (Priority: P3)

The editor form scrolls inside a region sized to the viewport minus the dashboard header and the
section title (≈70vh), so the action bar/preview stay in view while the fields scroll.

**Acceptance**: With a long letter the fields scroll within their pane; the page itself does not
grow a second scrollbar; the action bar stays reachable.

## Success Criteria

- SC1: A member can open, edit, save and preview their letter as a watermarked, signature-free DRAFT; they have no way to send or approve it.
- SC2: Every submission produces a requester receipt email and a leadership notification in the new template; neither can fail the submission.
- SC3: Admins can Approve (status only) and Send independently from the requests modal; approval state is visible and recorded.
- SC4: The letter body is authored as three parts and renders intro-bold / main / closing in the PDF.
- SC5: No view offers a letter-type choice; existing data still loads.
- SC6: The editor form scrolls within ~70% of the viewport without a page-level second scrollbar.
- SC7: The public site and unrelated dashboard sections are visually and behaviourally unchanged.

## Assumptions

- **Member view = editable draft, no send** (user-confirmed): members edit + save + preview their own
  letter; only admins approve/send. (Rules out full admin parity.)
- **Approve = status marker, Send independent** (user-confirmed): Approve does not gate Send.
- The member preview reuses the same PDF generator with `{ draft: true, signatures: false }`; the
  admin preview/send keep `{ draft: false, signatures: true }`.
- "DRAFT" watermark: single large word drawn once along the page diagonal (bottom-left → top-right),
  ~20% opacity, under the text, on every page of the member preview only.
- The three body defaults are the wording supplied in the request (intro, the long main block, and the
  one-line closing). The main block is free text (no server-side auto-substitution of company/project).
- The leadership email migrates from a hard-coded DB template id to the local-file provisioning pattern
  used by the other transactional emails; the receipt email is a new provisioned template.
- The "Open in dashboard" button targets a dashboard URL the SPA reads to open Recommendation Letters
  with the requests modal (e.g. a query/hash the page honours).
- `letterType` stays in the data model (optional, defaulted) for back-compat but is removed from all UI
  and from the email.

## Out of Scope

- Changing who the signatories are, or adding Philip Hölzer's signature image.
- Member sending/approving, or any member-visible signatures.
- Translating the letter (DE) or changing the existing delivery (admin "send") email with the PDF attachment.
- Reworking the industry-sector/tender features.
