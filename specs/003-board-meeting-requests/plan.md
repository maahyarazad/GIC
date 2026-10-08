# Implementation Plan: Board Meeting Requests & Local Events

**Branch**: `003-board-meeting-requests` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-board-meeting-requests/spec.md`

## Summary

Events become **board meetings stored in GIC's own Mongo database** and are fully isolated from services.german-emirates-club.com.

1. **Member flow.** Any signed-in user clicks an upcoming meeting card and confirms. `POST /board-meetings/{id}/requests` stores a request: one per user per meeting, guarded by a unique index. A success toast appears. In the background, two emails go out from info@german-industry-club.com, sent through a new `SMTP_INFO_*` transport:
   - a notification to info@ with the five leadership addresses in CC
   - a receipt to the member

   The outcome of each email is recorded on the request. A **My Requests** table replaces feature 002's My Events (registrations and QR).
2. **Admin section.** A new Dashboard tab, **Board Meetings**, is limited to `admin`. It has two tabs:
   - **Meetings**: create, edit and delete meetings with title, date, time (GST), venue, location, capacity (default 10), an optional image from File Management and a description.
   - **Requests**: filter requests, approve or decline them, and resend failed invitations. Approval checks capacity, then sends the invitation email. There is no QR code.
3. **Removal.** The services-backed `event.controller.ts`, `servicesServer.ts`, services types, My Events/QR UI and both SSO redirects (Events and Boardroom) are deleted or rewritten ([research R8](./research.md#r8--removing-servicesgerman-emirates-clubcom)).

## Technical Context

**Language/Version**: TypeScript 5.9 (Node 20+, `tsx`/`tsc`); React 19 + TS (Vite 7) in `ui/`

**Primary Dependencies**: Express 4, tsoa 6, Mongoose 9, nodemailer 8, express-rate-limit. UI: axios, Bootstrap 5, Formik + Yup, the existing `ToastContext`, `ConfirmDialogProvider` (`useConfirm`) and `ModalContext`. **No new dependencies.**

**Storage**: MongoDB (Mongoose) with new collections `boardmeetings` and `boardmeetingrequests`, plus three seeded `emailtemplates` records.

**Testing**: The repo has no test runner. Validation is `npm run build`, the UI build, curl and manual scenarios in [quickstart.md](./quickstart.md), with recipient overrides pointing at a test inbox.

**Target Platform**: Linux server under PM2; modern desktop and mobile browsers.

**Project Type**: Web application. The API is in `src/` and the React SPA/SSR is in `ui/src/`.

**Performance Goals**: Request creation responds in under 500 ms because emails send after the response. Meeting lists take under 300 ms (fewer than 100 meetings, indexed queries).

**Constraints**:
- There must be no outbound call to services.german-emirates-club.com.
- Emails are sent from info@ only, with no silent fallback.
- Requester identity always comes from the user record.
- Only the `admin` role can manage meetings, enforced in both the server and the UI.
- Times are in Asia/Dubai.
- Styles are SCSS with committed compiled CSS.

**Scale/Scope**: Fewer than 10 approved attendees per meeting and a few dozen meetings per year. The change adds 2 models, 2 controllers, 1 config, 1 seed script, 1 middleware refactor and 1 email-service addition. It removes 1 controller, 1 helper and 1 types file. On the UI side it adds 1 API client, 1 hook and 4 components, rewrites 3 components and deletes 3.

**Open items (non-blocking for design)**: The `SMTP_INFO_USER` login currently fails with 535 ([R2](./research.md#r2--sending-from-infogerman-industry-clubcom)). The credentials must be fixed before email scenarios 5 and 9–10 in the quickstart can pass.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template, so there are no ratified gates. The design is checked against the repo's de-facto conventions instead, as in features 001 and 002:

| Convention | Complies? |
|---|---|
| tsoa controllers under `api/v1` with response envelopes | ✅ `BoardMeetingController`, `BoardMeetingAdminController` |
| Auth via `@Middlewares(authMiddleware / admin middleware)`, with identity from JWT → user record | ✅ admin check via a `requireRoles` factory, without duplicated verify logic |
| Mongoose models with timestamps and code-declared indexes (`BusinessLetterRequestModel` precedent) | ✅ |
| Email via DB templates + `{{VAR}}` substitution + `escapeHtml` | ✅ templates looked up by name and seeded idempotently |
| Fire-and-forget notifications that record their outcome (feature 001 `notifyLeadership`) | ✅ background notification and receipt; the invitation is awaited for admin feedback |
| Dashboard components with SCSS + compiled CSS; reuse `useToast`, `useConfirm`, `useModal`, `axiosInstance` | ✅ |
| Recipients configurable by env (`BUSINESS_LETTER_RECIPIENTS` precedent) | ✅ `BOARD_MEETING_NOTIFY_TO`, `BOARD_MEETING_CC` |
| No new dependencies | ✅ |

**Result (pre-research)**: PASS. **Result (post-design)**: PASS. The design adds no new layers, and the net code removed (the services proxy) offsets the new modules.

## Project Structure

### Documentation (this feature)

```text
specs/003-board-meeting-requests/
├── spec.md
├── plan.md                         # this file
├── research.md                     # Phase 0
├── data-model.md                   # Phase 1
├── quickstart.md                   # Phase 1
├── contracts/
│   └── board-meetings.api.md       # REST + email + UI contract
└── tasks.md                        # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── config/
│   └── boardMeetingConfig.ts               # NEW  BOARD_MEETING_NOTIFY_TO, BOARD_MEETING_CC (DEFAULT_RECIPIENTS), template names
├── models/
│   ├── boardMeeting.model.ts               # NEW  schema + mapBoardMeeting (Dubai date/time, isPast)
│   └── boardMeetingRequest.model.ts        # NEW  schema, unique {meetingId,userId}, mapBoardMeetingRequest
├── types/
│   ├── boardMeeting.types.ts               # NEW  DTOs + BoardMeetingInput (contract)
│   └── event.types.ts                      # DELETE (services types)
├── controllers/
│   ├── boardMeeting.controller.ts          # NEW  GET /board-meetings, POST /board-meetings/{id}/requests
│   ├── boardMeetingAdmin.controller.ts     # NEW  admin meetings CRUD + requests list/approve/decline/resend
│   └── event.controller.ts                 # DELETE (/events, /my-events, /my-events/{reference}/qr)
├── services/
│   ├── boardMeetingNotifications.ts        # NEW  notifyRequestCreated(), sendInvitation(); record outcomes; never throw
│   ├── emailService.ts                     # EDIT + sendInfoEmail({to,cc,replyTo,subject,html,text}), renderTemplateByName()
│   └── servicesServer.ts                   # DELETE
├── middleware/
│   └── adminauth.middleware.ts             # EDIT requireRoles(roles) factory; adminAuthMiddleware unchanged; + adminOnlyMiddleware
├── seed_board_meeting_templates.ts         # NEW  idempotent insert of the 3 email templates
├── server.ts                               # EDIT drop envVars.SERVICES_SERVER_ORIGIN
└── routes/routes.ts, swagger/swagger.json  # REGENERATED by tsoa

