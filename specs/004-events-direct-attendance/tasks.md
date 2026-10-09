---

description: "Task list for Events – Direct Attendance Confirmation"
---

# Tasks: Events – Direct Attendance Confirmation

**Input**: Design documents from `/specs/004-events-direct-attendance/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/events.api.md](./contracts/events.api.md), [quickstart.md](./quickstart.md)

**Tests**: The spec does not ask for automated tests, and the repo has no test runner. Each story is validated through the [quickstart.md](./quickstart.md) scenarios listed in its checkpoint.

**Organization**: Tasks are grouped by user story. This feature **changes code that feature 003 shipped**. Many tasks rename a 003 file with `git mv` and then edit it. Always run the `git mv` first, so history is kept.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story from spec.md (US1 = instant attendance, US2 = rename to Events, US3 = admin attendees)
- Paths are relative to the repo root. The API is in `src/` and the UI is in `ui/src/`.

## Conventions every task follows

- **Response envelopes**: use `createSuccessResponse` / `createErrorResponse` from `src/utils/helpers.ts` and `this.setStatus()`, as the current `src/controllers/boardMeeting.controller.ts` does.
- **Identity**: comes from `toObjectId((req as any).user?.userId)` plus a `UserModel` lookup. Never take name, email or phone from the request body.
- **Error codes** (exact values from the contract): `INVALID_ID`, `USER_NOT_FOUND`, `EVENT_NOT_FOUND`, `EVENT_PAST`, `EVENT_FULL`, `ALREADY_ATTENDING`, `VALIDATION_ERROR`, `CAPACITY_BELOW_CONFIRMED`, `ATTENDANCE_NOT_FOUND`, `NOT_CONFIRMED`, `ALREADY_SENT`, `INTERNAL_ERROR`.
- **Stored field name**: the attendance's event reference stays `meetingId` in MongoDB and in Mongoose queries. DTOs and API paths call it `eventId` / `event`.
- **Pinned collections**: `model("Event", EventSchema, "boardmeetings")` and `model("EventAttendance", EventAttendanceSchema, "boardmeetingrequests")`.
- **UI types**: import from `../../../src/types/event.types`, adjusting the number of `../` to the file's depth (e.g. `ui/src/Components/Dashboard/Events/*.tsx` uses `../../../../../src/types/event.types`).
- **Styles**: edit the `.scss` file and hand-update the matching `.css` file (and `.css.map` where one exists). Keep the existing `bm-*`, `br-*` and `ev-*` class names, because `me-*` would collide with Bootstrap's margin utilities.
- **Email values**: are always HTML-escaped (`escapeHtml` from `src/utils/helpers.ts`). Line breaks in the description become `<br />` after escaping.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Renamed config and the new DTO contract that every story imports.

- [X] T001 [P] Run `git mv src/config/boardMeetingConfig.ts src/config/eventConfig.ts`, then edit `src/config/eventConfig.ts`:
  - Keep `DEFAULT_RECIPIENTS` and `parseRecipients` unchanged.
  - Export `EVENT_CC`: `parseRecipients(process.env.EVENT_CC)`, falling back to `parseRecipients(process.env.BOARD_MEETING_CC)` and then `DEFAULT_RECIPIENTS` (use the first non-empty list).
  - Export `EVENT_NOTIFY_TO`: `EVENT_NOTIFY_TO`, then `BOARD_MEETING_NOTIFY_TO`, then `SMTP_INFO_SENDER`, then `"info@german-industry-club.com"`, each trimmed, first non-empty value wins.
  - Export `EVENT_TEMPLATES = { notification: "event_attendance_notification", confirmation: "event_attendance_confirmation" } as const`.
  - Export `LEGACY_BOARD_MEETING_TEMPLATES = ["board_meeting_request_notification", "board_meeting_request_receipt", "board_meeting_invitation"] as const`, used by the seed script's `--remove-legacy`.
  - Rename `BOARD_MEETING_TIMEZONE` to `EVENT_TIMEZONE` and keep `DUBAI_UTC_OFFSET_HOURS = 4`.
  - Update the header comment to say "Event attendance configuration".
- [X] T002 [P] Run `git mv src/types/boardMeeting.types.ts src/types/event.types.ts`, then rewrite it to match the contract's DTO block exactly:
  - Types: `AttendanceStatus = "confirmed" | "cancelled"`, `NotificationStatus` (unchanged).
  - Interfaces: `EventDto` (003's `BoardMeetingDto` plus `seatsLeft: number` and `isFull: boolean`), `MyAttendance`, `MemberEventDto` (`myAttendance: MyAttendance | null`), `AdminEventDto` (`confirmedCount`, `createdAt`, `updatedAt`), `EventAttendanceDto` (`event`, and `notifications` with `leadership` and `confirmation` only, no `decision`) and `EventInput` (same fields as 003's `BoardMeetingInput`).
  - Labels: replace `REQUEST_STATUS_LABELS` with `ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = { confirmed: "Confirmed", cancelled: "Cancelled" }`.
  - Plain interfaces only, with no Mongoose imports, because the UI imports this file.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Renamed models with the new status model and seat counter, the renamed notification service and the new email templates. Every story depends on these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. After this phase the 003 controllers no longer compile. That is expected, and US1 and US3 replace them.

- [X] T003 Run `git mv src/models/boardMeeting.model.ts src/models/event.model.ts`, then edit it (depends on T001 and T002):
  - **Schema**: rename the schema to `EventSchema` and add `confirmedCount: { type: Number, min: 0, default: 0 }`.
  - **Model**: export `EventModel = model("Event", EventSchema, "boardmeetings")`.
  - **Helper renames**: `isValidMeetingDate` → `isValidEventDate`, `isValidMeetingTime` → `isValidEventTime`, `formatMeetingDateForEmail` → `formatEventDateForEmail` and `formatMeetingTimeForEmail` → `formatEventTimeForEmail`. Keep `toStartsAt` and `toDubaiParts` unchanged. Import `EVENT_TIMEZONE` and `DUBAI_UTC_OFFSET_HOURS` from `../config/eventConfig`.
  - **Mapper**: rename `mapBoardMeeting` to `mapEvent(doc, now = new Date()): EventDto`. Add `const confirmed = doc.confirmedCount ?? 0; seatsLeft: Math.max(capacity - confirmed, 0); isFull: confirmed >= capacity`.
  - **Admin mapper**: also export `mapAdminEvent(doc): AdminEventDto` = `{ ...mapEvent(doc), confirmedCount: doc.confirmedCount ?? 0, createdAt, updatedAt }` as ISO strings.
- [X] T004 Run `git mv src/models/boardMeetingRequest.model.ts src/models/eventAttendance.model.ts`, then edit it (depends on T002 and T003):
  - **Schema** `EventAttendanceSchema`:
    - Keep `reference`, `meetingId` (ref `"Event"`), `userId` and `requester` as they are.
    - `status`: enum `["confirmed", "cancelled"]`, default `"confirmed"`.
    - Remove `decision`.
    - `notifications`: `{ leadership: notificationOutcome("pending"), confirmation: notificationOutcome("pending") }`.
  - **Indexes**: keep the unique `{ meetingId: 1, userId: 1 }` and `{ userId: 1, createdAt: -1 }`. Replace `{ status: 1, createdAt: -1 }` with `{ meetingId: 1, status: 1, createdAt: -1 }`.
  - **Model**: export `EventAttendanceModel = model("EventAttendance", EventAttendanceSchema, "boardmeetingrequests")`.
  - **Reference**: rename `buildBoardMeetingReference` to `buildEventReference`, with prefix `EV-` (`EV-YYYYMMDD-XXXXXX`).
  - **Mapper**: rename `mapBoardMeetingRequest` to `mapEventAttendance(doc): EventAttendanceDto`.
    - Output `event` (from the populated `meetingId`, using `mapEvent` and picking `id/title/startsAt/date/time/venue/location`) and `notifications.{leadership, confirmation}`.
    - **Defensive status** (rollout window before the migration, plan → Rollout): map a stored `approved` to `"confirmed"`. For `notifications.confirmation`, fall back to `doc.notifications?.invitation` when `confirmation` is missing.
  - **Member mapper**: export `toMyAttendance(doc): MyAttendance` (`reference`, `status` (normalized as above), `createdAt` as ISO).
- [X] T005 Run `git mv src/services/boardMeetingNotifications.ts src/services/eventNotifications.ts`, then edit it (depends on T001, T003 and T004):
  - **Imports**: use `EventModel`, `EventAttendanceModel`, `EVENT_CC`, `EVENT_NOTIFY_TO` and `EVENT_TEMPLATES`.
  - **`dashboardUrl()`**: return `…/dashboard?tab=manage_events`.
  - **`buildEmailVariables(attendance, event)`**:
    - Rename the `MEETING_*` keys to `EVENT_TITLE`, `EVENT_DATE`, `EVENT_TIME`, `EVENT_VENUE` and `EVENT_LOCATION`.
    - Rename `SUBMITTED_AT` to `CONFIRMED_AT` (same Dubai format).
    - Add `SEATS_LEFT: String(Math.max((event.capacity ?? 10) - (event.confirmedCount ?? 0), 0))`.
    - Add `EVENT_DESCRIPTION`: the trimmed description, or `"Further details will be shared with attendees ahead of the event."`.
  - **HTML copy**: keep `escapeVariables` as is. In the HTML copy, set `EVENT_DESCRIPTION` to `escapeHtml(description).replace(/\r?\n/g, "<br />")`.
  - **Replace `notifyRequestCreated` with `notifyAttendanceConfirmed(attendanceId): Promise<void>`**. It never throws. Send both emails together with `Promise.allSettled`:
    - Notification: `sendDynamicEmailDoc(EVENT_TEMPLATES.notification, { ...variables, email: EVENT_NOTIFY_TO }, { sender: "info", cc: EVENT_CC, replyTo: requester.email, htmlData })`.
    - Confirmation: `sendDynamicEmailDoc(EVENT_TEMPLATES.confirmation, { ...variables, email: requester.email }, { sender: "info", replyTo: EVENT_NOTIFY_TO, htmlData })`.
    - Record both outcomes with `$set` on `notifications.leadership` and `notifications.confirmation`, using the existing `toOutcome`.
  - **Replace `sendInvitation` with `sendConfirmation(attendanceId): Promise<NotificationStatus>`**. It is the same flow as `sendInvitation`, but it uses `EVENT_TEMPLATES.confirmation` and writes `notifications.confirmation`, and it never throws.
  - **Log messages**: say "Event attendance …" instead of "Board meeting …".
- [X] T006 Run `git mv src/seed_board_meeting_templates.ts src/seed_event_templates.ts`, then edit it (depends on T001):
  - **Templates**: replace the `templates` array with two templates. All placeholders are renamed to `EVENT_*`, and the `variables` arrays list exactly what each template uses (data-model.md → Seeded data).
    - **`EVENT_TEMPLATES.notification`**: subject `Event attendance confirmed – {{EVENT_TITLE}} – {{REQUESTER_NAME}}`. Use the plain `layout("Event Attendance Confirmed", …)` with the text "A member has confirmed their attendance at an event." and a `detailsTable` of Reference, Name, Email, Phone, Event, Date, Time, Venue, Location, Confirmed at and Seats left (`{{SEATS_LEFT}}`). Add the link "View attendees in the dashboard" to `{{DASHBOARD_URL}}`. The `text` version carries the same facts.
    - **`EVENT_TEMPLATES.confirmation`**: subject `Your attendance is confirmed – {{EVENT_TITLE}}, {{EVENT_DATE}}`. Use `themedLayout("Attendance Confirmed", …)`:
      - `textSection(["Dear {{REQUESTER_NAME}},", "Thank you for confirming. Your place at the following event is reserved."])`
      - `referenceSection`
      - `detailsSection("Event Details", themedEventRows)`: rename `themedMeetingRows` to `themedEventRows`, with the first label "Event"
      - `noteSection("About the Event", "{{EVENT_DESCRIPTION}}")`
      - a closing `textSection`: "Seating is limited. If you can no longer attend, please reply to this email so we can offer your seat to another member, quoting reference <strong>{{REFERENCE}}</strong>. You can also see this event under <strong>Events → My Events</strong> in your GIC Dashboard." and "We look forward to welcoming you.<br />The German Industry Club Team".

      The `text` version carries the same facts.
  - **Cleanup**: delete the now-unused `meetingRows` constant.
  - **Flags**: keep the `--update=<names>` behaviour. Add `--remove-legacy`, which runs `collection.deleteMany({ name: { $in: LEGACY_BOARD_MEETING_TEMPLATES } })` and logs the count.
  - **Usage comment**: update the header usage comment to `npx tsx src/seed_event_templates.ts [--update=…] [--remove-legacy]`.

**Checkpoint**: `npx tsc --noEmit -p .` reports errors only in the two 003 controllers and their imports, which T007 and T017 replace. `npx tsx src/seed_event_templates.ts` creates the two templates and skips them on the second run.

---

## Phase 3: User Story 1 - Member confirms attendance instantly (Priority: P1) 🎯 MVP

**Goal**: A signed-in member selects an upcoming event and is confirmed at once, with no approval. The confirmation email and the leadership notification go out at the same moment, and capacity is never exceeded.

**Independent Test**: Quickstart scenarios 3–7, 9 and 10, using an event inserted in Mongo or created by the existing admin form.

### Implementation for User Story 1

- [X] T007 [US1] Run `git mv src/controllers/boardMeeting.controller.ts src/controllers/event.controller.ts`, then rewrite it as `@Route("api/v1/events") @Tags("Events") export class EventController extends Controller` (depends on T003, T004 and T005):
  - **`GET /public`** (no auth): `EventModel.find().sort({ startsAt: 1 }).lean()` → `{ items: EventDto[] }` via `mapEvent`.
  - **`GET /`** (`authMiddleware`): load the events and `EventAttendanceModel.find({ userId }).select("meetingId reference status createdAt").lean()`. Map each item to `{ ...mapEvent(e, now), myAttendance }`, where `myAttendance` is `toMyAttendance(row)` when a row exists and its normalized status is `confirmed`, otherwise `null`.
  - **`POST /{id}/attendance`**: `@Middlewares<Function>(strictLimiter, authMiddleware)` and `@SuccessResponse("201", "Your attendance is confirmed")`. Implement the algorithm in data-model.md → Create-attendance algorithm exactly:
    1. Validate the id (400 `INVALID_ID`) and load the user (404 `USER_NOT_FOUND`).
    2. Look for an existing attendance with `findOne({ meetingId, userId })`. If one exists, return 409 `ALREADY_ATTENDING` with `toMyAttendance(existing)` as the details.
    3. Reserve a seat: `const reserved = await EventModel.findOneAndUpdate({ _id: meetingId, startsAt: { $gt: new Date() }, $expr: { $lt: ["$confirmedCount", "$capacity"] } }, { $inc: { confirmedCount: 1 } }, { new: true }).lean()`. If `reserved` is null, re-read the event with `findById` and return 404 `EVENT_NOT_FOUND`, 409 `EVENT_PAST` ("This event has already taken place") or 409 `EVENT_FULL` ("This event is fully booked").
    4. Create the attendance with the requester snapshot (same rules as 003) and `reference: buildEventReference(_id)`, retrying once on a reference collision.
       - A `{meetingId}` duplicate-key error means a race with the member's other tab. Release the seat, re-read the existing row, and return 409 `ALREADY_ATTENDING`.
       - Any other error: release the seat (`EventModel.updateOne({ _id: meetingId, confirmedCount: { $gt: 0 } }, { $inc: { confirmedCount: -1 } })`) and rethrow.
    5. Run `void notifyAttendanceConfirmed(doc._id)`. Return 201 with `toMyAttendance(doc)` and the message "Your attendance is confirmed".
  - **Errors**: the 500 messages read "Failed to fetch events" and "Failed to confirm your attendance".
- [X] T008 [P] [US1] Run `git mv ui/src/api/boardMeetings.ts ui/src/api/events.ts` and edit the **member section** (depends on T002):
  - Keep `apiErrorCode`, `apiErrorMessage`, `apiFieldErrors` and `itemsOf`. Change the `itemsOf` message to "Unexpected response from the events API".
  - `getEvents(signal?): Promise<MemberEventDto[]>` → `GET /events`.
  - `getPublicEvents(signal?): Promise<EventDto[]>` → `GET /events/public`.
  - `export type ConfirmAttendanceResult = MyAttendance & { kind: "created" | "exists" }`.
  - `confirmAttendance(id)` → `POST /events/{id}/attendance`. A 201 resolves `{ kind: "created", ...data }`. A 409 `ALREADY_ATTENDING` resolves `{ kind: "exists", ...error.details }`. Everything else rethrows.
  - Leave the admin section compiling for now: update its type imports to the new names (`AdminEventDto`, `EventInput`, `EventAttendanceDto`). T018 and T019 rewrite it.
- [X] T009 [US1] Run `git mv ui/src/Hooks/useBoardMeetingRequest.ts ui/src/Hooks/useEventAttendance.ts` and rewrite it as `useEventAttendance(onChanged)`, returning `{ confirm, pendingId }` (depends on T008). Keep the existing structure: the `inFlight` ref, `pendingId` state, `onChangedRef`/`confirmRef` refs and a `useCallback` with `[show]`. The guards run in this order:
  1. If `event.isPast` or a request is in flight, return.
  2. If `event.myAttendance` is set, show the info toast "You're already attending this event".
  3. If `event.isFull`, show the info toast "This event is fully booked".
  4. Otherwise ask `confirmRef.current({ title: "Confirm attendance", message: \`Confirm your attendance at “${title}” on ${formatDay(date)} at ${time} (GST)?\`, confirmText: "Confirm attendance", cancelText: "Cancel" })`.
  5. On confirm, call `confirmAttendance(id)`:
     - `created`: success toast "Your attendance is confirmed. A confirmation email is on its way."
     - `exists`: info toast "You're already attending this event".
     - A caught error with `apiErrorCode` `EVENT_FULL` or `EVENT_PAST`: info toast with the server message.
     - Any other error: error toast with `apiErrorMessage(error, "Failed to confirm your attendance. Please try again.")`.
  6. Call `onChangedRef.current()` after every server response.
- [X] T010 [P] [US1] Edit `ui/src/Components/Dashboard/Events/EventCard.tsx` and its badge styles in `EventCard.scss`/`EventCard.css`:
  - Set `EventCardBadgeTone = "attending" | "full"`.
  - In `.event-status-badge`, replace the `--pending`, `--approved` and `--declined` tones with `--attending` (green, the old approved colour) and `--full` (muted grey/dark, the old declined styling).
- [X] T011 [P] [US1] Run `git mv ui/src/Components/Dashboard/Events/MyRequests.tsx ui/src/Components/Dashboard/Events/MyEvents.tsx` and edit it (depends on T002):
  - Name the component `MyEvents` with props `{ items: MemberEventDto[] }`, the events the user attends. The row uses `meeting.myAttendance!`.
  - Heading: "My Events". Empty text: "You haven't confirmed attendance at any events yet."
  - Columns: Event (title, venue muted), Date & time, Confirmed on (`createdAt`) and Reference (`myAttendance.reference` in a muted/monospace style).
  - Drop the status chip column, since every row is confirmed.
  - Rename `MyRequestRow` to `MyEventRow` and the variable `meeting` to `event`.
- [X] T012 [US1] Edit `ui/src/Components/Dashboard/Events/Events.tsx` (depends on T009, T010 and T011):
  - Import `getEvents`, `useEventAttendance`, `MyEvents` and the `MemberEventDto` type.
  - Replace `BADGES` with a `badgeFor(e)` function: `e.myAttendance` gives `{ label: "Attending", tone: "attending" }`, `!e.isPast && e.isFull` gives `{ label: "Fully booked", tone: "full" }`, otherwise `undefined`.
  - Rename the internals: `MeetingItem` → `EventItem`, `MeetingsGroup` → `EventsGroup`, `splitMeetings` → `splitEvents`, and the prop `onRequest` → `onSelect`, passing the hook's `confirm`.
  - Group titles: "Upcoming Events" / "Past Events". Empty texts: "No upcoming events." / "No past events." Error text: "Could not load events."
  - The right column renders `<MyEvents items={events.filter((e) => e.myAttendance)} />`.
- [X] T013 [US1] Edit `ui/src/Components/Dashboard/Events/Events.scss` and `Events.css` (depends on T011). Remove the `.request-status` chip block from these two files only, because MyEvents no longer uses it. Leave the separate copy in `ui/src/Components/Dashboard/BoardMeetings/BoardMeetings.scss`/`.css` alone, because T021 reuses it in AttendeesTable. Add a `.my-events-ref` style (monospace, muted, nowrap) for the Reference column.
- [X] T014 [US1] Edit the public page `ui/src/Pages/Boardroom/Boardroom.tsx` so the attendance flow works there before the rename in US2 (depends on T008 and T009):
  - Use `getEvents` and `getPublicEvents`, the latter mapped to `{ ...e, myAttendance: null }`.
  - Use `useEventAttendance(fetchEvents)` and its `confirm`. Fix the toast to say "Failed to fetch events".
  - In `toCard`: `type` is `` `${e.isPast ? "Past" : "Upcoming"} · Members Event` ``. `meta` is `[monthLabel, "Members Only", e.myAttendance ? "Attending" : (!e.isPast && e.isFull) ? "Fully Booked" : "Confirm Attendance"]`. A signed-in user gets `cursor: "default"` when `e.isPast`.
  - `handleRequest` → `handleSelect`. A visitor (`!user`) is sent with `navigate("/login?redirect=" + encodeURIComponent("/events"))`; T024 adds that route, so until then this target 404s, which is acceptable. Otherwise call `confirm(event)`.
  - Delete the dead code: the empty `useEffect` on `[loading, user, location.pathname]` and the unused `BoardroomEvent`/`BoardroomProps` interfaces.

**Checkpoint**: The UI cannot build yet, because the admin components still import removed API functions. T019–T022 fix that. The member endpoints are verifiable with curl now: quickstart scenarios 5–7 and 10, plus scenario 4 for email. Scenarios 3 and 9 pass in the browser once US3's UI tasks compile.

---

## Phase 4: User Story 3 - Admin sees attendees (Priority: P2, done before US2 because the admin code must compile)

**Goal**: Admins manage events with confirmed/capacity counts and see a read-only attendee list with **Resend confirmation**. Approve, decline and invitation are gone.

**Independent Test**: Quickstart scenarios 2, 8, 9, 14 and 15.

> **Ordering note**: US3 comes before US2 in execution order. Removing the approval API in US1 breaks the 003 admin UI and controller, and those must be rewritten before anything builds. US2 (pure renaming) then works on compiling code.

### Implementation for User Story 3

- [X] T015 [US3] Run `git mv src/controllers/boardMeetingAdmin.controller.ts src/controllers/eventAdmin.controller.ts` and rewrite the **events class** as `@Route("api/v1/admin/events") @Tags("Events Admin") export class EventAdminController`, with every method using `@Middlewares(adminOnlyMiddleware)` (depends on T003 and T004):
  - **Validation**: keep `validateMeetingInput` as `validateEventInput(body: EventInput)`, with the same rules and messages.
  - **Remove**: `countsByMeeting`, `zeroCounts` and `toAdminDto`. Use `mapAdminEvent` instead.
  - **`GET /`**: `EventModel.find().sort({ startsAt: -1 }).lean()` → `{ items: mapAdminEvent[] }`.
  - **`POST /`**: create with the validated value plus `createdBy`/`updatedBy`. Never set `confirmedCount` from input. Return 201 `mapAdminEvent`, message "Event created".
  - **`PUT /{id}`**:
    - Validate the input, then load the event (404 `EVENT_NOT_FOUND`).
    - If `value.capacity < (event.confirmedCount ?? 0)`, return 400 `CAPACITY_BELOW_CONFIRMED` "Capacity is below the number of confirmed attendees", with details `{ capacity: \`Capacity cannot be below the ${n} confirmed attendees\` }`.
    - Update with a conditional filter `{ _id, confirmedCount: { $lte: value.capacity } }`, so a seat taken in between cannot leave the counter above capacity. A null result means 409 `CAPACITY_BELOW_CONFIRMED`.
    - Message: "Event updated".
  - **`DELETE /{id}`**: `deleteOne`, then `EventAttendanceModel.deleteMany({ meetingId })`. Return `{ deletedAttendances }`, message "Event deleted".
- [X] T016 [US3] In `src/controllers/eventAdmin.controller.ts`, replace the requests class with `@Route("api/v1/admin/event-attendances") @Tags("Events Admin") export class EventAttendanceAdminController`, all methods `adminOnlyMiddleware` (depends on T005 and T015):
  - **`loadAttendanceDto(id)`**: `findById(id).populate("meetingId").lean()`, then `mapEventAttendance`.
  - **`GET /?eventId=&status=`**:
    - `status` is `confirmed` (the default), `cancelled` or `all`. Anything else returns 400 `VALIDATION_ERROR`.
    - `confirmed` filters with `status: { $in: ["confirmed", "approved"] }`, so the rollout window is covered.
    - An invalid `eventId` returns 400 `INVALID_ID`.
    - Sort `{ createdAt: -1 }`, limit 500, `populate("meetingId")`. Return `{ items, total }`.
  - **`POST /{id}/resend-confirmation`**:
    - 404 `ATTENDANCE_NOT_FOUND` when missing.
    - 409 `NOT_CONFIRMED` unless the normalized status is `confirmed`.
    - 409 `ALREADY_SENT` when `notifications.confirmation.status === "sent"`.
    - Otherwise `await sendConfirmation(id)` and return the DTO, with message "Confirmation sent" or "Confirmation email failed".
  - **Delete**: `approveRequest`, `declineRequest`, `resendInvitation` and `REQUEST_STATUSES`.
- [X] T017 [US3] Run `npm run build` to regenerate `src/routes/routes.ts` and `src/swagger/swagger.json` (depends on T007, T015 and T016). Confirm that the routes include `/api/v1/events`, `/api/v1/events/public`, `/api/v1/events/{id}/attendance`, `/api/v1/admin/events` and `/api/v1/admin/event-attendances`, and that no `board-meeting` path remains (`grep -c "board-meeting" src/routes/routes.ts` prints 0). Fix tsoa type errors: `EventInput` must stay a plain exported interface.
- [X] T018 [US3] Rewrite the **admin section** of `ui/src/api/events.ts` (depends on T008):
  - `adminListEvents(): Promise<AdminEventDto[]>` → `GET /admin/events`.
  - `adminCreateEvent` and `adminUpdateEvent` take `EventInput`.
  - `adminDeleteEvent(id): Promise<{ deletedAttendances: number }>`.
  - `adminListAttendances(params: { eventId?: string; status?: "confirmed" | "cancelled" | "all" } = {}): Promise<EventAttendanceDto[]>` → `GET /admin/event-attendances`.
  - `export interface AttendanceActionResult { message: string; attendance: EventAttendanceDto }`.
  - `adminResendConfirmation(id)` → `POST /admin/event-attendances/{id}/resend-confirmation`.
  - Delete `adminApproveRequest`, `adminDeclineRequest`, `adminResendInvitation`, `requestAction` and `RequestActionResult`.
- [X] T019 [US3] Move the admin folder: `git mv ui/src/Components/Dashboard/BoardMeetings ui/src/Components/Dashboard/ManageEvents`. Then run `git mv` inside it: `BoardMeetings.tsx` → `ManageEvents.tsx`, `BoardMeetings.scss` → `ManageEvents.scss`, `BoardMeetings.css` → `ManageEvents.css`, `BoardMeetings.css.map` → `ManageEvents.css.map`, `MeetingsTable.tsx` → `EventsTable.tsx`, `MeetingForm.tsx` → `EventForm.tsx` and `RequestsTable.tsx` → `AttendeesTable.tsx`. `format.ts` stays (depends on T018).
- [X] T020 [US3] Edit `ui/src/Components/Dashboard/ManageEvents/EventForm.tsx` and `EventsTable.tsx` (depends on T019):
  - **EventForm**: component `EventForm`, prop `event?: AdminEventDto`, types `EventInput`, calls `adminCreateEvent`/`adminUpdateEvent`. Update the comment "Mirrors the server rules in eventAdmin.controller.ts". Change the venue placeholder to `"e.g. GIC Lounge, Level 12"`. Success toasts read "Event created" / "Event updated". Rename any remaining "meeting" labels to "event". Field ids may keep the `bm-` prefix.
  - **EventsTable**:
    - Heading "Events", button "New event".
    - Modal titles "New event" / "Edit event", rendering `<EventForm event={…}/>`.
    - The columns "Approved" and "Pending" become one column, **Confirmed**, showing `{confirmedCount} / {capacity}`, with " · Full" appended when `isFull`.
    - Delete confirm: title "Delete event", message `` Delete “${title}”? This also removes ${confirmedCount} attendee record(s). `` Toast "Event deleted". Empty text "No events yet. Create the first one with “New event”." Error text "Could not load events."
- [X] T021 [US3] Rewrite `ui/src/Components/Dashboard/ManageEvents/AttendeesTable.tsx` (depends on T019 and T018):
  - **Props**: `{ onChanged?: () => void }`.
  - **State**: `eventId` (filter, `""` = all) and `showCancelled` (checkbox, default false, which sends `status: "all"`, otherwise `"confirmed"`). Events for the filter come from `adminListEvents()`.
  - **Columns**: Reference, Member (name, mailto email, phone), Event (title, then date · time GST), Confirmed on (`createdAt`) and Emails.
  - **Status**: show a Status chip only when `showCancelled` is on, using `ATTENDANCE_STATUS_LABELS`, with `.request-status--confirmed` (green) and `--cancelled` (muted red) in `ManageEvents.scss`/`.css`.
  - **Emails**: `EMAILS = [{ key: "leadership", short: "L", label: "Leadership notification" }, { key: "confirmation", short: "C", label: "Confirmation to member" }]`, reusing `EmailStatus`.
  - **Action**: the only one is **Resend confirmation**, shown when `attendance.status === "confirmed" && attendance.notifications.confirmation.status !== "sent"`. Keep the `runAction` pattern without a confirm dialog. The toast type is `warning` when the message matches `/failed/i`, otherwise `success`.
  - **Remove**: `approve`, `decline`, `STATUS_FILTERS` and the decision "by" line.
  - **Texts**: heading "Attendees", empty text "No attendees match the filters.", error "Could not load attendees."
- [X] T022 [US3] Edit `ui/src/Components/Dashboard/ManageEvents/ManageEvents.tsx` (depends on T020 and T021):
  - Component `ManageEvents`, importing `./ManageEvents.css`. Header `<h3>Manage Events</h3>`.
  - `type Tab = "events" | "attendees"`, tab labels "Events" | "Attendees".
  - Render `<EventsTable/>` / `<AttendeesTable/>`.
  - Remove `pendingCount`, `refreshPending`, the `adminListRequests` import and the `bm-tab__badge` element. Keep the `.bm-tab__badge` style only if it is used elsewhere; otherwise delete it from `ManageEvents.scss`/`.css`.
- [X] T023 [US3] Edit `ui/src/Pages/Dashboard/Dashboard.tsx` (depends on T022):
  - **Menu key**: replace `board_meetings` with `manage_events` in the `MenuItem` union, `accessControl` (`["admin"]`), `menuTitles` (`"Manage Events"`), the `isValidMenuItem` list and `componentMap` (`<ManageEvents />`, imported from `@/Components/Dashboard/ManageEvents/ManageEvents`).
  - **Legacy alias**: in the tab-selection `useEffect`, read `const rawTab = searchParams.get("tab"); const queryTab = rawTab === "board_meetings" ? "manage_events" : rawTab;`. Write the normalized tab back to the URL (with `replace`) whenever it differs from `rawTab`, so links in emails already sent keep working.

**Checkpoint**: `npm run build` and `(cd ui && npm run build)` both pass. Quickstart scenarios 2–10, 14 and 15 pass in the browser. US1 and US3 together are a shippable MVP, still under the old "Boardroom" page name.

---

## Phase 5: User Story 2 - "Boardroom" becomes "Events" everywhere users see it (Priority: P1)

**Goal**: The public page lives at `/events` with an "Events" hero and nav label. `/boardroom` redirects there, and no user-facing "Boardroom" / "Board Meeting" text remains.

**Independent Test**: Quickstart scenarios 11, 12 and 13.

### Implementation for User Story 2

- [X] T024 [US2] Move the public page (depends on T014):
  - Run `git mv ui/src/Pages/Boardroom ui/src/Pages/Events`, then `git mv` inside it: `Boardroom.tsx` → `EventsPage.tsx`, `Boardroom.scss` → `EventsPage.scss`, `Boardroom.css` → `EventsPage.css` and `Boardroom.css.map` → `EventsPage.css.map`.
  - In `EventsPage.tsx`:
    - Component `EventsPage`. Import `./EventsPage.css` once, removing the duplicate `./Boardroom.css` import.
    - `id="page-events"`, active check `activePage === "/events"`.
    - Hero tag "Members Only · By Invitation". In the hero title, replace `The <em style={{ color: "var(--ora)" }}>Boardroom</em>` with `<em style={{ color: "var(--ora)" }}>Events</em>`. Keep the subtitle.
    - Section label "Events & Gatherings" and headings "Upcoming <em>Events</em>" / "Past <em>Events</em>". Empty text "No upcoming events are scheduled yet."
  - Fix any `#page-boardroom` selector in `EventsPage.scss`/`.css` to `#page-events`.
- [X] T025 [US2] Edit `ui/src/App.jsx` (depends on T024):
  - Replace `import Boardroom from './Pages/Boardroom/Boardroom'` with `import EventsPage from './Pages/Events/EventsPage'`.
  - Add `Navigate` to the `react-router-dom` import.
  - Replace the `/boardroom` route with `<Route path="/events" element={<EventsPage />} />` and `<Route path="/boardroom" element={<Navigate to="/events" replace />} />`.
- [X] T026 [P] [US2] Edit `ui/src/Components/Footer/Footer.tsx`: rename `navigateToBoardroom` to `navigateToEvents`, with body `showPage('/events'); navigate('/events');`, and update its four usages. The targets are Privacy Policy and Terms; that pre-existing linking is unchanged and listed under the plan's follow-ups.
- [X] T027 [P] [US2] Edit `ui/src/Components/LockOverlay/LockOverlay.tsx`: change `navigate("/login?redirect=/boardroom")` to `navigate("/login?redirect=/events")`.
- [X] T028 [P] [US2] Edit `ui/src/index.scss` and `ui/src/index.css`: rename the section comment `// BOARDROOM` to `// EVENTS PAGE`. Keep the `br-*` class names, and if the compiled CSS has the comment, update it there too.
- [X] T029 [US2] Create the migration script `src/migrate_events_004.ts`, modelled on `src/seed_event_templates.ts` (`connectToDatabase`, `getCollection`, `closeDatabaseConnection` and `main().catch().finally()`) (depends on T003, T004 and T005). It follows research R7 and runs as follows:
  - **Flags**: `--apply` (otherwise dry run: compute and print, write nothing), `--notify` (only with `--apply`) and `--recount` (only recompute the counters, then exit; it obeys `--apply`).
  - **Per event**: `getCollection("boardmeetings")` sorted by `startsAt`. Load its rows from `getCollection("boardmeetingrequests")` sorted by `createdAt: 1`. Compute the moves in this order:
    1. `approved` → `confirmed`, `notifications.confirmation = notifications.invitation ?? { status: "sent", attemptedAt: decision.at, error: null }`.
    2. `pending`, when the event is upcoming and `confirmedSoFar < capacity` → `confirmed`. `notifications.confirmation` is `{ status: "pending" }` with `--notify`, otherwise `{ status: "not_sent", attemptedAt: null, error: null }`.
    3. Any other `pending` → `cancelled`.
    4. `declined` → `cancelled`.
    5. Rows already `confirmed` or `cancelled` count toward `confirmedSoFar` and are not changed (idempotent).
  - **Writes, with `--apply`**: `$set` the status and `notifications.confirmation`, `$unset` `decision`, `notifications.receipt` and `notifications.invitation`, and `$set` the event's `confirmedCount` to the count of confirmed rows.
  - **Indexes**: after the writes, call `await EventAttendanceModel.syncIndexes()`.
  - **Output**: print a table per event (title, date, capacity, before → after counts per status), a list of members moved to `cancelled` (name, email, reference, reason "over capacity", "past event" or "declined"), and "0 changes" when nothing would change.
  - **`--notify`**: after the writes, for each row moved pending → confirmed, `await sendConfirmation(id)` one at a time and print the result.
  - **Nav link**: patch `file_storage/client_blueprint.json` (path from `process.cwd()`, same as `client.controller.ts`).
    - If the file exists, walk `navLinks` (and any nested `children`/`links` arrays) for entries with `path === "/boardroom"`, and set `label: "Events", path: "/events"`.
    - Print what would change. Write with `JSON.stringify(json, null, 2)` only with `--apply`.
    - Skip with a message when the file is missing.
- [X] T030 [US2] Run the text sweep from quickstart scenario 13: `grep -rniE "boardroom|board meeting|board-meeting|boardMeeting" ui/src src --include=*.ts --include=*.tsx --include=*.jsx --include=*.scss` (depends on T024–T029). The allowed matches are the `/boardroom` redirect route in `App.jsx`, the `"boardmeetings"`/`"boardmeetingrequests"` collection names, `LEGACY_BOARD_MEETING_TEMPLATES`, the `BOARD_MEETING_*` env fallbacks in `eventConfig.ts`, the legacy `board_meetings` tab alias in `Dashboard.tsx` and the migration script. Rename everything else to Event wording.

**Checkpoint**: Quickstart scenarios 11–13 pass. All three stories work together.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T031 [P] Run `npm run build` at the repo root and `(cd ui && npm run build)`. Both must finish with zero TypeScript errors. Fix the unused imports and stale names that the renames left behind.
- [ ] T032 Against the dev database:
  1. Snapshot the statuses (quickstart prerequisite 5).
  2. Run `npx tsx src/seed_event_templates.ts` twice (created, then skipped).
  3. Run `npx tsx src/migrate_events_004.ts` (dry run), then `--apply`, then the dry run again, which must print "0 changes".
  4. Run `--recount` and confirm it reports no drift.
  5. Open Dashboard → Email Templates and confirm both new templates render.
  - **Result (2026-10-09, local dev DB)**: templates seeded (created, then skipped). Migration dry run → `--apply` → rerun reports 0 changes; `--recount` reports no drift. Also checked against synthetic 003 rows (approved, pending over capacity, declined, past event): every row moved as R7 describes, and the fixtures were removed afterwards. **Not done**: the visual check in Dashboard → Email Templates.
  - **Fix found while running it**: the first version used `syncIndexes()`, which dropped and rebuilt *every* index, including the unique `{meetingId,userId}` guard. The script now drops only `status_1_createdAt_-1` and then calls `createIndexes()`.
- [ ] T033 Run every scenario in `specs/004-events-direct-attendance/quickstart.md` with `EVENT_NOTIFY_TO` and `EVENT_CC` pointing at a test inbox. The email scenarios (4 and 9) need the `SMTP_INFO_USER`/`SMTP_INFO_PASS` login fixed first (003 research R2). Record any failures in this file.
  - **Result (2026-10-09, API with curl, local server, `SMTP_INFO_PASS` deliberately wrong, recipients on example.invalid)**:
    - **Passed** (scenarios 2, 3, 5, 6, 7, 8, 9, 10, 14, 15): create event (201); confirm (201, `EV-` reference); repeat (409 `ALREADY_ATTENDING`); concurrent last-seat race gives exactly one 201 and one 409 `EVENT_FULL`, with `confirmedCount` 2/2; a full event rejects a non-attendee and leaves the counter unchanged; capacity 1 < 2 confirmed is refused (400 `CAPACITY_BELOW_CONFIRMED`); emails fail with 535 and are recorded as `failed` while the attendances stay confirmed, and resend reports "Confirmation email failed"; past event returns 409 `EVENT_PAST`; old approve path returns 404; a member on an admin route gets 403; deleting an event cascades `deletedAttendances: 2`, and a later confirm returns 404 `EVENT_NOT_FOUND`.
    - **Expected 429**: `strictLimiter` returns 429 after 5 POSTs per minute from one IP.
    - **Not run**: scenario 4 (real delivery; needs the SMTP login fixed), scenario 1 on real 003 data (the local DB has none; synthetic rows were used, see T032), and the browser scenarios 11, 12 and the toast/badge parts of 3, 7 and 9.
- [ ] T034 [P] Check Dashboard → Events, Dashboard → Manage Events and the public `/events` page at 375px, 768px and 1280px. Confirm that the *Attending* and *Fully booked* badges don't overlap the date block, the My Events and Attendees tables scroll horizontally inside their containers on phones, and the confirm dialog text fits.
- [X] T035 [P] Update `documentation/features-ownership.md`: replace any "Boardroom" / "Board Meetings" entries with "Events" / "Manage Events", and describe the direct-attendance flow in one line.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 and T002 have no dependencies.
- **Foundational (Phase 2)**: T003–T006 depend on Phase 1 and block every story.
- **US1 (Phase 3)**: depends on Phase 2. Its server side is testable with curl on its own. The UI build stays red until US3's T018–T023.
- **US3 (Phase 4)**: depends on Phase 2 and on T008 (the shared `ui/src/api/events.ts`). It runs before US2 because the 003 admin code must be replaced before anything builds.
- **US2 (Phase 5)**: depends on T014 (the public page logic) and Phase 2 (for the migration script). The UI rename tasks T024–T028 are independent of US3, apart from the final sweep.
- **Polish (Phase 6)**: runs after all stories.

### Story Completion Order

```text
Setup → Foundational → US1 (instant attendance, server + member UI) → US3 (admin attendees; restores a green build) → US2 (rename + migration) → Polish
```

### Within-Story Task Graph

- **US1**: T007 is the server track. On the UI, T008 → T009, while T010 and T011 run in parallel. T009, T010 and T011 → T012 → T013. T008 and T009 → T014.
- **US3**: T015 → T016 → T017. T018 → T019 → T020 and T021, in parallel, → T022 → T023.
- **US2**: T024 → T025. T026, T027 and T028 run in parallel. T029 depends only on Phase 2. Everything → T030.

### Same-File Sequencing

These tasks edit the same file, so they never run in parallel:
- `ui/src/api/events.ts`: T008 → T018
- `src/controllers/eventAdmin.controller.ts`: T015 → T016
- `ui/src/Pages/Boardroom/Boardroom.tsx` → `Pages/Events/EventsPage.tsx`: T014 → T024
- `ManageEvents.scss`/`.css`: T021 → T022

---

## Parallel Execution Examples

### Phase 1 and 2

```text
Together: T001 (config), T002 (types)
Then: T003 → T004 → T005; T006 in parallel with T003–T005 (only needs T001)
```

### User Story 1

```text
Server: T007
UI (in parallel with T007): T008, T010, T011 together → T009 → T012 → T013; T014 after T009
```

### User Story 3

```text
Server: T015 → T016 → T017
UI (in parallel with the server track): T018 → T019 → (T020 ‖ T021) → T022 → T023
```

### User Story 2

```text
Together: T024, T026, T027, T028, T029
Then: T025 (after T024) → T030
```

---

## Implementation Strategy

### MVP First (US1 + US3)

1. Phases 1–2: the renamed config, types, models, notifications and templates.
2. Phase 3 (US1): instant attendance on the server and in the member UI.
3. Phase 4 (US3): rewrite the admin side so both builds pass.
4. **Stop and validate**: quickstart scenarios 2–10, 14 and 15. This already delivers the client's main request (no approval, immediate confirmation and email), while the public page is still named Boardroom.

### Incremental Delivery

1. MVP (US1 + US3). Deploy only together with the migration (T029), or the stored 003 `pending` rows stay invisible. The defensive mapping in T004 and T016 keeps `approved` rows showing as confirmed.
2. US2: the rename and redirect. Run `migrate_events_004.ts` on each environment (it also patches the nav link).
3. Polish, then the rollout steps in plan.md → Rollout.

### Notes

- Run each `git mv` before editing, so reviewers see the renames as renames.
- Commit after each task or logical group, as in feature 003.
- Never set `confirmedCount` from request input. Only T007 (`$inc`), T015 (the capacity guard reads it) and T029 (recompute) touch it.
