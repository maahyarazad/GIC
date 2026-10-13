# Phase 1 Data Model: Industry Sector Selection & Tender Board

## Industry Sector (fixed constant, not a database entity)

Defined once in `src/config/industrySectors.ts`, imported by both the server and the UI ([R7](./research.md#r7--shared-sector-list-not-duplicated-strings)):

1. Energy, Oil & Gas, and Sustainability
2. Aerospace, Aviation, Industrial Manufacturing, and Automation
3. Construction and Infrastructure
4. Digital Technology and AI, Information Technology (IT), and Telecommunications
5. Chemicals and Petrochemicals
6. Pharmaceuticals and Life Sciences, Medical Technology, and Healthcare
7. Logistics and Supply Chain, and Transportation
8. Food and Beverage
9. Tourism and Hospitality
10. Retail and E-Commerce

## User (extension of existing `UserDocument` / `users` collection)

| Field | Type | Notes |
|---|---|---|
| `industrySectors` | `string[]` \| `undefined` | New. `undefined`/absent = not yet assigned (existing members pre-feature). Once set: always exactly 3 distinct values, each one of the 10 fixed sectors. |
| `industrySectorsSetAt` | `Date` \| `undefined` | New. Timestamp of the one permanent write; informational/audit only, not used for any business logic. |

**Validation rules**:
- Exactly 3 entries, each a member of the fixed sector list, no duplicates.
- Write-once: rejected (409) if `industrySectors` is already set on the target user, regardless of caller.
- No endpoint or payload shape exists that can update `industrySectors` on an already-assigned user — not merely disabled in the UI (FR-004).

**State transitions**: `unassigned → assigned` (one-way, one-time). No other transition exists.

## Tender (new `tenders` collection)

| Field | Type | Notes |
|---|---|---|
| `_id` | `ObjectId` | |
| `sector` | `string` | One of the 10 fixed sectors. Required. Immutable after creation. |
| `publisher` | `string` | "Who is publishing the tender." Required, trimmed, max length (e.g. 160). |
| `announcement` | `string` | "What is being publicly announced." Required, trimmed, max length (e.g. 2000). |
| `publishedAt` | `Date` | "When the tender was published." Required; member-supplied (may differ from `createdAt`, e.g. backdating an announcement made elsewhere first). |
| `deadline` | `Date` | "When the deadline for submission is." Required. |
| `closedByAdminAt` | `Date` \| `null` | Set only by the admin-close action ([R5](./research.md#r5--manual-admin-close-is-admin-only-not-adminprocurement)). `null` until then. |
| `attachment` | subdocument \| `null` | Optional. `{ filename, originalName, mimetype, size, path }`. `null` if the creator attached nothing ([R6](./research.md#r6--optional-file-attachment-reuses-existing-upload-handling)). |
| `creator` | subdocument | Snapshot at creation time, mirroring the `businessLetterRequest.requester` pattern: `{ userId: ObjectId, name: string, email: string }`. Snapshotting (rather than always joining live) keeps the displayed contact email stable per spec FR-016 even if the user's account email later changes, and avoids a join on every list render. |
| `createdAt` / `updatedAt` | `Date` | Mongoose `timestamps: true`. |

**Derived (not stored)**:
- `effectiveStatus: "open" | "closed"` — `closedByAdminAt != null ? "closed" : (now > deadline ? "closed" : "open")` ([R4](./research.md#r4--deadline-based-closed-status-without-a-scheduler)). Computed by the controller on every read/list response, never persisted.

**Validation rules**:
- `sector` must be one of the creator's own `industrySectors` at submission time, unless the creator's role is `admin` or `procurement` (who may pick any of the 10) ([spec FR-010](../spec.md), [FR-023](../spec.md)).
- `publisher`, `announcement`, `publishedAt`, `deadline` are all required; missing any blocks submission (FR-013).
- `attachment` is optional; at most one file per tender.

**State transitions**: `open → closed` via either deadline passing (derived, automatic) or an admin's manual close action. `closed` is terminal — no `closed → open` transition exists anywhere in the system (FR-021).

**Relationships**:
- `Tender.creator.userId` → `User._id` (snapshot reference, not a live join for display purposes; `userId` itself is kept for internal auditing/ownership checks).
- `Tender.sector` is matched against `User.industrySectors` (array-contains) both for visibility filtering (a viewer only sees tenders whose `sector` is in their own `industrySectors`) and for notification fan-out ([R3](./research.md#r3--fan-out-to-sector-matched-members)).

## Notification Delivery Outcome (transient, not persisted)

Not a stored entity — mirrors the existing `eventNotifications.ts` `Outcome` shape (`status: "sent" | "failed"`, `attemptedAt`, `error`) used only in-process while fanning out a single tender's notifications ([R3](./research.md#r3--fan-out-to-sector-matched-members)). No new collection is introduced for notification history.