ui/src/
├── api/
│   ├── boardMeetings.ts                    # NEW  member + admin calls (typed with src/types/boardMeeting.types)
│   └── myEvents.ts                         # DELETE
├── Hooks/
│   └── useBoardMeetingRequest.ts           # NEW  confirm → POST → toast (success/info/error), in-flight guard; used by Events + Boardroom
├── Components/Dashboard/Events/
│   ├── Events.tsx                          # REWRITE  local meetings, Upcoming/Past, request flow
│   ├── EventCard.tsx                       # EDIT  generic props {title,date,subtitle,imageUrl,badge}; local /uploads base; no services URL
│   ├── MyRequests.tsx                      # NEW  "My Requests" table (replaces MyEvents)
│   ├── Events.scss / Events.css            # EDIT  status badge + chip styles; remove QR styles
│   ├── EventCard.scss / EventCard.css      # EDIT  status badge
│   ├── MyEvents.tsx, MyEventQr.tsx         # DELETE
├── Components/Dashboard/BoardMeetings/
│   ├── BoardMeetings.tsx                   # NEW  tabs: Meetings | Requests (pending badge)
│   ├── MeetingsTable.tsx                   # NEW  list + New/Edit (modal) + Delete (confirm)
│   ├── MeetingForm.tsx                     # NEW  Formik + Yup, server errors → fields, image preview
│   ├── RequestsTable.tsx                   # NEW  filters, approve/decline/resend, email status icons
│   └── BoardMeetings.scss / .css           # NEW
├── Pages/Dashboard/Dashboard.tsx           # EDIT  + "board_meetings" menu item (admin only), title "Board Meetings"
└── Pages/Boardroom/Boardroom.tsx           # EDIT  fetch /board-meetings when signed in; useBoardMeetingRequest; no /sso
```

**Structure Decision**: The existing web-app layout is kept. Email side effects live in `src/services/boardMeetingNotifications.ts`, so both controllers stay thin. The request flow lives in a single UI hook that the Dashboard Events tab and the public Boardroom page share.

## Design Notes

### Server

- **`emailService.ts`**:
  - `sendInfoEmail()` builds a transporter from `SMTP_HOST`/`SMTP_PORT` and `SMTP_INFO_USER`/`SMTP_INFO_PASS`, with `from: SMTP_INFO_SENDER`, and throws on failure.
  - `renderTemplateByName(name, data)` reuses `replacePlaceholders` and `getGlobalEmailVariables`, and throws `Email template not found: <name>` when the template is missing.
  - Existing senders are untouched.
- **`boardMeetingNotifications.ts`**:
  - `notifyRequestCreated(requestId)` loads the request and meeting, builds the escaped variables, runs leadership and receipt through `Promise.allSettled`, and writes `notifications.leadership` and `notifications.receipt`.
  - `sendInvitation(requestId)` writes `notifications.invitation` and returns the status.
  - Neither function ever throws, following feature 001's `notifyLeadership`.
- **Create request** (in order):
  1. Validate the id.
  2. Load the user (404 if missing) and the meeting (404 if missing).
  3. Check that the meeting is upcoming (409 `MEETING_PAST`).
  4. Create the request with `reference` `BM-YYYYMMDD-XXXXXX` and the requester snapshot. Retry once on a reference collision. On a `{meetingId,userId}` duplicate, return 409 `ALREADY_REQUESTED` with the existing request.
  5. Run `void notifyRequestCreated(id)` and respond 201.
- **Approve** (in order):
  1. Load the request (404 if missing).
  2. Check that it is pending (409 `NOT_PENDING`).
  3. Check that the meeting is upcoming (409 `MEETING_PAST`).
  4. Check capacity with `countDocuments(approved) < capacity` (409 `MEETING_FULL`).
  5. Run the conditional `findOneAndUpdate({_id, status:"pending"}, {status:"approved", decision})`. A null result means 409 `NOT_PENDING`.
  6. `await sendInvitation()`, then respond with the DTO.
- **Decline**: a conditional update only.
- **Resend**: allowed only when the request is `approved` and the invitation is `failed`, `pending` or `not_sent`.
- **Admin list**: one `aggregate` groups requests by `{meetingId, status}` for the counts.
- **Request list**: `populate` the meeting and the `decision.by` name, with a limit of 500.
- **Delete meeting**: `deleteOne`, then `BoardMeetingRequest.deleteMany({meetingId})`. The response returns `deletedRequests`.
- **Dates**: `toStartsAt(date, time)` returns `Date.UTC(y, m-1, d, hh-4, mm)` after validating the calendar day (same overflow guard as `parseDateOnly` in feature 001). `toDubaiParts(startsAt)` formats with `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", … })`.

