# Data Model: Board Meeting Requests & Local Events

Mongoose models in GIC's Mongo database ([research R1](./research.md#r1--storage-for-meetings-and-requests)). DTO shapes are in [contracts/board-meetings.api.md](./contracts/board-meetings.api.md).

## BoardMeeting — `src/models/boardMeeting.model.ts` (collection `boardmeetings`)

| Field | Type | Rules |
|---|---|---|
| `_id` | ObjectId | |
| `title` | String | required, trimmed, 3–160 |
| `description` | String | optional, trimmed, ≤ 2000, plain text (rendered with line breaks, never as HTML) |
| `startsAt` | Date | required; built from `date` + `time` entered in Asia/Dubai (UTC+4), stored as UTC |
| `venue` | String | required, trimmed, 2–160 (e.g. "GIC Boardroom, Level 12") |
| `location` | String | required, trimmed, 2–300 (address / city) |
| `imageUrl` | String | optional; must match `^/uploads/[A-Za-z0-9._-]{1,128}$` (File Management upload) |
| `capacity` | Number | integer 1–50, default 10 |
| `createdBy` / `updatedBy` | ObjectId → User | set from the admin's token |
| `createdAt` / `updatedAt` | Date | `timestamps: true` |

**Indexes**: `{ startsAt: -1 }`.

**Derived (not stored)**: `isPast = startsAt < now`; `date` / `time` as Dubai strings; counts `{ pending, approved, declined }` (admin list, from an aggregation on requests).

**Delete**: hard delete; cascades `BoardMeetingRequest.deleteMany({ meetingId })`. No email to requesters (spec edge case).

## BoardMeetingRequest — `src/models/boardMeetingRequest.model.ts` (collection `boardmeetingrequests`)

| Field | Type | Rules |
|---|---|---|
| `_id` | ObjectId | |
| `reference` | String | unique; `BM-YYYYMMDD-XXXXXX` (last 6 hex of `_id`, as `BL-…` in feature 001) |
| `meetingId` | ObjectId → BoardMeeting | required |
| `userId` | ObjectId → User | required |
| `requester.name` | String | snapshot of `User.name` at request time |
| `requester.email` | String | snapshot, lowercase; from the user record (never from the client) |
| `requester.phone` | String | snapshot of `User.phone`, optional ("" when unset) |
| `status` | String | `pending` \| `approved` \| `declined`, default `pending` |
| `decision.by` | ObjectId → User \| null | admin who approved/declined |
| `decision.at` | Date \| null | |
| `notifications.leadership` | `NotificationOutcome` | notification to info@ + CC |
| `notifications.receipt` | `NotificationOutcome` | receipt to requester |
| `notifications.invitation` | `NotificationOutcome` | invitation on approval; `status: "not_sent"` until approved |
| `createdAt` / `updatedAt` | Date | `timestamps: true` |

`NotificationOutcome` = `{ status: "not_sent" | "pending" | "sent" | "failed", attemptedAt: Date | null, error: String | null (≤ 500 chars) }`.

**Indexes**: unique `{ meetingId: 1, userId: 1 }` (research R5); `{ status: 1, createdAt: -1 }`; `{ userId: 1, createdAt: -1 }`.


## State transitions

```text
                 approve (admin, capacity available)
   ┌─────────┐ ───────────────────────────────────▶ ┌──────────┐ ──▶ invitation email (resendable while failed)
   │ pending │                                      │ approved │
   └─────────┘ ───────────────────────────────────▶ └──────────┘
        │            decline (admin)
        └──────────────────────────────────────────▶ ┌──────────┐
                                                     │ declined │  (no email)
                                                     └──────────┘
```

- Only `pending` requests can be decided; any other state → `409 NOT_PENDING` (conditional update on `status: "pending"`).
- `approved` and `declined` are final in this feature (no undo).
- Creating a request requires the meeting to exist and `startsAt > now`.

## Notification lifecycle (per request)

| Event | leadership | receipt | invitation |
|---|---|---|---|
| Request created | `pending` → `sent`/`failed` (background) | `pending` → `sent`/`failed` (background) | `not_sent` |
| Approved | — | — | `pending` → `sent`/`failed` (awaited) |
| Resend invitation (only when approved and `failed`) | — | — | `pending` → `sent`/`failed` |

## Email templates (`emailtemplates`, seeded if missing — research R3)

| Name | To / CC | Variables |
|---|---|---|
| `board_meeting_request_notification` | to `BOARD_MEETING_NOTIFY_TO`, cc `BOARD_MEETING_CC`, reply-to requester | `REFERENCE, REQUESTER_NAME, REQUESTER_EMAIL, REQUESTER_PHONE, MEETING_TITLE, MEETING_DATE, MEETING_TIME, MEETING_VENUE, MEETING_LOCATION, SUBMITTED_AT, DASHBOARD_URL` |
| `board_meeting_request_receipt` | to requester | `REQUESTER_NAME, REFERENCE, MEETING_TITLE, MEETING_DATE, MEETING_TIME, MEETING_VENUE, MEETING_LOCATION` |
| `board_meeting_invitation` | to requester | `REQUESTER_NAME, REFERENCE, MEETING_TITLE, MEETING_DATE, MEETING_TIME, MEETING_VENUE, MEETING_LOCATION, MEETING_DESCRIPTION` |

All values are `escapeHtml`-ed; `MEETING_DESCRIPTION` newlines become `<br />` after escaping. `CURRENT_YEAR` comes from the existing global variables. Dates format as `en-GB`, `timeZone: "Asia/Dubai"`, with "(GST)" after the time.
