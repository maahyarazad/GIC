# Phase 1 Data Model: Manage Presentations

## Entity: Presentation (new)

New MongoDB collection `presentations`, following the project's Mongoose + mapper conventions
(see `src/models/event.model.ts`, `src/controllers/file.controller.ts`).

| Field            | Type                      | Required | Notes |
|------------------|---------------------------|----------|-------|
| `_id`            | ObjectId                  | auto     | Exposed as `id` in DTOs. |
| `title`          | String (trim, maxlength ~160) | yes  | Member-supplied display title. |
| `eventId`        | ObjectId (ref `Event`)    | yes      | Many-to-one back-reference; **indexed**. |
| `uploadedBy`     | ObjectId (ref `User`)     | yes      | The uploader (from auth token). |
| `originalName`   | String                    | yes      | Original client filename (basename only; strip path). |
| `storedName`     | String                    | yes      | On-disk name in `file_storage`, e.g. `<_id>.<ext>` (unguessable). |
| `contentType`    | String                    | yes      | MIME type recorded at upload. |
| `extension`      | String                    | yes      | Resolved via `mime-types`. |
| `size`           | Number (bytes)            | yes      | Must be ≤ 52428800 (50 MB). |
| `createdAt`      | Date                      | auto     | `timestamps: true`. |
| `updatedAt`      | Date                      | auto     | `timestamps: true`. |

**Indexes**: `{ eventId: 1 }` (list-by-event and count aggregation); optionally `{ uploadedBy: 1 }`.

### Validation rules

- `size` ≤ 50 MB — enforced by multer `limits.fileSize` **and** rejected at the controller if exceeded.
- `contentType` / `extension` ∈ allowed set (default: `application/pdf`, `.ppt`, `.pptx` — see research.md FR-015).
- `title` required, non-empty after trim.
- `eventId` must reference an existing event (validated on create).
- `originalName` sanitized with `path.basename` so it cannot escape `file_storage`.

### Storage

- File bytes written to `file_storage/<storedName>` (same directory as existing uploads) but **not**
  exposed via the `/uploads` static mount. Served only through the protected view route.

### Lifecycle / state transitions

- **Created** on successful upload (record + file written atomically enough that a failed write does not leave a listed record).
- **Deleted** by uploader or admin → DB record removed and disk file unlinked; view route then returns 404.
- **Cascade** (default, FR-012): deleting the parent event removes all its presentations (records + files).

## Entity: Event (existing — extended)

No schema change. The **member event DTO** (`mapEvent` in `src/models/event.model.ts` /
`event.types.ts`) gains a derived field:

| Field               | Type    | Notes |
|---------------------|---------|-------|
| `presentationCount` | Number  | Count of presentations with this `eventId`; drives the badge (`> 0` → show). |

Computed by aggregating `presentations` grouped by `eventId` in the events-list query (single
aggregation / `$lookup` or a count map), avoiding an N+1 per event.

## Entity: User (existing — unchanged)

Referenced as `uploadedBy`. Any authenticated user may view; uploader or admin role may delete
(`requireRoles`).

## Relationships

```text
Event (1) ───< (many) Presentation >─── (1) User
   ▲ eventId (indexed)         uploadedBy ▲
```

- One event has zero-or-more presentations (one-to-many).
- One user may upload many presentations.

## Badge derivation

- `presentationCount > 0` → `EventCard` receives `badge = { label: "Presentations" (or count), tone: "presentations" }`.
- Precedence with the existing "Attending" badge: if an event is both attending and has
  presentations, show the presentations badge in addition to / adjacent to Attending (final visual
  precedence decided in implementation to match `EventCard.scss`); both belong to the
  `event-status-badge` family.
