# Contract: Presentations REST API

All routes are tsoa controller methods on `PresentationController` (`@Route("api/v1/presentations")`),
which regenerates `src/routes/routes.ts`. Auth is the existing cookie-JWT scheme. Responses use the
shared `ApiResponse` envelope (`createSuccessResponse` / `createErrorResponse`).

Auth legend: **Auth** = `authMiddleware` (any signed-in user); **Admin/Owner** = `authMiddleware`
+ ownership-or-`requireRoles(["admin"])` check.

---

## POST `/api/v1/presentations`  — upload & attach

- **Auth**: Auth
- **Consumes**: `multipart/form-data`
- **Limits**: multer `fileSize = 50 MB`
- **Form fields**:
  - `file` (required) — the presentation file (`@UploadedFile`).
  - `eventId` (required) — target event id.
  - `title` (required) — display title.
- **Success** `201`:
  ```json
  { "success": true, "message": "Presentation uploaded", "data": {
      "id": "665f...", "title": "Q3 Deck", "eventId": "6601...",
      "originalName": "q3.pdf", "contentType": "application/pdf",
      "size": 10485760, "createdAt": "2026-10-19T12:00:00.000Z",
      "viewUrl": "/api/v1/presentations/665f.../view" } }
  ```
- **Errors**:
  - `400 NO_FILE` — no file provided.
  - `400 INVALID_FILE_TYPE` — content type/extension not in allowed set.
  - `400 INVALID_EVENT` — `eventId` missing or not an existing event.
  - `400 MISSING_TITLE` — title empty.
  - `413 FILE_TOO_LARGE` — exceeds 50 MB (multer `LIMIT_FILE_SIZE`).
  - `401` — not authenticated.

## GET `/api/v1/presentations?eventId=:eventId`  — list by event

- **Auth**: Auth (any signed-in member — FR-010)
- **Query**: `eventId` (required).
- **Success** `200`:
  ```json
  { "success": true, "data": { "presentations": [
      { "id": "665f...", "title": "Q3 Deck", "eventId": "6601...",
        "uploadedBy": "6500...", "originalName": "q3.pdf",
        "contentType": "application/pdf", "size": 10485760,
        "createdAt": "2026-10-19T12:00:00.000Z",
        "viewUrl": "/api/v1/presentations/665f.../view" } ] } }
  ```
- **Errors**: `400` missing `eventId`; `401` unauthenticated.

## GET `/api/v1/presentations/:id/view`  — protected file view (FR-006, FR-007)

- **Auth**: Auth — **unauthenticated requests MUST receive 401 and no bytes.**
- **Behavior**: Streams the file from `file_storage/<storedName>` with the recorded `Content-Type`
  and `Content-Disposition: inline; filename="<originalName>"` so it opens in a new tab.
- **Success** `200`: raw file bytes.
- **Errors**:
  - `401` — not authenticated (no bytes served).
  - `404 NOT_FOUND` — presentation record or file missing/deleted.

## DELETE `/api/v1/presentations/:id`  — delete (FR-011)

- **Auth**: Admin/Owner — uploader (`uploadedBy == req.user`) or `admin` role.
- **Behavior**: Removes the DB record and unlinks the disk file.
- **Success** `200`: `{ "success": true, "message": "Presentation deleted" }`.
- **Errors**: `401` unauthenticated; `403 FORBIDDEN` not owner/admin; `404 NOT_FOUND`.

---

## Event DTO extension (consumed by member Events view)

`GET /api/v1/events` (existing) member DTO gains `presentationCount: number`. Badge shows when
`presentationCount > 0`. No new endpoint; aggregation added to the existing events query.

## Notes

- `src/routes/routes.ts` is tsoa-generated — add decorated methods to `PresentationController` and
  regenerate; do not hand-edit the routes file.
- Presentations are intentionally **absent** from the `/uploads` static mount (`src/server.ts`).