### UI

- **`useBoardMeetingRequest(onChanged)`** returns `request(meeting)`. If `meeting.myRequest` already exists, it shows an info toast. Otherwise it runs `useConfirm` and then the POST, which leads to one of three outcomes:
  - success: a success toast, then `onChanged()`
  - 409 `ALREADY_REQUESTED`: an info toast, then `onChanged()`
  - any other error: an error toast with the server message, then `onChanged()`

  A `useRef` in-flight flag blocks double clicks.
- **`Events.tsx`** keeps the `splitEventsByDate`-style split, now based on `isPast`. It also keeps the memoised `EventsGroup`/`EventItem` structure and the two-column layout. The right column becomes `<MyRequests items={meetings.filter(m => m.myRequest)} />`, so there is only one fetch. Past cards get no `onClick`.
- **`EventCard`** takes `{ title, date, subtitle?, imageUrl?, badge?, onClick? }`. Its image URL is `new URL(imageUrl, window.location.origin)` (local `/uploads`), and it keeps the GIC-logo fallback and the 16:9 layout. `toLocalDay` stays exported.
- **Admin**:
  - `BoardMeetings.tsx` holds the tab state.
  - The tables fetch on mount and after every mutation.
  - `MeetingForm` sits in `openModal({ content })` and owns its submit and close buttons, so it does not use the modal's confirm button and can stay open when there are validation errors.
  - All destructive and decision actions go through `useConfirm`.
- **Dashboard**:
  - Add `board_meetings` to the `MenuItem` union, `accessControl` (`["admin"]`), `menuTitles` (`"Board Meetings"`), `isValidMenuItem` and `componentMap`.
  - The member tab keeps the title "Events", per the user's wording ("the new events section").

## Out of Scope / Follow-ups

- `GET /api/v1/sso` now has no callers; delete it once confirmed that no external system uses it.
- `SERVICES_SERVER_ORIGIN_*` and `EXTERNAL_ACCESS_SECRET` can be removed from `.env` and deploy secrets.
- Not built in this feature:
  - a decline email
  - re-notifying approved attendees when a meeting is edited or deleted
  - calendar (.ics) attachments on invitations
  - letting members withdraw their own requests
- The Mongoose `User.role` enum lacks `procurement` even though the UI and `adminAuthMiddleware` use it. This feature does not touch it.

## Complexity Tracking

None. There are no constitution violations.
