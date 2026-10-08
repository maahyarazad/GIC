# Contract: Board Meetings API (GIC server, `/api/v1`) and UI

All responses use the existing envelope from `createSuccessResponse` / `createErrorResponse`: success `{ success: true, message, data }`, error `{ success: false, message, error: { message, code, details? } }`. Field errors and the existing request of `ALREADY_REQUESTED` are carried in `error.details`. Entity rules: [data-model.md](../data-model.md).

## DTOs (`src/types/boardMeeting.types.ts`, imported by the UI as other types are)

```ts
type BoardMeetingRequestStatus = "pending" | "approved" | "declined";
type NotificationStatus = "not_sent" | "pending" | "sent" | "failed";

interface BoardMeetingDto {
  id: string;
  title: string;
  description: string;       // "" when unset; plain text
  startsAt: string;          // ISO UTC
  date: string;              // "YYYY-MM-DD" in Asia/Dubai
  time: string;              // "HH:mm" in Asia/Dubai
  venue: string;
  location: string;
  imageUrl: string | null;   // "/uploads/<file>"
  capacity: number;
  isPast: boolean;
}

// Member view: the caller's own request, if any.
interface MemberBoardMeetingDto extends BoardMeetingDto {
  myRequest: { reference: string; status: BoardMeetingRequestStatus; createdAt: string } | null;
}

// Admin view.
interface AdminBoardMeetingDto extends BoardMeetingDto {
  counts: { pending: number; approved: number; declined: number };
  createdAt: string; updatedAt: string;
}

interface BoardMeetingRequestDto {
  id: string;
  reference: string;
  status: BoardMeetingRequestStatus;
  requester: { name: string; email: string; phone: string };
  meeting: Pick<BoardMeetingDto, "id" | "title" | "startsAt" | "date" | "time" | "venue" | "location">;
  decision: { by: string | null; byName: string | null; at: string | null };
  notifications: Record<"leadership" | "receipt" | "invitation", { status: NotificationStatus; attemptedAt: string | null }>;
  createdAt: string;
}

interface BoardMeetingInput {      // create and update (full replace)
  title: string;
  description?: string;
  date: string;                    // "YYYY-MM-DD" (Asia/Dubai)
  time: string;                    // "HH:mm" 24h (Asia/Dubai)
  venue: string;
  location: string;
  imageUrl?: string | null;
  capacity?: number;               // default 10
}
```

## Member endpoints — `BoardMeetingController`, `@Route("api/v1/board-meetings")`

### `GET /api/v1/board-meetings`

- **Auth**: `authMiddleware` (any role). 401 otherwise.
- **200** `data: { items: MemberBoardMeetingDto[] }` — all meetings, `startsAt` ascending; UI splits upcoming/past on `isPast`. `myRequest` is resolved for the caller with one query on `{ userId }`.
- Replaces `GET /api/v1/events` (deleted).

### `POST /api/v1/board-meetings/{id}/requests`

- **Auth**: `strictLimiter`, `authMiddleware`. Body: none (identity and requester snapshot come from the user record).
- **201** `"Your request has been sent to the board meeting"`, `data: { reference, status: "pending", createdAt }`. Leadership notification + receipt are sent after the response (research R4).
- **400** `INVALID_ID` — `id` not an ObjectId.
- **404** `MEETING_NOT_FOUND` / `USER_NOT_FOUND`.
- **409** `MEETING_PAST` — `startsAt <= now`.
- **409** `ALREADY_REQUESTED` — `error.details: { reference, status, createdAt }` of the existing request; no email sent.
- **429** rate limit (existing limiter message).

## Admin endpoints — `adminOnlyMiddleware` (role `admin`; 401 no/invalid token, 403 other roles)

### Meetings — `BoardMeetingAdminController`, `@Route("api/v1/admin/board-meetings")`

| Method & path | Body | Success | Errors |
|---|---|---|---|
| `GET /` | — | 200 `data: { items: AdminBoardMeetingDto[] }`, `startsAt` descending | — |
| `POST /` | `BoardMeetingInput` | 201 `data: AdminBoardMeetingDto` | 400 `VALIDATION_ERROR` + `error.details: { field: message }` |
| `PUT /{id}` | `BoardMeetingInput` | 200 `data: AdminBoardMeetingDto` | 400 `INVALID_ID` / `VALIDATION_ERROR`; 404 `MEETING_NOT_FOUND`; 400 `CAPACITY_BELOW_APPROVED` (`error.details.capacity`) if `capacity` < approved count |
| `DELETE /{id}` | — | 200 `data: { deletedRequests: number }` | 400 `INVALID_ID`; 404 `MEETING_NOT_FOUND` |

