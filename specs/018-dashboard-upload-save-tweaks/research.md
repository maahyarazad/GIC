# Research: Dashboard Upload & Save Improvements

## R1 — Source of "server" upload progress

- **Decision**: Use the browser's upload-progress events, reported through axios `onUploadProgress` on each file's request. These count the bytes the server side of the connection has accepted. Once a file reaches 100% sent, the UI shows a short "Processing…" state until the server's response confirms that the file was stored. A file is only marked done when that response arrives.
- **Rationale**: The bytes the client has sent are the same as the bytes the server's network stack has received, so this reflects what the server got. The project already uses the same pattern for presentations (`ui/src/api/presentations.ts`, `UploadProgress.tsx`). A separate server-to-client progress channel (SSE or websocket keyed by an upload id) would need a streaming multipart parser in place of multer's memory storage, a new endpoint, and correlation state. It also would not work reliably behind the reverse proxy: proxies such as nginx buffer the whole request body by default, so server-observed progress would jump straight from 0% to 100%.
- **Alternatives considered**: (a) SSE progress endpoint plus busboy stream counting: rejected because of its complexity and the proxy buffering problem. (b) Polling a progress endpoint: same problems, plus extra load. (c) Indeterminate spinner only: rejected because it fails FR-015 and SC-005.

## R2 — Multi-file transport

- **Decision**: Send one `POST /api/v1/files` request per file, **sequentially**, in selection order.
- **Rationale**: The existing endpoint and its single-file contract stay unchanged, which matters because `Blog.tsx` also uses it. Each file succeeds or fails on its own (FR-017). Per-file progress maps directly onto one request each. Sequential sends keep the bandwidth for one file at a time, so each bar moves steadily (SC-005) and the server never holds more than one 50 MB buffer from this client at once.
- **Alternatives considered**: (a) One multipart request with `@UploadedFiles`: a single failure or limit breach rejects the whole batch, and progress cannot be split per file. (b) Parallel requests: the bars move unevenly, server memory spikes with memory storage, and the speed gain is small for staff-sized batches.

## R3 — Batch progress formula

- **Decision**: Batch percent = Σ loaded bytes ÷ Σ file sizes. Failed files count as fully "done" for the batch figure, so the bar still reaches 100%.
- **Rationale**: Weighting by bytes stops one large file from making the bar crawl and then jump, which is what an average of per-file percentages would do.

## R4 — Server access control for presentations and files

- **Decision**: `POST /api/v1/presentations` switches from `authMiddleware` to `adminAuthMiddleware` (admin and procurement). `POST /api/v1/files` and `DELETE /api/v1/files/{id}`, which have **no auth guard today**, get `adminAuthMiddleware` too.
- **Rationale**: FR-003 requires the server to refuse member uploads. FR-019 requires the existing "who may upload" rule to hold for every file in a batch, and the UI already restricts `file_management` to admin and procurement. Their only other caller, `Blog.tsx`, is also admin and procurement only. `GET /files` stays as it is, so read access is unchanged.
- **Alternatives considered**: A role check inside the controller body: rejected because the codebase already applies role checks with `@Middlewares(...)`.

## R5 — Hiding the Manage Presentations tab

- **Decision**: Remove `"user"` from `accessControl.manage_presentations` in `ui/src/Pages/Dashboard/Dashboard.tsx`. The code that hides the tab and redirects members to their default tab already exists and needs no changes.
- **Rationale**: `filteredMenuItems` already drives both the menu and the `?tab=` resolver, and a disallowed tab already falls back to `defaultTab` with a `replace` navigation (FR-002). The member Events modal (`EventPresentationsModal`) reads through `GET /presentations`, which stays on `authMiddleware` (FR-005).

## R6 — Newsletter save semantics

- **Decision**: **Save** calls `submitArticle(form.html, { stay: true })` and **Save and Close** calls `submitArticle(form.html)`. Change the error path so that a failed save never switches the view, which already holds because `setView("list")` only runs after a successful request. Both buttons are disabled while `submitting` is true. The Save button is `type="button"`, and Save and Close keeps `type="submit"`, so pressing Enter in the title or subject field still saves and closes as it does today.
- **Rationale**: The stay path from feature 012 already converts a newly created article into the article being edited (FR-009). The only new code is the button wiring.
- **Alternatives considered**: Making Enter trigger Save rather than Save and Close. Rejected because it changes existing behaviour without being asked.

## R7 — Leaving the page during upload

- **Decision**: Register a `beforeunload` handler only while a batch is in flight. To keep the user from changing tabs inside the SPA, the overlay is modal over the dashboard content and the upload button is disabled. Blocking navigation inside the router is out of scope.
- **Rationale**: This satisfies FR-020 for closing the tab or reloading the page, with very little code. The spec's Assumptions already exclude cancelling a batch.
