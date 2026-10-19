# Feature Specification: Newsletter StudioEditor with base64 images, full-width

**Feature Branch**: `012-newsletter-studioeditor-base64`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Replace GrapesJS with StudioEditor from @grapesjs/studio-sdk/react in the newsletter editor. Also, update the configuration so images are stored as base64 in the newsletter section, and update the UI in that section so it uses the full width of the screen."

## Summary

Swap the newsletter article editor for the **GrapesJS Studio SDK** React component
(`StudioEditor` from `@grapesjs/studio-sdk/react`), a visual drag-and-drop builder. Images added in
the editor are **embedded as base64 data URLs** directly in the saved HTML (no upload endpoint), and
the newsletter editing area is widened to use the **full width of the screen**.

> **Note on the premise:** the current newsletter editor uses **Quill** (`QuillEditor`), not
> GrapesJS — there is no GrapesJS anywhere in the codebase. "Replace GrapesJS" is therefore read as
> "replace the current newsletter rich-text editor (Quill) with Studio SDK's StudioEditor."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compose and edit a newsletter with StudioEditor (Priority: P1)

An admin/procurement user opens the Newsletter "New Article"/edit view and sees the Studio SDK
visual editor in place of the old Quill editor. They design the email, and on submit the editor's
HTML is saved to the article exactly as the Quill HTML was before.

**Why this priority**: This is the core swap; nothing else works without the editor loading and
round-tripping content. It is the MVP.

**Independent Test**: Open the editor, make a change, submit, and confirm the saved article HTML
reflects the edit and renders in the existing preview.

**Acceptance Scenarios**:

1. **Given** the Newsletter compose/edit view, **When** it loads, **Then** the Studio SDK editor renders (Quill is gone).
2. **Given** an existing article with HTML, **When** it is opened for editing, **Then** its current HTML loads into the editor.
3. **Given** edits in the editor, **When** the user submits, **Then** the article's `html` is saved from the editor's exported HTML and the send/preview flow is unchanged.

---

### User Story 2 - Images embedded as base64 (Priority: P1)

When the user adds an image in the editor, it is stored **inline as a base64 data URL** in the
article HTML — no file is uploaded to the server and no asset endpoint is called.

**Why this priority**: Explicitly requested, and it defines the storage model for images in
newsletters; it must be settled with the editor swap.

**Independent Test**: Insert a local image in the editor, submit, and confirm the saved HTML
contains a `data:image/...;base64,...` `src` and that no asset upload request was made.

**Acceptance Scenarios**:

1. **Given** the editor, **When** the user adds an image from their device, **Then** the image is encoded as a base64 data URL in the HTML.
2. **Given** an image was added, **When** the article is saved and reopened, **Then** the image still renders from its embedded base64 data (no broken server links).
3. **Given** image insertion, **When** it happens, **Then** no request is made to an asset-upload endpoint.

---

### User Story 3 - Full-width newsletter editing UI (Priority: P2)

The newsletter section (at least while editing) uses the full width of the screen so the visual
editor has room to work, rather than the constrained dashboard content column.

**Why this priority**: Usability of the new editor; valuable but secondary to the editor working.

**Independent Test**: Open the editor and confirm it spans the full screen width with no cramped
column or horizontal overflow.

**Acceptance Scenarios**:

1. **Given** the newsletter editor is open, **When** it renders, **Then** it occupies the full screen width.
2. **Given** full-width mode, **When** viewing on smaller screens, **Then** there is no horizontal page scroll and the dashboard remains usable.

---

### Edge Cases

- Large base64 images inflate the saved HTML; the article `html` payload must stay within the server's JSON body limit.
- The editor is a heavy browser-only component; it must not break server-side rendering (SSR) or the initial page load.
- Opening legacy articles authored in Quill: their HTML should still load into StudioEditor for editing.
- Production domains require a valid Studio SDK license key; without one the editor may refuse to load.
- Sending the email: the exported HTML should carry the styling the recipient will see (inline styles for email clients).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The newsletter compose/edit view MUST use `StudioEditor` from `@grapesjs/studio-sdk/react` instead of the Quill editor.
- **FR-002**: The editor MUST load an existing article's HTML when editing and export HTML back to the article's `html` field on submit, preserving the existing save/send/preview flow.
- **FR-003**: Images added in the editor MUST be embedded as base64 data URLs in the HTML; no asset-upload endpoint may be called.
- **FR-004**: The newsletter editing UI MUST use the full width of the screen.
- **FR-005**: The editor MUST be loaded client-side only and MUST NOT break SSR or the rest of the dashboard.
- **FR-006**: The Studio SDK style sheet MUST be included so the editor renders correctly.
- **FR-007**: The editor MUST use the Studio SDK **email project type** (`project: { type: 'email' }`) and export email-ready HTML (styles applied inline where email clients require it). *(Resolved: email type chosen by stakeholder.)*
- **FR-008**: The Studio SDK license key MUST be supplied via configuration (`VITE_GRAPESJS_LICENSE_KEY`, defaulting to `DEMO_LOCALHOST_KEY`), not hard-coded. *(Open: a valid production key is still required before non-localhost deploy.)*
- **FR-009**: The old Quill editor MUST be removed from the **newsletter view only**. The `QuillEditor` component and the `quill` dependency MUST be kept because `Blog.tsx` still uses them.
- **FR-010**: The editor MUST persist via `storage: { type: 'self' }` with autosave (`autosaveChanges: 100`, `autosaveIntervalMs: 10000`), saving the exported HTML into the existing article `html` field only — no Studio project JSON is persisted and no DB schema changes.

### Key Entities *(include if feature involves data)*

- **Newsletter Article** (existing): unchanged schema; its `html` field now contains Studio-SDK-exported HTML, including base64 data URLs for any images. No new entities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of newsletter compose/edit sessions render the Studio SDK editor (Quill no longer appears).
- **SC-002**: 100% of images added via the editor are saved as base64 data URLs; 0 asset-upload requests occur.
- **SC-003**: An existing article's HTML loads into the editor and round-trips on save without content loss.
- **SC-004**: The editor spans the full screen width with no horizontal page scroll on supported breakpoints.
- **SC-005**: SSR and the dashboard continue to load without errors introduced by the editor.

## Assumptions

- The newsletter article still stores a single HTML string (`html`); the send and preview paths keep consuming it. No backend/API changes beyond tolerating larger HTML payloads.
- Roles that access Newsletter today (admin, procurement) are unchanged.
- Studio SDK embeds images as base64 by default when no asset storage is configured; an explicit base64 handler will be used to guarantee it.
- Default project type is the Studio SDK **web/HTML** type (keeps `html` output compatible with the existing pipeline); the email/MJML type is an option pending clarification.
- A Studio SDK license key is available (any string works on localhost; production needs a valid key), supplied via a Vite env var.
- "Full width of the screen" applies to the newsletter editing experience within the dashboard shell.