Validation (`error.details` keys): `title` 3–160; `description` ≤ 2000; `date` valid calendar day; `time` `^([01]\d|2[0-3]):[0-5]\d$`; `venue` 2–160; `location` 2–300; `imageUrl` empty or `^/uploads/[A-Za-z0-9._-]{1,128}$`; `capacity` integer 1–50. Past dates are allowed (admins may record past meetings). Unknown body properties → 400 (tsoa `noImplicitAdditionalProperties: "throw"`).

Email values: subject and text body use the raw values (plain text); the HTML body uses HTML-escaped values (`renderTemplateByName(name, data, htmlData)`).

### Requests — `@Route("api/v1/admin/board-meeting-requests")` (same controller file)

| Method & path | Query / body | Success | Errors |
|---|---|---|---|
| `GET /` | `status?` (`pending`\|`approved`\|`declined`), `meetingId?` | 200 `data: { items: BoardMeetingRequestDto[], total }`, `createdAt` descending, max 500 | 400 invalid `status` / `meetingId` |
| `POST /{id}/approve` | — | 200 `data: BoardMeetingRequestDto` (invitation outcome in `notifications.invitation.status`); message `"Request approved"` or `"Request approved, but the invitation email failed"` | 404 `REQUEST_NOT_FOUND`; 409 `NOT_PENDING`; 409 `MEETING_FULL`; 409 `MEETING_PAST` |
| `POST /{id}/decline` | — | 200 `data: BoardMeetingRequestDto` | 404; 409 `NOT_PENDING` |
| `POST /{id}/resend-invitation` | — | 200 `data: BoardMeetingRequestDto` | 404; 409 `NOT_APPROVED`; 409 `ALREADY_SENT` (invitation status `sent`) |

## Emails (all `from: SMTP_INFO_SENDER` via the info transport — research R2/R3)

| Trigger | To | CC | Reply-To | Template |
|---|---|---|---|---|
| Request created | `BOARD_MEETING_NOTIFY_TO` (default info@german-industry-club.com) | `BOARD_MEETING_CC` (default: the five leadership addresses) | requester email | `board_meeting_request_notification` |
| Request created | requester | — | info@ | `board_meeting_request_receipt` |
| Approved / resend | requester | — | info@ | `board_meeting_invitation` |

No QR code or attachment is generated (FR-011).

## UI contract

### Dashboard → Events (`ui/src/Components/Dashboard/Events/`, all roles)

| Element | Behaviour |
|---|---|
| Data | `GET /board-meetings` once on mount; Retry on failure |
| Left column | **Upcoming Meetings** (`isPast=false`, soonest first) and **Past Meetings** (most recent first), `EventCard` 16:9 with left date block (from `date`), title, venue · time line |
| Card status badge | `myRequest.status` → *Requested* (pending), *Invited* (approved), *Declined* |
| Click upcoming, no request | `useConfirm({ title: "Request to join", message: "Send a request to join “<title>” on <date> at <time> (GST)?", confirmText: "Send request" })` → `POST …/requests` → success toast "Your request has been sent to the board meeting" → refetch |
| Click while request in flight | ignored |
| Click with existing request / 409 `ALREADY_REQUESTED` | info toast "You already requested this meeting (<Status>)" |
| Click past card | not clickable (no cursor/handler) |
| 409 `MEETING_PAST` / 404 | error toast with server message → refetch |
| Right column **My Requests** | table of meetings where `myRequest` ≠ null: Meeting (title + venue), Date & time, Requested on, Status chip; empty text "You haven't requested to join any board meetings yet." |
| Removed | My Events registrations table, Show QR dialog, SSO redirect |

### Dashboard → Board Meetings (`ui/src/Components/Dashboard/BoardMeetings/`, `accessControl: ["admin"]`)

| Element | Behaviour |
|---|---|
| Tabs | **Meetings** · **Requests** (pending count badge) |
| Meetings table | Date & time (GST), Title, Venue, Location, Approved/Capacity, Pending; actions Edit, Delete; **New meeting** button |
| Meeting form (modal) | Title, Date, Time, Venue, Location, Capacity (default 10), Image path (optional, preview), Description; Formik + Yup mirroring server rules; server `errors` mapped onto fields |
| Delete | confirm "Delete “<title>”? This also removes N request(s)." → `DELETE` → success toast |
| Requests table | filters: status (default Pending), meeting; columns Reference, Requester (name, email, phone), Meeting, Requested on, Status, Emails (leadership/receipt/invitation icons with failed shown in red), actions |
| Actions | Pending → **Approve** / **Decline** (confirm each); Approved + invitation failed → **Resend invitation**; result toast; row refreshes |

### Boardroom page (`ui/src/Pages/Boardroom/Boardroom.tsx`)

- Fetches `GET /board-meetings` only when a user is signed in (lock overlay covers it otherwise); shows upcoming meetings with the existing Boardroom card; click uses the same request flow (shared hook `useBoardMeetingRequest`). No `/sso` call, no redirect.
