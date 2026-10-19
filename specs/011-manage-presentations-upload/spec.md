# Feature Specification: Manage Presentations — upload presentations under events

**Feature Branch**: `011-manage-presentations-upload`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Add a new section, 'Manage Presentations' to dashboard, so that members or users can upload their presentations under each event (one-to-many relationship). These presentations should have a protected route for viewing. The presentation links will then be referenced in the newsletter through the rich text editor. Other members should also be able to view them in the event section. Add another tag for the events, like `<span class="event-status-badge event-status-badge--attending">Attending</span>`. The tag will display the list of attached presentations in the dashboard modal, and from there each presentation will open in a new tab. Set 50 MB as the maximum upload size, and use an upload loader so that users can see how long the upload will take."

## Summary

Give members a **Manage Presentations** area in the dashboard where they upload presentation
files and attach each to an event. An event can hold **many** presentations (one-to-many). Each
uploaded presentation is viewable only through a **protected route** (sign-in required) — never the
existing public `/uploads` static mount. Signed-in members see a **presentations badge** on event
cards (same visual family as the existing `event-status-badge--attending` tag); clicking an event
with presentations opens the event's dashboard modal listing its presentations, each opening in a
**new tab**. Newsletter authors reference a presentation's protected link from the Quill rich-text
editor. Uploads are capped at **50 MB** and show an **upload-progress loader** (percent / bar).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload a presentation and attach it to an event (Priority: P1)

A signed-in member opens **Manage Presentations**, picks an event, chooses a file (≤ 50 MB), gives
it a title, and uploads. A progress loader shows upload percentage until completion; the
presentation then appears in that event's list.

**Why this priority**: This is the core capability — without upload + attach, nothing else in the
feature has data to act on. It is the MVP.

**Independent Test**: Sign in as a member, upload one file against one event, and confirm it is
stored, listed under that event, and nothing else in the dashboard is required for it to work.

**Acceptance Scenarios**:

1. **Given** a signed-in member on Manage Presentations, **When** they select an event, a title, and a file ≤ 50 MB and submit, **Then** a progress loader runs to 100% and the presentation is listed under that event.
2. **Given** a file larger than 50 MB, **When** they attempt to upload, **Then** the upload is rejected before/at submission with a clear "exceeds 50 MB" message and nothing is stored.
3. **Given** an upload in progress, **When** the member waits, **Then** the loader reflects real upload progress (0→100%) rather than an indeterminate spinner.

---

### User Story 2 - View a presentation through a protected route (Priority: P1)

Only signed-in users can open a presentation. Requesting the presentation's view URL while signed
out returns an auth error (no file bytes); signed in, the file opens/downloads in a new tab.

**Why this priority**: The protected-route requirement is explicit and a security boundary;
presentations must not leak via the public static mount.

**Independent Test**: With a known presentation id, request its view URL with and without a valid
session cookie and confirm bytes are served only when authenticated.

**Acceptance Scenarios**:

1. **Given** a presentation exists, **When** an unauthenticated request hits its view route, **Then** the server responds 401 and serves no file bytes.
2. **Given** a signed-in member, **When** they open the view route, **Then** the file is served with the correct content type and opens in a new tab.
3. **Given** the public `/uploads` static mount, **When** a presentation's stored path is guessed there, **Then** it is NOT reachable through the public mount (presentations are stored/served only via the protected route).

---

### User Story 3 - See which events have presentations and open them from the modal (Priority: P2)

On the Events section, event cards that have attached presentations show a **badge** (same style as
the Attending tag). Opening that event shows a dashboard modal listing its presentations; clicking
one opens it in a new tab via the protected route.

**Why this priority**: Makes presentations discoverable to all members, not just the uploader —
delivers the "other members can view them in the event section" requirement.

**Independent Test**: Attach a presentation to an event, then as any signed-in member view Events and
confirm the badge appears, the modal lists the presentation, and clicking opens a new tab.

**Acceptance Scenarios**:

1. **Given** an event with ≥ 1 presentation, **When** a member views Events, **Then** the card shows a presentations badge in the `event-status-badge` family.
2. **Given** an event with presentations, **When** the member opens its modal, **Then** each presentation is listed with its title and opens in a new tab on click.
3. **Given** an event with no presentations, **When** a member views it, **Then** no presentations badge is shown.

---

### User Story 4 - Reference a presentation link in the newsletter (Priority: P3)

A newsletter author pastes/inserts a presentation's protected view URL as a link in the Quill
editor, so recipients who are signed in can open it.

**Why this priority**: Reuses the existing editor's link tool; valuable but depends on P1–P2 existing
first.

