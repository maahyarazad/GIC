# Implementation Plan: Events – Direct Attendance Confirmation

**Branch**: `004-events-direct-attendance` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-events-direct-attendance/spec.md`. It builds on the merged feature [003](../003-board-meeting-requests/plan.md).

## Summary

Feature 003's **request → admin approval → invitation** flow becomes **instant attendance confirmation**, and "Boardroom / Board Meeting" becomes **Events** throughout.

1. **Member flow.** A signed-in member selects an upcoming event and confirms. `POST /events/{id}/attendance` reserves a seat atomically on the event's new `confirmedCount` counter, then stores an attendance with status `confirmed` and responds 201. The member sees "Your attendance is confirmed" at once. At the same moment, two emails start from info@:
   - a **confirmation** to the member, which replaces 003's receipt and invitation
   - the **leadership notification**, reworded

   Full, past and duplicate attempts get clear 409s and nothing is sent ([R2](./research.md#r2--capacity-under-concurrency-fr-006-acceptance-17), [R3](./research.md#r3--emails)).
2. **Admin.** "Board Meetings" becomes **Manage Events** with the tabs *Events* (CRUD, showing confirmed/capacity) and *Attendees*. The Attendees tab is a read list with **Resend confirmation**. Approve, decline and invitation are removed.
3. **Rename.** The public page moves from `/boardroom` to `/events`, with a redirect. The nav link is updated in per-environment site data. Code identifiers, API paths, templates and the reference prefix (`EV-`) are renamed. The MongoDB collection names stay pinned, so no data moves ([R4](./research.md#r4--naming-what-is-renamed-and-how-far)–[R6](./research.md#r6--routes-navigation-and-dashboard-keys)).
4. **Migration.** A dry-run-first script converts 003's statuses, recomputes the seat counters and patches the nav link ([R7](./research.md#r7--migrating-feature-003-data)).

## Technical Context

**Language/Version**: TypeScript 5.9 (Node 20+, `tsx`/`tsc`) on the server; React 19 + TS (Vite 7) in `ui/`.

**Primary Dependencies**: Express 4, tsoa 6, Mongoose 9, nodemailer 8 and express-rate-limit. On the UI: axios, Bootstrap 5, Formik + Yup, `useToast`, `useConfirm` and `useModal`. **No new dependencies.**

**Storage**: MongoDB through Mongoose. The existing collections `boardmeetings` (Event, plus `confirmedCount`) and `boardmeetingrequests` (EventAttendance) are reused, with two new `emailtemplates` records.

**Testing**: The repo has no test runner. Validation is the API and UI builds, plus the curl and browser scenarios in [quickstart.md](./quickstart.md).

**Target Platform**: Linux server under PM2; desktop and mobile browsers.

**Project Type**: A web application: the API in `src/` and the React SPA/SSR in `ui/src/`.

**Performance Goals**: The confirm response takes under 500 ms (two indexed single-document writes, with emails after the response). Event lists take under 300 ms.

**Constraints**:
- Never overbook, even under concurrent confirmations. No transactions, because a replica set is not guaranteed.
- Emails are sent only from info@.
- Identity always comes from the user record.
- Admin-only management, enforced on both the server and the UI.
- GST times.
- SCSS with committed compiled CSS.

**Scale/Scope**: At most 50 seats per event and a few dozen events per year.
- **Server**: renames 6 modules, rewrites 2 controllers and 1 notifications service, and adds 1 migration script.
- **UI**: renames 2 folders, 1 hook and 1 API client, adds 1 component (`AttendeesTable`, which replaces `RequestsTable`), and edits `Dashboard.tsx`, `App.jsx`, `Footer.tsx` and `LockOverlay.tsx`.

**Open items**: The `SMTP_INFO_USER` authentication failure is carried over from 003 R2. It blocks only the email scenarios (4 and 9).

All Technical Context items are resolved, and there are no NEEDS CLARIFICATION markers. Interpretation choices are recorded as spec Assumptions and research decisions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template, so there are no ratified gates. As in features 001–003, the design is checked against the repo's de-facto conventions instead:

| Convention | Complies? |
|---|---|
| tsoa controllers under `api/v1` with response envelopes | ✅ `EventController`, `EventAdminController`, `EventAttendanceAdminController` |
| Auth through `authMiddleware` / `adminOnlyMiddleware`; identity from JWT → user record | ✅ unchanged from 003 |
| Mongoose models with timestamps and indexes declared in code | ✅ the collections are pinned explicitly |
| Emails through DB templates, `{{VAR}}` substitution and `escapeHtml`, seeded idempotently | ✅ `seed_event_templates.ts`. Legacy templates are removed only on request. |
| Fire-and-forget notifications that record their outcome and never throw | ✅ `notifyAttendanceConfirmed` |
| Recipients configurable through env | ✅ `EVENT_*`, with a `BOARD_MEETING_*` fallback |
| One-off data scripts under `src/` run with `npx tsx`, idempotent | ✅ `migrate_events_004.ts` is a dry run by default |
| UI reuses `useToast`, `useConfirm`, `useModal` and `axiosInstance`; SCSS plus compiled CSS | ✅ |
| No new dependencies | ✅ |

**Result (pre-research)**: PASS. **Result (post-design)**: PASS. The design removes a workflow (approval) and adds one counter field. There are no new layers.

## Project Structure

### Documentation (this feature)

```text
specs/004-events-direct-attendance/
├── spec.md
├── plan.md               # this file
├── research.md           # Phase 0
├── data-model.md         # Phase 1
├── quickstart.md         # Phase 1
├── contracts/
│   └── events.api.md     # REST + email + UI contract
└── tasks.md              # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
src/
├── config/
│   └── boardMeetingConfig.ts → eventConfig.ts        # RENAME  EVENT_NOTIFY_TO/EVENT_CC (fallback BOARD_MEETING_*), EVENT_TEMPLATES {notification, confirmation}
├── models/
│   ├── boardMeeting.model.ts → event.model.ts        # RENAME+EDIT  model("Event", …, "boardmeetings"); + confirmedCount; mapEvent adds seatsLeft/isFull
│   └── boardMeetingRequest.model.ts → eventAttendance.model.ts  # RENAME+EDIT  status confirmed|cancelled; notifications {leadership, confirmation}; drop decision; EV- reference; index swap
├── types/
│   └── boardMeeting.types.ts → event.types.ts        # RENAME+REWRITE  DTOs per contract
├── controllers/
│   ├── boardMeeting.controller.ts → event.controller.ts            # RENAME+REWRITE  GET /events, /events/public, POST /events/{id}/attendance (seat reservation)
│   └── boardMeetingAdmin.controller.ts → eventAdmin.controller.ts  # RENAME+REWRITE  events CRUD (CAPACITY_BELOW_CONFIRMED); attendances list + resend-confirmation; approve/decline removed
├── services/
│   └── boardMeetingNotifications.ts → eventNotifications.ts  # RENAME+EDIT  notifyAttendanceConfirmed(), sendConfirmation() (resend); EVENT_* variables
├── seed_board_meeting_templates.ts → seed_event_templates.ts  # RENAME+EDIT  2 templates; --update; --remove-legacy
├── migrate_events_004.ts                             # NEW  dry-run | --apply [--notify] | --recount; also patches file_storage/client_blueprint.json nav link
└── routes/routes.ts, swagger/swagger.json            # REGENERATED by tsoa

