# Feature Specification: Recommendation Letters — editor layout & live preview

**Feature Branch**: `006-industry-sector-tenders` (rides existing branch; 006 not yet merged)
**Created**: 2026-10-13
**Status**: Planned
**Scope**: UI-only, Dashboard → Recommendation Letters section

## Summary

Rework the Dashboard "Recommendation Letters" screen so an admin spends the full width on
the letter they are editing, with a live PDF preview beside it, instead of a permanently
docked requests list.

## User Scenarios & Testing

### US1 — Pick a request from a searchable modal (Priority: P1)

The requests list no longer occupies a column. A toolbar button (e.g. "Requests") opens a
`dashboard-modal` listing every letter request with a **search box** that filters by
reference, requester name, email, and company. Selecting a request loads it into the editor
and closes the modal. Send-from-list behaviour is preserved inside the modal.

**Acceptance**: Opening the modal shows all requests; typing narrows the list live; picking a
row loads that letter and closes the modal; the unsaved-changes guard still runs before
switching requests.

### US2 — Editor on the left, live PDF preview on the right (Priority: P1)

With the requests list gone from the page, the editor form moves to the **left** column and
the freed right column shows a **live PDF preview** of the letter. The preview refreshes when
a field loses focus (`onBlur`). The preview reuses the existing inline-PDF endpoint and renders
the real generated PDF in an `<iframe>`.

**Acceptance**: Editing a field and tabbing/clicking away refreshes the preview to the real
PDF; an incomplete draft that fails preview validation shows a short message in the preview
pane (no crash, no popup); no preview refresh fires while a field is still focused.

### US3 — Action buttons at the top (Priority: P2)

The `rl-editor__actions` bar (Save / View / Download PDF) moves from the bottom of the form to
the **top** (editor header region), so the primary actions are visible without scrolling.

**Acceptance**: Save / View / Download appear above the form fields; all three keep their
current behaviour (save, open-in-new-tab, download) and disabled/busy states.

## Success Criteria

- SC1: An admin can find and open any request through the modal search without scrolling a long list.
- SC2: The letter being edited uses the full editor width; the live preview reflects the last
  focus-out within one refresh.
- SC3: Save / View / Download are reachable at the top of the editor at all times.
- SC4: The public site and all other dashboard sections are visually unchanged.

## Assumptions

- "Live view" = the real generated PDF (admin's choice), via `POST /admin/letter-requests/{id}/letter/pdf?disposition=inline`.
- Preview refresh is debounced and only fires on focus-out, not on every keystroke.
- No backend changes: all endpoints (`list`, `get`, `save`, `pdf`, `send`) already exist.
- Rides the current `006-industry-sector-tenders` branch (consistent with 007).

## Out of Scope

- Changes to the letter content, validation rules, or the PDF layout itself.
- Backend/API changes.
- The member-facing BusinessLetter request form.