**Independent Test**: Copy a presentation's protected URL, insert it as a link in the newsletter
editor, and confirm the saved HTML contains the link.

**Acceptance Scenarios**:

1. **Given** a presentation's protected URL, **When** the author inserts it via the editor's link tool, **Then** the newsletter body stores a working link to the protected route.

---

### Edge Cases

- Upload interrupted mid-transfer (network drop): loader surfaces an error and no partial record is listed.
- Unsupported / disallowed file type: rejected with a clear message. (Allowed types — see Assumptions / NEEDS CLARIFICATION.)
- File exactly at 50 MB boundary is accepted; one byte over is rejected.
- Deleting an event with attached presentations: presentations are removed or orphaned — see FR-012.
- Two presentations with the same title under one event: allowed; distinguished by id.
- Presentation view requested with a valid session but for a deleted presentation: 404.
- Who may delete a presentation: uploader and admins (see FR-011).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Manage Presentations" dashboard section available to signed-in members/users.
- **FR-002**: Users MUST be able to upload a presentation file and attach it to exactly one event, with a required title.
- **FR-003**: An event MUST support many presentations (one-to-many: event → presentations).
- **FR-004**: System MUST reject uploads larger than 50 MB, enforced on the server (and surfaced in the UI before submit where possible).
- **FR-005**: The upload UI MUST display real upload progress (percentage/bar), not only an indeterminate spinner.
- **FR-006**: System MUST serve each presentation only through an authenticated ("protected") route; unauthenticated requests MUST receive 401 and no file bytes.
- **FR-007**: Presentation files MUST NOT be reachable through the existing public `/uploads` static mount.
- **FR-008**: Event cards MUST show a badge (in the existing `event-status-badge` style family) when the event has ≥ 1 presentation.
- **FR-009**: The event dashboard modal MUST list the event's presentations, each opening in a new browser tab via the protected view route.
- **FR-010**: All signed-in members MUST be able to view presentations attached to any event (not only ones they uploaded).
- **FR-011**: The uploader and admins MUST be able to delete a presentation; a deleted presentation MUST stop being listed and its view route MUST return 404.
- **FR-012**: When an event is deleted, its presentations MUST [NEEDS CLARIFICATION: be deleted (cascade) or retained/orphaned?].
- **FR-013**: Newsletter authors MUST be able to insert a presentation's protected view URL as a link through the existing rich-text editor.
- **FR-014**: System MUST record, per presentation: title, owning event, uploader, original filename, size, content type, and created-at.
- **FR-015**: System MUST restrict uploadable file types to [NEEDS CLARIFICATION: which types? e.g. PDF/PPT/PPTX only, or any file?].

### Key Entities *(include if feature involves data)*

- **Presentation**: A member-uploaded file attached to one event. Attributes: id, title, event reference (many-to-one), uploader (user reference), original filename, stored filename/path, content type, size (bytes), createdAt. Stored file lives outside the public static mount.
- **Event**: Existing entity (feature 003/004). Gains a derived relationship: an event has zero-or-more Presentations. The member event view gains a signal (count or flag) of attached presentations for the badge.
- **User (member)**: Existing entity; the uploader and the audience. Any signed-in user may view; uploader/admin may delete.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member can upload a ≤ 50 MB presentation and see it attached to an event in under 60 seconds on a typical connection, with visible progress throughout.
- **SC-002**: 100% of unauthenticated requests to a presentation view route are denied with no file bytes served.
- **SC-003**: 0% of presentations are retrievable through the public `/uploads` static mount.
- **SC-004**: Every event with ≥ 1 presentation shows the badge, and every listed presentation opens in a new tab on click (100% of cases in manual QA).
- **SC-005**: Uploads over 50 MB are rejected 100% of the time with a clear message.

## Assumptions

- Authentication reuses the existing cookie-JWT system (`authMiddleware` for any signed-in user; `requireRoles`/`adminAuthMiddleware` for admin actions).
- "Members or users" means any authenticated account; no new role is introduced.
- The badge reuses the existing `EventCard` `badge` prop and the `event-status-badge` SCSS family; a new tone (e.g. `presentations`) is added alongside `attending`/`full`.
- The "dashboard modal" is the event-detail interaction opened from an event card in the Events section.
- The newsletter integration is link insertion via the existing Quill editor — no new embed type.
- Default allowed types pending clarification: assume PDF + PowerPoint (`.pdf`, `.ppt`, `.pptx`) unless told otherwise.
- Default on event deletion pending clarification: assume cascade delete of attached presentations.
- Storage reuses the server's `file_storage` directory on disk, with DB metadata, consistent with the existing file-upload pattern — but served via a protected controller route rather than the static mount.
