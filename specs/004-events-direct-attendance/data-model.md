# Data Model: Events – Direct Attendance Confirmation

This model changes feature 003's data ([003 data-model](../003-board-meeting-requests/data-model.md)). Collection names are unchanged ([research R4](./research.md#r4--naming-what-is-renamed-and-how-far)). DTO shapes are in [contracts/events.api.md](./contracts/events.api.md).

## Event — `src/models/event.model.ts` (collection `boardmeetings`, pinned)

All of 003's `BoardMeeting` fields are unchanged: `title`, `description`, `startsAt`, `venue`, `location`, `imageUrl`, `capacity` (1–50, default 10), `createdBy`/`updatedBy` and the timestamps. One field is added:

| Field | Type | Rules |
|---|---|---|
| `confirmedCount` | Number | integer ≥ 0, default 0. This is the seat counter ([R2](./research.md#r2--capacity-under-concurrency-fr-006-acceptance-17)). Only the attendance create and its compensation change it (`$inc`), plus the migration and `--recount`. It is never accepted from the client. |

**Invariant**: `0 ≤ confirmedCount ≤ capacity`. It equals `EventAttendance.countDocuments({ meetingId, status: "confirmed" })`, apart from a seat leaked by a crash, which `--recount` repairs.

**Derived (not stored)**:
- `isPast = startsAt ≤ now`
- `isFull = confirmedCount ≥ capacity`
- `seatsLeft = max(capacity − confirmedCount, 0)`
- `date` / `time` as Dubai time

**Update rule**: `capacity < confirmedCount` → 400 `CAPACITY_BELOW_CONFIRMED` with a field error on `capacity`. This replaces 003's `CAPACITY_BELOW_APPROVED`.

**Delete**: a hard delete that cascades `EventAttendance.deleteMany({ meetingId })`, unchanged from 003.

**Indexes**: `{ startsAt: -1 }`, unchanged.

## EventAttendance — `src/models/eventAttendance.model.ts` (collection `boardmeetingrequests`, pinned)

| Field | Type | Rules |
|---|---|---|
| `_id` | ObjectId | |
| `reference` | String | unique. New rows use `EV-YYYYMMDD-XXXXXX`; migrated rows keep `BM-…`. |
| `meetingId` | ObjectId → Event | required. The stored name is kept and exposed as `eventId`. |
| `userId` | ObjectId → User | required |
| `requester.{name,email,phone}` | String | snapshot from the user record at confirmation time, unchanged from 003 |
| `status` | String | `confirmed` \| `cancelled`, default `confirmed` |
| `notifications.leadership` | NotificationOutcome | the notification to info@ + CC, default `pending` |
| `notifications.confirmation` | NotificationOutcome | the confirmation to the member, default `pending` |
| `createdAt` / `updatedAt` | Date | `timestamps: true`. `createdAt` is the confirmation time. |

**Removed from 003**: `decision.by`, `decision.at`, `notifications.receipt` and `notifications.invitation`. The migration unsets them.

`NotificationOutcome` is unchanged: `{ status: "not_sent" | "pending" | "sent" | "failed", attemptedAt, error (≤ 500) }`.

**Indexes**:
- unique `{ meetingId: 1, userId: 1 }`, kept: one attendance per user per event, including cancelled ones
- `{ userId: 1, createdAt: -1 }`, kept
- `{ status: 1, createdAt: -1 }` is replaced by `{ meetingId: 1, status: 1, createdAt: -1 }` for the attendee list filter. The migration drops the old index with `syncIndexes()`.

## State transitions

```text
(none) ──member confirms, seat reserved──▶ confirmed
confirmed ──(no transition in this feature; reserved for future cancel)──▶ cancelled
```

Migration only (R7):

```text
approved                                   ──▶ confirmed  (confirmation := invitation outcome)
pending, upcoming, seat available (FIFO)   ──▶ confirmed  (confirmation: pending → sent/failed with --notify, else not_sent)
pending, over capacity or past             ──▶ cancelled  (listed in script output)
declined                                   ──▶ cancelled
```

## Create-attendance algorithm (FR-001, FR-005, FR-006)

1. Validate the event id. Load the user, or return 404 `USER_NOT_FOUND`.
2. If an attendance exists for `{meetingId, userId}` (any status), return 409 `ALREADY_ATTENDING` with it. No seat is touched.
3. Reserve a seat with `Event.findOneAndUpdate({ _id, startsAt: { $gt: now }, $expr: { $lt: ["$confirmedCount", "$capacity"] } }, { $inc: { confirmedCount: 1 } }, { new: true })`.
   - If the result is null, re-read the event: missing returns 404 `EVENT_NOT_FOUND`, past returns 409 `EVENT_PAST`, otherwise 409 `EVENT_FULL`.
4. Create the attendance (reference retried once on collision, as in 003).
   - On a duplicate `{meetingId,userId}` (a race with the member's other tab), release the seat and return 409 `ALREADY_ATTENDING`.
   - On any other error, release the seat and rethrow.
5. Start `void notifyAttendanceConfirmed(id)`, which sends both emails with `Promise.allSettled` and records both outcomes. Respond 201.

## Seeded data — `emailtemplates`

| Name | Used for | Variables |
|---|---|---|
| `event_attendance_notification` | the leadership notification | REFERENCE, REQUESTER_NAME/EMAIL/PHONE, EVENT_TITLE/DATE/TIME/VENUE/LOCATION, CONFIRMED_AT, SEATS_LEFT, DASHBOARD_URL |
| `event_attendance_confirmation` | the member confirmation | REQUESTER_NAME, REFERENCE, EVENT_TITLE/DATE/TIME/VENUE/LOCATION, EVENT_DESCRIPTION |

Variables are renamed from `MEETING_*` to `EVENT_*`. All values are HTML-escaped. `EVENT_DESCRIPTION` has its line breaks turned into `<br />` after escaping, unchanged from 003.
