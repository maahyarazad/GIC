# Contract: Events API (GIC server, `/api/v1`), emails and UI

This contract replaces [003's board-meetings contract](../../003-board-meeting-requests/contracts/board-meetings.api.md). The response envelope is unchanged:
- success: `{ success: true, message, data }`
- error: `{ success: false, message, error: { message, code, details? } }`

Entity rules are in [data-model.md](../data-model.md).

## DTOs — `src/types/event.types.ts`

```ts
type AttendanceStatus = "confirmed" | "cancelled";
type NotificationStatus = "not_sent" | "pending" | "sent" | "failed";

interface EventDto {
  id: string;
  title: string;
  description: string;        // plain text, "" when unset
  startsAt: string;           // ISO UTC
  date: string;               // "YYYY-MM-DD" Asia/Dubai
  time: string;               // "HH:mm" Asia/Dubai
  venue: string;
  location: string;
  imageUrl: string | null;    // "/uploads/<file>"
  capacity: number;
  seatsLeft: number;          // max(capacity − confirmedCount, 0)
  isFull: boolean;
  isPast: boolean;
}

interface MyAttendance { reference: string; status: AttendanceStatus; createdAt: string }

interface MemberEventDto extends EventDto { myAttendance: MyAttendance | null }

interface AdminEventDto extends EventDto { confirmedCount: number; createdAt: string; updatedAt: string }

interface EventAttendanceDto {
  id: string;
  reference: string;
  status: AttendanceStatus;
  requester: { name: string; email: string; phone: string };
  event: Pick<EventDto, "id" | "title" | "startsAt" | "date" | "time" | "venue" | "location"> | null;
  notifications: Record<"leadership" | "confirmation", { status: NotificationStatus; attemptedAt: string | null }>;
  createdAt: string;          // confirmation time
}

interface EventInput {        // create and update, full replace; unchanged from 003's BoardMeetingInput
  title: string; description?: string; date: string; time: string;
  venue: string; location: string; imageUrl?: string | null; capacity?: number;
}
```

`/public` returns `EventDto`, which includes `seatsLeft` and `isFull`. Visitors may see that an event is full, but never who attends.

## Member endpoints — `EventController`, `@Route("api/v1/events")`

| Method & path | Auth | Success | Errors |
|---|---|---|---|
| `GET /events/public` | none | 200 `{ items: EventDto[] }`, `startsAt` ascending | 500 |
| `GET /events` | `authMiddleware` | 200 `{ items: MemberEventDto[] }` | 401, 500 |
| `POST /events/{id}/attendance` | `strictLimiter`, `authMiddleware`; no body | **201** `"Your attendance is confirmed"`, `data: MyAttendance` (status `confirmed`). Both emails start after the response. | 400 `INVALID_ID` · 404 `USER_NOT_FOUND` / `EVENT_NOT_FOUND` · 409 `EVENT_PAST` · 409 `EVENT_FULL` · 409 `ALREADY_ATTENDING` (`details`: `MyAttendance`) · 429 · 500 |

## Admin endpoints — `adminOnlyMiddleware` (role `admin` only; 401 or 403 otherwise)

`EventAdminController`, `@Route("api/v1/admin/events")`:

| Method & path | Success | Errors |
|---|---|---|
| `GET /admin/events` | 200 `{ items: AdminEventDto[] }`, `startsAt` descending | 500 |
| `POST /admin/events` (`EventInput`) | 201 `AdminEventDto` | 400 `VALIDATION_ERROR` (`details`: field errors) |
| `PUT /admin/events/{id}` (`EventInput`) | 200 `AdminEventDto` | 400 `INVALID_ID` / `VALIDATION_ERROR` / `CAPACITY_BELOW_CONFIRMED` (`details.capacity`) · 404 `EVENT_NOT_FOUND` |
| `DELETE /admin/events/{id}` | 200 `{ deletedAttendances: number }` | 400 · 404 |

`EventAttendanceAdminController`, `@Route("api/v1/admin/event-attendances")`:

| Method & path | Success | Errors |
|---|---|---|
| `GET /admin/event-attendances?eventId=&status=` | 200 `{ items: EventAttendanceDto[], total }`, newest first, limit 500. The default `status` is `confirmed`; `status=all` includes cancelled rows. | 400 `INVALID_ID` / `VALIDATION_ERROR` |
| `POST /admin/event-attendances/{id}/resend-confirmation` | 200 `EventAttendanceDto`; message "Confirmation sent" or "Confirmation email failed". The email is awaited. | 404 `ATTENDANCE_NOT_FOUND` · 409 `NOT_CONFIRMED` · 409 `ALREADY_SENT` |

**Removed**: every `/api/v1/board-meetings*` and `/api/v1/admin/board-meeting*` path, including `approve`, `decline` and `resend-invitation`.

## Emails (sent from `SMTP_INFO_SENDER`, info@german-industry-club.com)

| Template | To / CC / Reply-To | Subject | Body essentials |
|---|---|---|---|
| `event_attendance_notification` | `EVENT_NOTIFY_TO` / `EVENT_CC` (defaults to the 5 leadership addresses) / the member | `Event attendance confirmed – {{EVENT_TITLE}} – {{REQUESTER_NAME}}` | Says a member has confirmed attendance. Includes the reference, name, email and phone, the event details, `{{SEATS_LEFT}}` seats left and a link to `{{DASHBOARD_URL}}` (`/dashboard?tab=manage_events`). |
| `event_attendance_confirmation` | the member / – / `EVENT_NOTIFY_TO` | `Your attendance is confirmed – {{EVENT_TITLE}}, {{EVENT_DATE}}` | Heading "Attendance Confirmed". Includes the reference, the event details, an "About the Event" box and "If you can no longer attend, please reply to this email…". Uses 003's themed layout. |

Environment: `EVENT_NOTIFY_TO` and `EVENT_CC` fall back to `BOARD_MEETING_NOTIFY_TO` and `BOARD_MEETING_CC` (so the existing `.env` overrides keep working), then to the 003 defaults.

## UI contract

| Surface | Behaviour |
|---|---|
| Public `/events` (`Pages/Events/EventsPage.tsx`, formerly `Pages/Boardroom`) | Hero "Events", with Upcoming and Past sections. For a signed-in member, selecting an upcoming card runs `useEventAttendance`. A visitor is sent to `/contact` with the *Full Name* field focused (router state `{ focus: "fullName" }`). Cards show *Attending* or *Fully booked*. The meta label "Register Interest" becomes "Confirm Attendance". |
| `/boardroom` | `<Navigate to="/events" replace/>` |
| Dashboard → Events (member) | Cards with *Attending* / *Fully booked* badges. The right column is "My Events" (Event, Date & time, Confirmed on, Reference). |
| Confirm dialog | Title "Confirm attendance". Message `Confirm your attendance at “{title}” on {date} at {time} (GST)?` Buttons "Confirm attendance" / "Cancel". |
| Snackbars | Success: "Your attendance is confirmed. A confirmation email is on its way." Info: "You're already attending this event" / "This event is fully booked" / "This event has already taken place". Error: the server message. |
| Dashboard → Manage Events (admin; key `manage_events`, legacy `board_meetings` accepted) | Tabs *Events* (CRUD, `confirmedCount / capacity` column) and *Attendees* (event filter, "Show cancelled" toggle, `L`/`C` email-status icons, **Resend confirmation**). No Approve/Decline buttons and no pending badge. |
| Navigation | The site-data nav link `{ label: "Events", path: "/events" }`, set by the migration script ([R6](../research.md#r6--routes-navigation-and-dashboard-keys)). |
