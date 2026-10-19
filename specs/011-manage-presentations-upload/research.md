# Phase 0 Research: Manage Presentations

Consolidated decisions resolving the Technical Context unknowns and the spec's NEEDS CLARIFICATION
items. Format per decision: **Decision / Rationale / Alternatives considered**.

## 1. Protected file serving (vs. public `/uploads`)

- **Decision**: Serve presentation bytes through a new authenticated tsoa controller route, e.g. `GET /api/v1/presentations/:id/view`, guarded by `authMiddleware`. The controller reads the file from `file_storage` by the stored filename and streams it with the recorded content type and a `Content-Disposition` that lets the browser open it in a new tab. Store presentation files with an unguessable stored name (ObjectId-based) and do **not** add them to the public `/uploads` static mount.
- **Rationale**: `src/server.ts` currently mounts `file_storage` publicly at `/uploads` via `express.static` (lines ~118/191). The spec requires auth-gated viewing and explicitly that files are not reachable publicly. A controller route lets us enforce `authMiddleware` and 404 deleted records. Existing `file.controller.ts` already demonstrates the write-to-`file_storage` + `uploaded_files` metadata pattern.
- **Alternatives considered**: (a) Signed/expiring URLs on the static mount — more moving parts, still risks the public mount; (b) A second static mount with middleware — Express static + auth middleware is awkward to scope per-file and easy to misconfigure; (c) Moving to S3/presigned URLs — out of scope, no cloud storage currently configured.

## 2. Upload mechanism + 50 MB cap

- **Decision**: Use `multer` memory storage (as `file.controller.ts` does) with `limits: { fileSize: 50 * 1024 * 1024 }` on the presentations upload route, then `fs.writeFileSync` to `file_storage/<id>.<ext>`. Reject oversize with a 413/400 and a clear code. Validate content type server-side.
- **Rationale**: Matches the existing upload pattern; multer enforces the cap before the buffer is fully retained, and the UI can also pre-check `file.size`.
- **Alternatives considered**: Streaming to disk with multer disk storage (avoids holding 50 MB in memory) — reasonable optimization, but memory storage matches current code and 50 MB is tolerable; note as a possible follow-up in tasks.

## 3. Upload progress loader

- **Decision**: Frontend uses `axios` `onUploadProgress` to drive a determinate progress bar/percent in a new `UploadProgress` component. Disable the submit button while in flight; surface errors (including 413 oversize and network abort).
- **Rationale**: `axios` is already a dependency; `onUploadProgress` gives real byte-level progress, satisfying the "see how long the upload will take" requirement without extra libraries.
- **Alternatives considered**: `fetch` + `ReadableStream` progress — not natively supported for upload progress in browsers; `uppy`/`react-dropzone` — unnecessary new dependencies.

## 4. Event ↔ Presentation relationship + badge data

- **Decision**: Model one-to-many by storing `eventId` on each presentation (many-to-one back-reference), indexed. The member event DTO (`mapEvent`) gains a `presentationCount` (or boolean `hasPresentations`) computed by aggregating counts per event in the events list query. The badge shows when `presentationCount > 0`.
- **Rationale**: Back-reference on the child is the standard Mongoose one-to-many and avoids unbounded arrays on the event. `EventCard` already accepts a `badge` prop with tones; adding a `presentations` tone and a count lookup is minimal.
- **Alternatives considered**: Array of presentation ids on the event document — grows unbounded and complicates deletes; rejected.

## 5. Badge tone / UI reuse

- **Decision**: Add a new `EventCardBadgeTone` value `"presentations"` and a matching `.event-status-badge--presentations` SCSS rule in `EventCard.scss`, reusing the existing badge markup `<span class="event-status-badge event-status-badge--presentations">`. Decide badge precedence when both "Attending" and presentations apply (show both, or presentations takes a secondary slot) — see data-model note.
- **Rationale**: The requested markup is literally the existing badge family; least-surprise reuse.
- **Alternatives considered**: A brand-new badge component — redundant.

## 6. Event dashboard modal

- **Decision**: Add an `EventPresentationsModal` opened from an event card (Events section). It fetches/receives the event's presentations and renders each as a link opening the protected view route with `target="_blank" rel="noopener"`. Reuse the app's existing modal styling/pattern used elsewhere in the dashboard.
- **Rationale**: Events currently wire card `onClick` to attendance confirm; the modal adds a viewing affordance for presentations without disrupting attendance. Exact modal host (Bootstrap modal vs. existing custom modal) chosen during implementation to match siblings.
- **Alternatives considered**: Inline expansion on the card — cramped; a separate route/page — heavier than needed.

## 7. Newsletter integration

- **Decision**: No code change required beyond ensuring the protected view URL is copyable from Manage Presentations. Authors insert it via the existing Quill `link` toolbar button in `Newsletter.tsx`.
- **Rationale**: Quill already supports link insertion; the requirement is to *reference* links, not embed files.
- **Alternatives considered**: A custom Quill blot/embed for presentations — unnecessary for v1.

## 8. Resolved spec clarifications (reasonable defaults, flagged for confirmation)

- **FR-012 (event deletion)**: **Decision** — cascade-delete a deleted event's presentations (DB records + disk files). Rationale: avoids orphaned files and dangling badges. Confirm with stakeholder; easy to switch to "retain/orphan" if desired.
- **FR-015 (allowed file types)**: **Decision** — allow `.pdf`, `.ppt`, `.pptx` (PDF + PowerPoint) for v1, validated by content type + extension. Rationale: "presentations" strongly implies these; narrower surface is safer. Confirm whether other types (Keynote, images, video) are needed.

## Open questions deferred to stakeholder (non-blocking for design)

- Confirm cascade vs. retain on event delete (FR-012).
- Confirm the allowed file-type set (FR-015).
- Confirm whether a presentation may be re-assigned/moved between events after upload (assumed **no** for v1).
