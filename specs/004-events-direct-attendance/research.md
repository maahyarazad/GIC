# Research: Events – Direct Attendance Confirmation

Phase 0 for [plan.md](./plan.md). This feature changes the code that feature 003 shipped (PR #27). Each decision below names the 003 behaviour it replaces.

## R1 — Attendance status model

- **Decision**: Use the statuses `confirmed` and `cancelled`. Every new attendance is created as `confirmed`. `cancelled` exists only for migrated 003 rows that were declined or that did not fit (R7). No current code path sets it, but it is reserved for a later member or admin cancel feature.
- **Rationale**: The spec removes approval (FR-007). A one-value enum would make the migrated "not attending" rows impossible to represent, and deleting them would lose history.
- **Alternatives considered**:
  - Keep `pending/approved/declined` and auto-approve on create. Rejected: dead states, plus the UI and emails would keep approval wording.
  - Delete declined rows. Rejected: loses history (FR-011).

## R2 — Capacity under concurrency (FR-006, acceptance 1.7)

- **Decision**: Add a seat counter `confirmedCount` to the event document and reserve a seat atomically **before** inserting the attendance:
  1. Reserve with `EventModel.findOneAndUpdate({ _id, startsAt: { $gt: now }, $expr: { $lt: ["$confirmedCount", "$capacity"] } }, { $inc: { confirmedCount: 1 } })`.
  2. If the result is null, re-read the event to choose the error: 404 `EVENT_NOT_FOUND`, 409 `EVENT_PAST` or 409 `EVENT_FULL`.
  3. Insert the attendance. On any failure, release the seat with `$inc: { confirmedCount: -1 }`. That includes the `{eventId,userId}` duplicate, which returns 409 `ALREADY_ATTENDING`.
- **Rationale**:
  - A single-document conditional update is atomic in MongoDB and needs no replica set, which multi-document transactions would. Whether the deployment runs as a replica set is not established, so transactions are avoided.
  - Insert-then-count can reject both racers when only one seat is left. Count-then-insert (003's approve check) can overbook.
- **Pre-check**: The member's existing attendance is checked first, so an already-attending member never consumes and releases a seat. It also makes the common duplicate click cheap.
- **Counter drift**: The counter is changed only by create (+1), the compensation (−1) and the migration, which recomputes it from attendances. Deleting an event deletes its attendances, so nothing is left to drift. Capacity edits are refused below `confirmedCount`, the same rule as 003's `CAPACITY_BELOW_APPROVED`. A crash between reserve and insert would leak one seat. The migration script's `--recount` mode repairs this, and an admin can raise capacity in the meantime.
- **Alternatives considered**:
  - Multi-document transaction. Rejected: it needs a replica set.
  - Insert and then count with a rollback. Rejected: false rejections.
  - A unique "seat number" index. Rejected: over-engineered for at most 50 seats.

## R3 — Emails

- **Decision**: Use two emails per attendance, sent in the background right after the 201 response, through the existing `sendDynamicEmailDoc(..., { sender: "info" })`:

  | Kind | Template name (new) | To | Notes |
  |---|---|---|---|
  | Leadership notification | `event_attendance_notification` | `EVENT_NOTIFY_TO` (info@), CC `EVENT_CC` | Reworded from 003's request notification |
  | Member confirmation | `event_attendance_confirmation` | the member | Built from 003's invitation layout: event details, description box and "reply if you cannot attend" |

  The old templates (`board_meeting_request_notification`, `board_meeting_request_receipt`, `board_meeting_invitation`) are no longer referenced. The seed script deletes them only with `--remove-legacy`, because admins may have edited them.
- **"At the same time"**: Both emails start together (`Promise.allSettled`) at the moment the attendance is stored. The user's on-screen confirmation does not wait for SMTP. The SMTP round trip is 1–3 s, and 003 established that the member never waits on SMTP. This matches SC-002 ("within 1 minute").
- **Rationale**: 003's receipt ("we will review it") and invitation ("your request has been approved") are both wrong once approval is gone. One confirmation email replaces both.
- **Alternatives considered**: Await the confirmation email before responding. Rejected: it slows the response and couples the UI to SMTP failures, which are still open per 003 research R2.

## R4 — Naming: what is renamed and how far

- **Decision**: Rename user-facing text and code identifiers to *Event / Event Attendance*, but **pin the MongoDB collection names** so no data has to move:
  - `model("Event", EventSchema, "boardmeetings")`
  - `model("EventAttendance", EventAttendanceSchema, "boardmeetingrequests")`

  | 003 name | 004 name |
  |---|---|
  | `BoardMeeting` model / `boardMeeting.model.ts` | `Event` / `event.model.ts` |
  | `BoardMeetingRequest` / `boardMeetingRequest.model.ts` | `EventAttendance` / `eventAttendance.model.ts` |
  | `boardMeeting.types.ts` | `event.types.ts` (that filename is free again: 003 deleted the services version) |
  | `boardMeetingConfig.ts` (`BOARD_MEETING_*`) | `eventConfig.ts` (`EVENT_*`, reading `BOARD_MEETING_*` env vars as a fallback) |
  | `boardMeetingNotifications.ts` | `eventNotifications.ts` |
  | `boardMeeting.controller.ts`, `boardMeetingAdmin.controller.ts` | `event.controller.ts`, `eventAdmin.controller.ts` |
  | `seed_board_meeting_templates.ts` | `seed_event_templates.ts` |
  | Field `meetingId` | stays `meetingId` in MongoDB. It is exposed as `eventId` in DTOs and API paths. A field rename would need a data migration and an index rebuild for no user benefit. |
  | `ui/src/api/boardMeetings.ts`, `Hooks/useBoardMeetingRequest.ts` | `api/events.ts`, `Hooks/useEventAttendance.ts` |
  | `Components/Dashboard/BoardMeetings/*` | `Components/Dashboard/ManageEvents/*` |
  | `Pages/Boardroom/*` | `Pages/Events/*` |
  | Reference prefix `BM-` | `EV-` for new rows. Old references are kept. |

- **Rationale**: The status change rewrites nearly every one of these modules anyway, so renaming now costs little and avoids a permanent mismatch between "board meeting request" in the code and "event attendance" in the product. Pinning the collections avoids a data migration for the rename itself. The only migration is the status one (R7).
- **Alternatives considered**:
  - Rename only the UI text. Rejected: the code would keep "request/approve" vocabulary that no longer exists.
  - Also rename the collections. Rejected: data migration risk for no user benefit.

## R5 — API paths

- **Decision**:

  | 003 | 004 |
  |---|---|
  | `GET /api/v1/board-meetings`, `/public` | `GET /api/v1/events`, `/api/v1/events/public` |
  | `POST /api/v1/board-meetings/{id}/requests` | `POST /api/v1/events/{id}/attendance` |
  | `/api/v1/admin/board-meetings[/{id}]` | `/api/v1/admin/events[/{id}]` |
  | `GET /api/v1/admin/board-meeting-requests` | `GET /api/v1/admin/event-attendances` |
  | `POST …/{id}/approve`, `/decline`, `/resend-invitation` | removed; `POST /api/v1/admin/event-attendances/{id}/resend-confirmation` added |

- **Rationale**: The only consumer is GIC's own SPA, which ships in the same deploy. `/api/v1/events` has been free since 003 deleted the services proxy. The old paths are not kept as aliases.

## R6 — Routes, navigation and Dashboard keys

- **Public page**: `App.jsx` gets `<Route path="/events" element={<EventsPage/>}/>` and `<Route path="/boardroom" element={<Navigate to="/events" replace/>}/>`. `LockOverlay` uses `redirect=/events`. `Footer`'s `navigateToBoardroom` currently opens the Boardroom from the *Privacy Policy / Terms* links. It is renamed to `navigateToEvents` and keeps its targets; the odd linking is pre-existing and noted as a follow-up.
- **Navigation label**: Nav links come from the per-environment site data file `file_storage/client_blueprint.json` (gitignored and editable in Dashboard → Website Data), not from the code. The migration script (R7) updates the `navLinks` entry where `path === "/boardroom"` to `{ label: "Events", path: "/events" }`. Admins can also do this by hand in Website Data. The `/boardroom` redirect covers any copy that was missed.
- **Dashboard**: The menu key `board_meetings` becomes `manage_events` with the title **"Manage Events"**, still `["admin"]` only. `isValidMenuItem` maps the legacy `board_meetings` to `manage_events`, so links in emails already sent keep working. The member tab `events` keeps the title "Events".
- **Visitor click on `/events`** (client decision, 2026-10-09): `navigate("/contact", { state: { focus: "fullName" } })`. `ContactUs.jsx` focuses `#fullName` once its page is active (pages are `display: none` until `showPage` activates them and scrolls to the top), then clears the state so a reload or Back does not refocus. The "Request Access" button also goes to Contact.

## R7 — Migrating feature 003 data

- **Decision**: Use a one-off idempotent script, `src/migrate_events_004.ts`. It is a dry run by default, and `--apply` writes. It does the following per event, oldest request first:
  1. `approved` → `confirmed`. `notifications.confirmation` is copied from `notifications.invitation`, because that email was already sent.
  2. `pending`, on an upcoming event with seats left → `confirmed`, `notifications.confirmation.status = "pending"`. Their confirmation emails are queued after the batch only with `--notify`. Without it, the confirmations are marked `not_sent` and are resendable from the Attendees tab.
  3. `pending` beyond capacity, or on a past event → `cancelled`. These are printed so the admin can contact them.
  4. `declined` → `cancelled`.
  5. Recompute `confirmedCount` for every event (also available alone with `--recount`).
  6. Unset the legacy `notifications.receipt`, `notifications.invitation` and `decision` fields.
  7. Patch the nav link in `file_storage/client_blueprint.json` (R6).
- **Rationale**: Feature 003 went live on 2026-10-08, so volumes are tiny, but the rows are real member intent. A dry run first lets the admin see exactly who moves where.
- **Alternatives considered**: Mark everything `confirmed`. Rejected: it could overbook and would contradict earlier declines.

## R8 — UI flow

- **Decision**: `useEventAttendance(onChanged)` replaces `useBoardMeetingRequest` and keeps its structure:
  - in-flight ref and `pendingId`
  - stable callback through refs
  - `onChanged` after every server response

  Its behaviour:
  - Already attending: info toast "You're already attending this event".
  - `isFull`: info toast "This event is fully booked".
  - Otherwise: `useConfirm({ title: "Confirm attendance", confirmText: "Confirm attendance" })`, then POST. On 201 it shows the success toast "Your attendance is confirmed. A confirmation email is on its way." On 409 `ALREADY_ATTENDING` or `EVENT_FULL` it shows an info toast. Any other error shows an error toast.
- **Badges**: `EventCardBadgeTone` becomes `"attending" | "full"`. The Dashboard "My Requests" table becomes "My Events", with the columns Event, Date & time and Confirmed on, plus the reference.
- **Admin**:
  - The `RequestsTable` becomes `AttendeesTable`, filtered by event, with no status filter (all rows are confirmed by default and a "Show cancelled" toggle covers migrated rows).
  - The email status icons are `L` (leadership) and `C` (confirmation).
  - The only action is **Resend confirmation**, shown when the confirmation is not `sent`.
  - The pending-count tab badge is removed.
  - The events table shows `confirmedCount / capacity`.

## R9 — Constitution

`.specify/memory/constitution.md` is still the unfilled template. As in features 001–003, this feature is checked against the repo's de-facto conventions (see plan).