ui/src/
├── api/boardMeetings.ts → api/events.ts              # RENAME+EDIT  confirmAttendance(); admin events/attendances; approve/decline removed
├── Hooks/useBoardMeetingRequest.ts → Hooks/useEventAttendance.ts  # RENAME+EDIT  attending/full/past toasts, "Confirm attendance" dialog
├── Components/Dashboard/Events/
│   ├── Events.tsx                                    # EDIT  badges attending/full; "Upcoming Events"/"Past Events"; uses useEventAttendance
│   ├── EventCard.tsx (+ .scss/.css)                  # EDIT  EventCardBadgeTone "attending" | "full"
│   └── MyRequests.tsx → MyEvents.tsx                 # RENAME+EDIT  "My Events": Event, Date & time, Confirmed on, Reference
├── Components/Dashboard/BoardMeetings/ → Components/Dashboard/ManageEvents/
│   ├── BoardMeetings.tsx → ManageEvents.tsx          # RENAME+EDIT  title "Manage Events"; tabs Events | Attendees; no pending badge
│   ├── MeetingsTable.tsx → EventsTable.tsx           # RENAME+EDIT  confirmed/capacity column; delete confirm counts attendees
│   ├── MeetingForm.tsx → EventForm.tsx               # RENAME+EDIT  labels; capacity error code; venue placeholder without "Boardroom"
│   ├── RequestsTable.tsx → AttendeesTable.tsx        # REWRITE  event filter, show-cancelled toggle, L/C icons, Resend confirmation
│   ├── format.ts                                     # MOVE
│   └── BoardMeetings.scss/.css → ManageEvents.scss/.css  # RENAME  (bm-* class names kept: me-* would collide with Bootstrap's margin utilities)
├── Pages/Boardroom/ → Pages/Events/
│   ├── Boardroom.tsx → EventsPage.tsx                # RENAME+EDIT  hero "Events", /events activePage, visitor → /contact with Full Name focused, "Confirm Attendance" meta, Attending/Fully booked
│   ├── EventCard.tsx                                 # MOVE
│   └── Boardroom.scss/.css → EventsPage.scss/.css    # RENAME (recompile)
├── Pages/Dashboard/Dashboard.tsx                     # EDIT  board_meetings → manage_events ("Manage Events"); legacy key alias
├── App.jsx                                           # EDIT  /events route; /boardroom → <Navigate to="/events" replace/>
├── Components/Footer/Footer.tsx                      # EDIT  navigateToBoardroom → navigateToEvents (/events)
├── Components/LockOverlay/LockOverlay.tsx            # EDIT  redirect=/events
└── index.scss (+ index.css)                          # EDIT  "BOARDROOM" section comment → "EVENTS PAGE" (br-* classes unchanged)
```

**Structure Decision**: Keep the existing web-app layout and 003's split:
- thin controllers
- email side effects in one notifications service
- one shared UI hook for both the Dashboard Events tab and the public Events page

Renames use `git mv`, so history is kept.

## Design Notes

### Server

- **Create attendance**: the steps are in [data-model.md § Create-attendance algorithm](./data-model.md#create-attendance-algorithm-fr-001-fr-005-fr-006).
  - The duplicate check comes before the seat reservation, so the common double click never touches the counter.
  - The compensation `$inc: -1` runs in a `finally`-style guard whenever the insert does not succeed.
- **`notifyAttendanceConfirmed(id)`**:
  - Loads the attendance and the event, builds `EVENT_*` variables (including `SEATS_LEFT` from the current counter) and their escaped HTML copies.
  - Sends the notification and the confirmation through `Promise.allSettled`, then records `notifications.leadership` and `notifications.confirmation`.
  - Never throws.
- **`sendConfirmation(id)`**: for admin resend. It is awaited, records the outcome and returns the status. It is 003's `sendInvitation`, renamed and pointed at the confirmation template.
- **Admin update**: refuse with `CAPACITY_BELOW_CONFIRMED` when `capacity < event.confirmedCount`. Use the stored counter, not a fresh count, so the check matches what the reservation compares against.
- **Admin list** no longer needs the per-status aggregation, because `confirmedCount` is on the document. The `countsByMeeting` aggregation is removed.
- **Delete event**: `deleteOne`, then `EventAttendance.deleteMany({ meetingId })`. The response key changes to `deletedAttendances`.
- **Config**:
  - `eventConfig.ts` keeps `DEFAULT_RECIPIENTS`, `EVENT_TIMEZONE` and `DUBAI_UTC_OFFSET_HOURS`.
  - `EVENT_TEMPLATES = { notification: "event_attendance_notification", confirmation: "event_attendance_confirmation" }`.
  - `dashboardUrl()` points to `?tab=manage_events`.
- **Migration** (`migrate_events_004.ts`), following [R7](./research.md#r7--migrating-feature-003-data):
  - It uses the raw `getCollection` for the legacy fields, then `EventAttendanceModel.syncIndexes()`.
  - It prints a per-event table (before → after) and the list of cancelled members.
  - `--notify` calls `sendConfirmation` sequentially for migrated pending → confirmed rows.
  - The nav patch reads and writes `file_storage/client_blueprint.json` only when an entry with `path: "/boardroom"` exists.

### UI

- **`useEventAttendance(onChanged)`** returns `{ confirm, pendingId }`. Its guards run in this order:
  1. past → no-op
  2. in-flight → no-op
  3. `myAttendance` → info toast
  4. `isFull` → info toast
  5. confirm dialog → `confirmAttendance()`

  The result handling and toasts are per the [contract UI table](./contracts/events.api.md#ui-contract). `onChanged` runs after every server response, so badges and the full state refresh.
- **`api/events.ts`**: `confirmAttendance(id)` resolves `{ kind: "created" | "exists", ...MyAttendance }`. It maps 409 `ALREADY_ATTENDING` to `exists` and rethrows everything else, including `EVENT_FULL`, which the hook turns into an info toast via `apiErrorCode`. The `itemsOf` guard from 003 (an HTML fallthrough is treated as failure) is kept.
- **Public `EventsPage`**:
  - Keep the card mapping (`toCard`). The `type` label becomes `"Upcoming · Members Event"` / `"Past · Members Event"`.
  - The meta becomes `[monthLabel, "Members Only", attending ? "Attending" : isFull ? "Fully Booked" : "Confirm Attendance"]`.
  - Remove the dead `useEffect` and the unused interfaces left over in `Boardroom.tsx`.
- **Dashboard**:
  - `MenuItem` replaces `board_meetings` with `manage_events`.
  - Before validating, `useSearchParams` normalizes `tab=board_meetings` to `manage_events` with `replace`.
  - `componentMap` maps `manage_events` to `<ManageEvents/>`.

## Rollout

1. Deploy the code.
2. On the server, run `npx tsx src/seed_event_templates.ts`.
3. Run `npx tsx src/migrate_events_004.ts` as a dry run and review the output with the client.
4. Run it with `--apply` (and `--notify` if the client wants migrated members emailed).
5. Optionally run `seed_event_templates.ts --remove-legacy` once the new emails are confirmed working.

Between steps 1 and 4, legacy `pending`/`approved` rows are not valid under the new enum. The admin list and the member list map unknown statuses defensively: `approved` is shown as `confirmed` and other statuses are hidden. This keeps the window harmless.

## Out of Scope / Follow-ups

- Members cancelling their own attendance, and admins removing an attendee (the `cancelled` status is reserved for this).
- A waitlist when an event is full.
- Re-notifying attendees when an event is edited or deleted, and `.ics` attachments. Both are carried over from 003.
- The Footer's *Privacy Policy* and *Terms* links point to the Events page. This was pre-existing (as Boardroom) and is kept as-is; it should get proper pages.
- Renaming the `br-*` CSS classes and the `boardmeetings`/`boardmeetingrequests` collections. They are not user-visible, so they are left alone.

## Complexity Tracking

None. There are no constitution violations.
