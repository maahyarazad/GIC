---

description: "Task list for Board Meeting Requests & Local Events"
---

# Tasks: Board Meeting Requests & Local Events

**Input**: Design documents from `/specs/003-board-meeting-requests/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/board-meetings.api.md](./contracts/board-meetings.api.md), [quickstart.md](./quickstart.md)

**Tests**: The spec does not ask for automated tests, and the repo has no test runner (research R11). Each story is validated through the [quickstart.md](./quickstart.md) scenarios listed in its checkpoint.

**Organization**: Tasks are grouped by user story so each story can be built and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story from spec.md (US1, US2, US3)
- Paths are relative to the repo root. The API is in `src/` and the UI is in `ui/src/` (plan → Project Structure).

## Conventions every task follows

- **Response envelopes**: tsoa controllers return `createSuccessResponse` / `createErrorResponse` from `src/utils/helpers.ts` and set statuses with `this.setStatus()`. Pattern: `src/controllers/businessLetter.controller.ts`.
- **Identity**: comes from `toObjectId((req as any).user?.userId)` plus a `UserModel` lookup. Never take name, email or phone from the request body.
- **Error codes**: use exactly the `code` values in the contract (`INVALID_ID`, `MEETING_NOT_FOUND`, `MEETING_PAST`, `ALREADY_REQUESTED`, `VALIDATION_ERROR`, `NOT_PENDING`, `MEETING_FULL`, `NOT_APPROVED`, `ALREADY_SENT`, `REQUEST_NOT_FOUND`, `USER_NOT_FOUND`, `CAPACITY_BELOW_APPROVED`).
- **UI types**: UI code imports DTO types from `../../../src/types/boardMeeting.types` (relative path, as `ui/src/api/myEvents.ts` does today).
- **Styles**: edit the `.scss` file and commit a matching hand-updated `.css` file, since there is no sass build step.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuration and types that every story imports.

- [X] T001 [P] Create `src/config/boardMeetingConfig.ts`, following `src/config/businessLetterConfig.ts` (dotenv + `parseRecipients`). It must:
  - Define `DEFAULT_RECIPIENTS` exactly as the user gave it: ricco.deutscher@, philip.hoelzer@, jan.hussing@, thomas.hochberger@ (all `@german-industry-club.com`) and `office6@german-emirates-club.com`.
  - Export `BOARD_MEETING_CC`: the `BOARD_MEETING_CC` env var (comma-separated) if set, otherwise `DEFAULT_RECIPIENTS`.
  - Export `BOARD_MEETING_NOTIFY_TO`: the `BOARD_MEETING_NOTIFY_TO` env var, otherwise `process.env.SMTP_INFO_SENDER`, otherwise `"info@german-industry-club.com"`.
  - Export `BOARD_MEETING_TEMPLATES = { notification: "board_meeting_request_notification", receipt: "board_meeting_request_receipt", invitation: "board_meeting_invitation" } as const`.
  - Export `BOARD_MEETING_TIMEZONE = "Asia/Dubai"` and `DUBAI_UTC_OFFSET_HOURS = 4`.
- [X] T002 [P] Create `src/types/boardMeeting.types.ts` with every DTO in the contract's "DTOs" block: `BoardMeetingRequestStatus`, `NotificationStatus`, `BoardMeetingDto`, `MemberBoardMeetingDto`, `AdminBoardMeetingDto`, `BoardMeetingRequestDto` and `BoardMeetingInput`. Add `REQUEST_STATUS_LABELS: Record<BoardMeetingRequestStatus, string>`, mapping pending to "Pending", approved to "Approved" and declined to "Declined". Use plain interfaces only (no Mongoose imports) so the UI can import the file.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Models, time helpers, the info@ email sender, the admin-only middleware and email templates that all three stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Create `src/models/boardMeeting.model.ts` (depends on T001 and T002), modelled on `src/models/businessLetterRequest.model.ts`.
  - **Schema** (fields and limits from data-model.md):
    - `title`: required, trimmed, maxlength 160.
    - `description`: default "", maxlength 2000.
    - `startsAt`: Date, required.
    - `venue`: required, maxlength 160.
    - `location`: required, maxlength 300.
    - `imageUrl`: String, default null.
    - `capacity`: Number, min 1, max 50, default 10.
    - `createdBy` and `updatedBy`: ObjectId refs to `User`.
    - Options: `timestamps: true`; index `{ startsAt: -1 }`.
  - **Model**: export `BoardMeetingModel = model("BoardMeeting", schema)`.
  - **Time helpers** (exported):
    - `toStartsAt(date: string, time: string): Date | null`. Validate `date` against `^(\d{4})-(\d{2})-(\d{2})$`, rejecting overflow such as 2026-02-31 (same guard as `parseDateOnly` in `businessLetter.controller.ts`). Validate `time` against `^([01]\d|2[0-3]):([0-5]\d)$`. Return `new Date(Date.UTC(y, m-1, d, hh - DUBAI_UTC_OFFSET_HOURS, mm))`.
    - `toDubaiParts(startsAt: Date): { date: "YYYY-MM-DD"; time: "HH:mm" }`, using `Intl.DateTimeFormat("en-CA", { timeZone: BOARD_MEETING_TIMEZONE, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hourCycle:"h23" })` with `formatToParts`.
    - `formatMeetingDateForEmail(startsAt)` returns e.g. "Thu, 15 Oct 2026" (`en-GB`, Dubai).
    - `formatMeetingTimeForEmail(startsAt)` returns e.g. "18:30 (GST)".
  - **Mapper**: export `mapBoardMeeting(doc, now = new Date()): BoardMeetingDto`. Set `id` from `_id`, `description` to `""` when unset, `startsAt` as ISO, `date`/`time` from `toDubaiParts`, `imageUrl` to null when empty, and `isPast = startsAt <= now`.
- [X] T004 [P] Create `src/models/boardMeetingRequest.model.ts` (depends on T002).
  - **Schema**:
    - `reference`: String, required, unique, indexed.
    - `meetingId`: ObjectId ref `BoardMeeting`, required.
    - `userId`: ObjectId ref `User`, required.
    - `requester`: `{ name` (required, trimmed, maxlength 120), `email` (required, lowercase, trimmed), `phone` (default "", maxlength 40) `}`.
    - `status`: enum `pending|approved|declined`, default `pending`.
    - `decision`: `{ by` (ObjectId ref `User`, default null), `at` (Date, default null) `}`.
    - `notifications`: `{ leadership, receipt, invitation }`, each a sub-schema `{ status` (enum `not_sent|pending|sent|failed`), `attemptedAt` (Date, null), `error` (String, null) `}` with `_id: false`. Defaults: `leadership` and `receipt` are `pending`; `invitation` is `not_sent`.
    - Options: `timestamps: true`.
  - **Indexes**: unique `{ meetingId: 1, userId: 1 }`, `{ status: 1, createdAt: -1 }`, `{ userId: 1, createdAt: -1 }`.
  - **Exports**:
    - `BoardMeetingRequestModel`.
    - `buildBoardMeetingReference(id: ObjectId)` returning `BM-YYYYMMDD-XXXXXX` (last 6 hex characters of the id, upper-cased, as `buildReference` in `businessLetter.controller.ts`).
    - `mapBoardMeetingRequest(doc): BoardMeetingRequestDto`. It expects `meetingId` populated as a meeting doc (use `mapBoardMeeting` for the meeting `Pick`) and `decision.by` optionally populated with `name`. Omit `error` text from `notifications` in the DTO.
- [X] T005 [P] Edit `src/services/emailService.ts`:
  - Add exported `sendInfoEmail({ to, cc, replyTo, subject, html, text })`. It builds a nodemailer transport from `SMTP_HOST`, `Number(SMTP_PORT)`, `secure: false` and `auth: { user: SMTP_INFO_USER, pass: SMTP_INFO_PASS }`, and sends with `from: process.env.SMTP_INFO_SENDER`. It logs the messageId and rethrows on failure. There is no fallback to `SMTP_USER` (research R2).
  - Add exported `renderTemplateByName(name: string, data: Record<string, any>): Promise<{ subject; html; text }>`. It looks up `getCollection("emailtemplates").findOne({ name })`, throws `Email template not found: <name>` when missing, and merges `getGlobalEmailVariables(data)` with `data` through the existing `replacePlaceholders`.
  - Leave existing functions unchanged.
- [X] T006 [P] Refactor `src/middleware/adminauth.middleware.ts` into an exported factory `requireRoles(roles: string[])`. It returns the current middleware body, with `ADMIN_ROLES` replaced by `roles` in both the fresh-token and the refresh-token branches. Keep `export const adminAuthMiddleware = requireRoles(["admin", "procurement"])` so existing routes behave identically, and add `export const adminOnlyMiddleware = requireRoles(["admin"])`. Keep the 403 message "Forbidden: Admins only".
- [X] T007 Create the idempotent seed script `src/seed_board_meeting_templates.ts` (depends on T001). It must:
  - Call `connectToDatabase()` from `src/db.ts`.
  - For each of the three `BOARD_MEETING_TEMPLATES` names, insert into `emailtemplates` **only if no document with that name exists**, with `{ name, subject, html, text, variables, createdAt, updatedAt }` (shape of `EmailTemplate` in `emailService.ts`). Log "created" or "exists – skipped" per template, then close the connection.
  - Use table-based inline-styled HTML, matching the commented OTP template in `emailService.ts` (header colour `#D9B144`, 600px width, footer `© {{CURRENT_YEAR}} German Industry Club`).
  - Provide these subjects and bodies, using exactly the variables listed in data-model.md → Email templates:
    - **Notification**: subject `Board meeting request – {{MEETING_TITLE}} – {{REQUESTER_NAME}}`. The body is a details table (Reference, Name, Email, Phone, Meeting, Date, Time, Venue, Location, Submitted at) plus a link `{{DASHBOARD_URL}}` labelled "Review in the dashboard".
    - **Receipt**: subject `Your board meeting request – {{MEETING_TITLE}}`. The body is "Dear {{REQUESTER_NAME}}, your request to join the board meeting has been sent to the board…" plus the meeting details and the reference.
    - **Invitation**: subject `Invitation: {{MEETING_TITLE}} – {{MEETING_DATE}}`. The body is "Dear {{REQUESTER_NAME}}, you are invited to…" plus Date, Time, Venue, Location, `{{MEETING_DESCRIPTION}}` and the reference. There is no QR code and no attachment.

**Checkpoint**: `npm run build` passes, and `npx tsx src/seed_board_meeting_templates.ts` creates the three templates on the first run and skips them on the second.

---

## Phase 3: User Story 1 - Request to join a board meeting (Priority: P1) 🎯 MVP

**Goal**: Any signed-in user clicks an upcoming meeting and confirms. The request is stored once, the leadership notification and the receipt go out from info@, a success toast shows, and My Requests lists it. All services.german-emirates-club.com code paths are removed.

**Independent Test**:
1. Insert one future meeting directly, either with `db.boardmeetings.insertOne({ title, startsAt, venue, location, capacity: 10, createdAt: new Date(), updatedAt: new Date() })` or through the admin API once US2 exists.
2. Run quickstart scenarios 4–8, 14 (member part), 15, 16 and 17.

### Implementation for User Story 1

- [X] T008 [US1] Create `src/services/boardMeetingNotifications.ts` (depends on T003, T004, T005, T001) with an exported `notifyRequestCreated(requestId: ObjectId | string): Promise<void>` that **never throws**. It must:
  - Load the request (lean) and its meeting. If either is missing, log and return.
  - Build the variables, passing every value through `escapeHtml` from `src/utils/helpers.ts`:
    - `REFERENCE`, `REQUESTER_NAME`, `REQUESTER_EMAIL`.
    - `REQUESTER_PHONE`, with "—" when empty.
    - `MEETING_TITLE`, `MEETING_VENUE`, `MEETING_LOCATION`.
    - `MEETING_DATE` and `MEETING_TIME`, from the T003 formatters.
    - `SUBMITTED_AT`: `en-GB`, Asia/Dubai, as in `notifyLeadership`.
    - `DASHBOARD_URL`: `<CLIENT_ORIGIN_PROD or CLIENT_ORIGIN_DEV by NODE_ENV === "PRODUCTION">/dashboard?tab=board_meetings`.
  - Run both sends with `Promise.allSettled`:
    - **(a) Leadership**: `renderTemplateByName(BOARD_MEETING_TEMPLATES.notification)` → `sendInfoEmail({ to: BOARD_MEETING_NOTIFY_TO, cc: BOARD_MEETING_CC, replyTo: requester.email })`.
    - **(b) Receipt**: `renderTemplateByName(BOARD_MEETING_TEMPLATES.receipt)` → `sendInfoEmail({ to: requester.email, replyTo: BOARD_MEETING_NOTIFY_TO })`.
  - Write `notifications.leadership` and `notifications.receipt` with one `updateOne`, as `{ status: "sent"|"failed", attemptedAt: new Date(), error: <message sliced to 500 chars> | null }`. Wrap the update in its own try/catch, following `notifyLeadership` in `businessLetter.controller.ts`.
  - Export a private helper `buildEmailVariables(request, meeting)` so T026 can reuse it.
- [X] T009 [US1] Create `src/controllers/boardMeeting.controller.ts` with `@Route("api/v1/board-meetings") @Tags("Board Meetings") export class BoardMeetingController extends Controller` (depends on T003, T004, T008). It needs two endpoints:
  - **`@Get("/") @Middlewares(authMiddleware) getBoardMeetings(@Request() req)`**:
    - Resolve `userId`; return 401 `UNAUTHORIZED` if missing.
    - Load all meetings sorted `{ startsAt: 1 }` (lean) and the caller's requests `BoardMeetingRequestModel.find({ userId }).select("meetingId reference status createdAt")`.
    - Map each meeting to `MemberBoardMeetingDto`, with `myRequest = { reference, status, createdAt ISO } | null`.
    - Return 200 `data: { items }` with "Board meetings fetched".
  - **`@Post("/{id}/requests") @Middlewares<Function>(strictLimiter, authMiddleware) @SuccessResponse("201", ...) createJoinRequest(@Path() id, @Request() req)`**, in this order:
    1. Return 400 `INVALID_ID` if `toObjectId(id)` is null.
    2. Load the user; return 404 `USER_NOT_FOUND` if missing.
    3. Load the meeting; return 404 `MEETING_NOT_FOUND` if missing.
    4. Return 409 `MEETING_PAST` ("This meeting has already taken place") if `startsAt <= now`.
    5. Create the request with `_id = new ObjectId()`, `reference = buildBoardMeetingReference(_id)`, `meetingId`, `userId` and `requester { name: user.name, email: user.email lowercased, phone: user.phone ?? "" }`.
    6. Handle `E11000`:
       - When `keyPattern` contains `meetingId`, find the existing request by `{ meetingId, userId }` and return 409 `ALREADY_REQUESTED` with `data: { reference, status, createdAt }`.
       - When `keyPattern` contains `reference`, retry once with a new `_id`.
    7. Run `void notifyRequestCreated(doc._id)` and return 201 "Your request has been sent to the board meeting" with `data: { reference, status, createdAt }`.
    8. On an unexpected error, return 500 `INTERNAL_ERROR`.
- [X] T010 [US1] Delete the services-backed server code (depends on T009):
  - Delete `src/controllers/event.controller.ts`, `src/services/servicesServer.ts` and `src/types/event.types.ts`.
  - In `src/server.ts`, remove `SERVICES_SERVER_ORIGIN` from `envVars`.
  - Run `grep -rn "event.types\|servicesServer\|event.controller" src ui/src` and fix any remaining import. `ui/src/Components/Dashboard/Events/*` is handled by T012–T015.
  - Leave `src/controllers/sso.controller.ts` untouched (plan → Out of Scope).
- [X] T011 [P] [US1] Create `ui/src/api/boardMeetings.ts` (depends on T002) using `axiosInstance`, modelled on `ui/src/api/businessLetter.ts` and `ui/src/api/myEvents.ts`:
  - `getBoardMeetings(): Promise<MemberBoardMeetingDto[]>` calls `GET /board-meetings` and returns `data.data.items ?? []`.
  - `requestToJoin(id: string): Promise<{ kind: "created" | "exists"; reference: string; status: BoardMeetingRequestStatus }>` calls `POST /board-meetings/${encodeURIComponent(id)}/requests` with `validateStatus` accepting 2xx and 409. On 409 with `code === "ALREADY_REQUESTED"` it returns `kind: "exists"`. On any other 409 it throws an `Error` carrying the server `message` and `code`.
  - Leave a `// --- Admin ---` section marker at the end of the file for T019/T027.
- [X] T012 [P] [US1] Create `ui/src/Hooks/useBoardMeetingRequest.ts` (depends on T011). It exports `useBoardMeetingRequest(onChanged: () => void)` returning `{ request: (meeting: MemberBoardMeetingDto) => Promise<void>, pendingId: string | null }`.
  - Use `useConfirm` from `@/Providers/ConfirmDialogProvider`, `useToast` from `@/Providers/ToastContext`, and a `useRef` in-flight flag.
  - When `meeting.isPast`, return immediately.
  - When `meeting.myRequest` is set, show an info toast "You already requested this meeting (<REQUEST_STATUS_LABELS[status]>)" and return.
  - Otherwise call `confirm({ title: "Request to join", message: "Send a request to join “<title>” on <dd MMM yyyy from date> at <time> (GST)?", confirmText: "Send request", cancelText: "Cancel" })`. If the user cancels, do nothing.
  - Then call `requestToJoin` and handle the result:
    - `created`: success toast "Your request has been sent to the board meeting".
    - `exists`: info toast as above.
    - Thrown error: error toast with `err.message || "Failed to send your request. Please try again."`.
  - Call `onChanged()` after any server response (in `finally`, when a POST was made), and clear the flag.
- [X] T013 [US1] Edit `ui/src/Components/Dashboard/Events/EventCard.tsx` (and `EventCard.scss`/`EventCard.css`):
  - **Props**: replace the `Event`-typed prop with generic props `{ title: string; date?: string | null; subtitle?: string; imageUrl?: string | null; badge?: { label: string; tone: "pending" | "approved" | "declined" } ; showUpcomingBadge?: boolean; onClick?: () => void; footer?: React.ReactNode; columnClassName?: string }`.
  - **Remove**: the `Event` import and the services `uploads` base URL.
  - **Image**: resolve with `new URL(imageUrl, window.location.origin)` (local `/uploads`), guarded for SSR with `typeof window !== "undefined"`. Otherwise use the root-relative string.
  - **Keep**: `toLocalDay`, the date block (from `date`), the 16:9 layout, the video/GIC-logo fallback and the upcoming pulse badge.
  - **Subtitle**: render it under the title as `.event-card__subtitle` (one line, ellipsis).
  - **Status badge**: render `badge` as a top-right `.event-status-badge.event-status-badge--{tone}` pill.
  - **No `onClick`**: when `onClick` is undefined, add class `event-card--static` (`cursor: default`) and attach no handler.
- [X] T014 [P] [US1] Create `ui/src/Components/Dashboard/Events/MyRequests.tsx` (depends on T002), with props `{ items: MemberBoardMeetingDto[] }`, reusing the table markup and CSS classes of the current `MyEvents.tsx` (`my-events-*`).
  - **Heading**: "My Requests".
  - **Columns**:
    - Meeting: title, plus venue in `.my-events-muted`.
    - Date & time: `dd MMM yyyy` from `date` (via `toLocalDay`), followed by `time` + " GST".
    - Requested on: `myRequest.createdAt`, formatted `en-GB`.
    - Status: a chip `.request-status.request-status--{status}` with `REQUEST_STATUS_LABELS`.
  - **Sorting**: by `startsAt` descending.
  - **Empty state**: "You haven't requested to join any board meetings yet."
  - **No QR** and no actions.
- [X] T015 [US1] Rewrite `ui/src/Components/Dashboard/Events/Events.tsx` (depends on T011–T014):
  - **Remove**: `SERVICES_REGISTRATION_URL`, the `/sso` call and the `MyEvents` import.
  - **Fetch**: `getBoardMeetings()` in a `load()` callback (AbortController on unmount, as today). Keep `loading` and `failed` state. On failure, show an inline error with a **Retry** button instead of only a toast.
  - **Split**: upcoming is `!isPast`, sorted by `startsAt` ascending. Past is `isPast`, sorted descending. Group headings are "Upcoming Meetings" / "Past Meetings", with empty texts "No upcoming meetings." / "No past meetings.".
  - **Structure**: keep the memoised `EventsGroup`/`EventItem` pattern, keyed by `id`. Each `EventCard` gets:
    - `title`
    - `date={meeting.date}`
    - `subtitle={`${venue} · ${time} GST`}`
    - `imageUrl`
    - `badge` from `myRequest`: Requested (pending), Invited (approved), Declined (declined)
    - `onClick` only for upcoming meetings, calling `request(meeting)` from `useBoardMeetingRequest(load)`
  - **Layout**: keep the two-column layout. The right column renders `<MyRequests items={meetings.filter(m => m.myRequest)} />`.
- [X] T016 [US1] Update the Events styles in `ui/src/Components/Dashboard/Events/Events.scss` and the compiled `Events.css`. Add `.request-status` chips (pending: amber, approved: green, declined: muted red, using the existing dashboard theme variables), the error/Retry block style, and the `.event-status-badge` tones if not placed in EventCard.scss. Remove QR-dialog-only styles (`.my-event-qr*`) once `MyEventQr.tsx` is deleted.
- [X] T017 [US1] Delete `ui/src/Components/Dashboard/Events/MyEvents.tsx`, `ui/src/Components/Dashboard/Events/MyEventQr.tsx` and `ui/src/api/myEvents.ts` (depends on T015). Run `grep -rn "MyEvents\|MyEventQr\|myEvents\|event.types" ui/src` and fix leftovers.
- [X] T018 [US1] Edit `ui/src/Pages/Boardroom/Boardroom.tsx` (depends on T011, T012):
  - **Remove**: `handleNavigation` (the `/sso` call and the services redirect, including the commented localhost line).
  - **Fetch**: `fetchEvents` calls `getBoardMeetings()` **only when `user` is signed in** (`useEffect` on `[loading, user]`). When signed out, set an empty list and show no error toast.
  - **Mapping**: show only `!isPast` meetings, mapped to the existing card shape:
    - `id`, `page: id`
    - `city`: `location` truncated
    - `day`: from `date`
    - `monthLabel`: `en-US` "Month YYYY"
    - `type`: "Upcoming · Board Meeting"
    - `title`
    - `description`: plain `description`, no `stripHtml`, since it is plain text
    - `meta`: `[`${time} GST`, venue, statusLabel ?? "Request to Join"]`
  - **Click**: `ui/src/Pages/Boardroom/EventCard.tsx` calls `_onClick(event.page)`. Look up the meeting by id and call `request(meeting)` from `useBoardMeetingRequest(fetchEvents)`.

**Checkpoint**: Quickstart scenarios 4–8, 15, 16 and 17 pass. US1 works on its own, using meetings inserted directly into Mongo.

---

## Phase 4: User Story 2 - Admin manages board meetings (Priority: P1)

**Goal**: Admins create, edit and delete meetings (title, date, time in GST, venue, location, capacity, optional image and description) in a new admin-only Dashboard tab.

**Independent Test**: Quickstart scenarios 1, 2, 3 and 13 (edit and delete parts). A meeting created here appears in the member Events tab from US1.

### Implementation for User Story 2

- [X] T019 [US2] Create `src/controllers/boardMeetingAdmin.controller.ts` with `@Route("api/v1/admin/board-meetings") @Tags("Board Meetings Admin") export class BoardMeetingAdminController extends Controller`. Every method uses `@Middlewares(adminOnlyMiddleware)` (depends on T003, T004, T006).
  - **Validation**: a local `validateMeetingInput(body: BoardMeetingInput): { errors: Record<string,string>; value?: {...} }` that trims strings and applies the contract's validation list:
    - `title`: 3–160
    - `description`: ≤ 2000
    - `date` and `time`: via `toStartsAt`, with `errors.date` for an invalid day and `errors.time` for an invalid time
    - `venue`: 2–160
    - `location`: 2–300
    - `imageUrl`: empty, null or `^/uploads/[A-Za-z0-9._-]{1,128}$`, stored as null when empty
    - `capacity`: integer 1–50, default 10
  - **`toAdminDto(doc, counts)`**: returns `mapBoardMeeting` plus `counts` and `createdAt`/`updatedAt` ISO.
  - **`@Get("/")`**: load all meetings sorted `{ startsAt: -1 }` and one `BoardMeetingRequestModel.aggregate([{ $group: { _id: { meetingId: "$meetingId", status: "$status" }, n: { $sum: 1 } } }])` folded into a `Map<meetingId, counts>` (zeros by default). Return `data: { items }`.
  - **`@Post("/") @SuccessResponse("201")`**: validate (400 `VALIDATION_ERROR` with `errors`), then create with `createdBy` and `updatedBy` set to the admin's userId. Return 201 with the DTO and zero counts.
  - **`@Put("/{id}")`**:
    - Return 400 `INVALID_ID` for a bad id, 400 `VALIDATION_ERROR` for invalid input and 404 `MEETING_NOT_FOUND` when missing.
    - Count approved requests. If `capacity < approved`, return 400 `CAPACITY_BELOW_APPROVED` with `errors.capacity = "Capacity cannot be below the N approved attendees"`.
    - Otherwise replace the fields, set `updatedBy` and return the DTO with counts.
  - **`@Delete("/{id}")`**: return 400 `INVALID_ID` or 404 as above. Otherwise `deleteOne` the meeting, then `BoardMeetingRequestModel.deleteMany({ meetingId })`, and return `data: { deletedRequests }`.
- [X] T020 [US2] Run `npm run build` to regenerate `src/routes/routes.ts` and `src/swagger/swagger.json` with tsoa, and confirm the new routes appear (depends on T009, T019). Fix any tsoa type errors. In particular, `BoardMeetingInput` must be an exported interface without union-heavy generics, and `noImplicitAdditionalProperties: "throw"` rejects unknown body keys.
- [X] T021 [P] [US2] Extend `ui/src/api/boardMeetings.ts` under the `// --- Admin ---` marker (depends on T011):
  - `adminListMeetings(): Promise<AdminBoardMeetingDto[]>`
  - `adminCreateMeeting(input: BoardMeetingInput)`
  - `adminUpdateMeeting(id, input)`
  - `adminDeleteMeeting(id): Promise<{ deletedRequests: number }>`

  For 400 responses, use `validateStatus` so callers receive `{ ok: false, errors, message }` rather than an exception. This lets the form map field errors.
- [X] T022 [P] [US2] Create `ui/src/Components/Dashboard/BoardMeetings/MeetingForm.tsx` (depends on T002, T021), with props `{ meeting?: AdminBoardMeetingDto; onSaved: () => void; onCancel: () => void }`.
  - **Formik + Yup** schema mirroring the server rules: title 3–160, description ≤ 2000, date required, time matching `HH:mm`, venue 2–160, location 2–300, imageUrl optional matching `^/uploads/[A-Za-z0-9._-]{1,128}$`, capacity integer 1–50 with default 10.
  - **Inputs**:
    - `type="date"` and `type="time"`, labelled "Date (GST)" and "Time (GST)", prefilled from `meeting.date` and `meeting.time`.
    - Venue and Location.
    - Capacity: `type="number"`.
    - Image path: text input with hint "Upload in File Management, then paste the /uploads/… path", plus a live `<img>` preview when the value is valid.
    - Description: textarea.
  - **Submit**: calls create or update. On `{ ok: false, errors }`, use `setErrors(errors)`. On success, show a toast ("Meeting created" / "Meeting updated") and call `onSaved()`.
  - **Buttons**: its own Save and Cancel buttons (Save is disabled while submitting). Do not rely on the ModalContext confirm button.
- [X] T023 [US2] Create `ui/src/Components/Dashboard/BoardMeetings/MeetingsTable.tsx` (depends on T021, T022).
  - **Fetch**: `adminListMeetings()` on mount and after every mutation, with Loader, error and Retry states.
  - **Columns**: Date & time (GST), Title, Venue, Location, Approved/Capacity (`counts.approved / capacity`), Pending (`counts.pending`), and Actions (Edit, Delete).
  - **New/Edit**: a **New meeting** button and the Edit action open `openModal({ title: "New meeting" | "Edit meeting", content: <MeetingForm … onSaved={() => { closeModal(); reload(); }} onCancel={closeModal} /> })` from `useModal`. Check `ui/src/Providers/ModalContext.tsx` for how to hide its default footer buttons when `content` supplies its own (set `confirmText`/`cancelText` accordingly).
  - **Delete**: `useConfirm({ title: "Delete meeting", message: "Delete “<title>”? This also removes <counts.pending+approved+declined> request(s).", confirmText: "Delete" })`. On confirm, call `adminDeleteMeeting`, show the success toast "Meeting deleted" and reload.
  - **Prop**: export a `onChanged?: () => void` prop so the parent can refresh pending counts.
- [X] T024 [US2] Create `ui/src/Components/Dashboard/BoardMeetings/BoardMeetings.tsx` plus `BoardMeetings.scss` and the compiled `BoardMeetings.css` (depends on T023).
  - **Layout**: a `dash-section` with header "Board Meetings" and Bootstrap nav-tabs **Meetings** | **Requests**, with the active tab in local state (default Meetings).
  - **Content**: the Meetings tab renders `<MeetingsTable />`. The Requests tab renders a placeholder until T029 replaces it with `<RequestsTable />`.
  - **Styles**: table, actions column, status chips (reuse `.request-status--*` tones) and the image preview.
- [X] T025 [US2] Edit `ui/src/Pages/Dashboard/Dashboard.tsx` (depends on T024):
  - Add `"board_meetings"` to the `MenuItem` union, to `accessControl` as `["admin"]`, to `menuTitles` as `"Board Meetings"`, to the `isValidMenuItem` list, and to `componentMap` as `<BoardMeetings />`.
  - Import it from `@/Components/Dashboard/BoardMeetings/BoardMeetings`.
  - Place it right after `events` in key order, so the menu shows it next to Events.

**Checkpoint**: Quickstart scenarios 1, 2, 3 and 13 pass. A meeting created here can be requested through US1.

---

## Phase 5: User Story 3 - Admin approves or declines requests (Priority: P2)

**Goal**: Admins list and filter requests, approve them (with a capacity check and an invitation email from info@), decline them (no email) and resend failed invitations.

**Independent Test**: Quickstart scenarios 9, 10, 11 and 12, with one pending request created via US1.

### Implementation for User Story 3

- [X] T026 [US3] Extend `src/services/boardMeetingNotifications.ts` with an exported `sendInvitation(requestId): Promise<NotificationStatus>` that never throws (depends on T008).
  - Set `notifications.invitation.status = "pending"`.
  - Load the request and meeting, then build variables with `buildEmailVariables` plus `MEETING_DESCRIPTION` (`escapeHtml(description).replace(/\r?\n/g, "<br />")`, or "" when empty).
  - Call `renderTemplateByName(BOARD_MEETING_TEMPLATES.invitation)` → `sendInfoEmail({ to: requester.email, replyTo: BOARD_MEETING_NOTIFY_TO })`.
  - Write `notifications.invitation` as `{ status: "sent"|"failed", attemptedAt, error }` and return the status. Return `"failed"` if anything throws.
- [X] T027 [US3] In `src/controllers/boardMeetingAdmin.controller.ts`, add a second class `@Route("api/v1/admin/board-meeting-requests") @Tags("Board Meetings Admin") export class BoardMeetingRequestAdminController extends Controller`, with every method using `@Middlewares(adminOnlyMiddleware)` (depends on T019, T026). Add a shared `loadRequestDto(id)` that uses `findById(id).populate("meetingId").populate("decision.by", "name").lean()` and then `mapBoardMeetingRequest`.
  - **`@Get("/") list(@Query() status?: string, @Query() meetingId?: string)`**: return 400 when `status` is not one of the three values or `meetingId` is not a valid ObjectId. Otherwise filter, sort `{ createdAt: -1 }`, limit 500, populate as above, and return `data: { items, total }`.
  - **`@Post("/{id}/approve")`**, in this order:
    1. Return 400 `INVALID_ID` for a bad id.
    2. Load the request; return 404 `REQUEST_NOT_FOUND` if missing.
    3. Return 409 `NOT_PENDING` if its status is not pending.
    4. Load the meeting; return 409 `MEETING_PAST` if `startsAt <= now`.
    5. Return 409 `MEETING_FULL` ("Meeting is full") if `countDocuments({ meetingId, status: "approved" }) >= capacity`.
    6. Run `findOneAndUpdate({ _id, status: "pending" }, { $set: { status: "approved", "decision.by": adminId, "decision.at": new Date() } })`. A null result means 409 `NOT_PENDING`.
    7. Run `const invitation = await sendInvitation(_id)`.
    8. Return 200 with `loadRequestDto`. The message is "Request approved" when `invitation === "sent"`, otherwise "Request approved, but the invitation email failed".
  - **`@Post("/{id}/decline")`**: return 400 or 404 as above. Run a conditional `findOneAndUpdate` on `status: "pending"` that sets `declined` and `decision`; a null result means 409 `NOT_PENDING`. Send no email. Return 200 "Request declined" with the DTO.
  - **`@Post("/{id}/resend-invitation")`**: return 400 or 404 as above. Return 409 `NOT_APPROVED` if the status is not approved, and 409 `ALREADY_SENT` if `notifications.invitation.status === "sent"`. Otherwise call `sendInvitation`. Return 200 "Invitation sent" or "Invitation email failed" with the DTO.
  - Run `npm run build` again to regenerate the tsoa routes and swagger.
- [X] T028 [P] [US3] Extend `ui/src/api/boardMeetings.ts` admin section (depends on T021):
  - `adminListRequests(params: { status?: BoardMeetingRequestStatus; meetingId?: string }): Promise<BoardMeetingRequestDto[]>`
  - `adminApproveRequest(id)`, `adminDeclineRequest(id)` and `adminResendInvitation(id)`, each returning `{ message: string; request: BoardMeetingRequestDto }`. On 409, throw an Error that carries the server `message` and `code`.
- [X] T029 [US3] Create `ui/src/Components/Dashboard/BoardMeetings/RequestsTable.tsx` and render it in the Requests tab of `BoardMeetings.tsx` (depends on T024, T028).
  - **Filters**: a status select (Pending by default, plus All, Approved and Declined) and a meeting select populated from `adminListMeetings()`. Reload on filter change.
  - **Columns**:
    - Reference: monospace.
    - Requester: name, with email (a `mailto` link) and phone beneath.
    - Meeting: title, with `date time GST` beneath.
    - Requested on, and Status chip.
    - Emails: three small labelled indicators, L (leadership), R (receipt) and I (invitation). Use `.email-status--sent|failed|pending|not_sent`, with failed in red and a title tooltip showing status and attemptedAt.
    - Actions.
  - **Actions**:
    - Pending: **Approve** (`useConfirm` "Approve <name> for “<title>”? An invitation email will be sent.") and **Decline** (`useConfirm` "Decline <name>'s request? No email is sent.").
    - Approved with invitation `failed`, `pending` or `not_sent`: **Resend invitation**.
    - Results: success toast with the server message, or a warning toast when the message mentions failure. Error toast with the server message on 409, then reload. Disable a row's buttons while its action is in flight.
  - **Parent refresh**: call the parent's `onChanged` after every action.
- [X] T030 [US3] Add a pending-count badge to the Requests tab in `ui/src/Components/Dashboard/BoardMeetings/BoardMeetings.tsx` (depends on T029). Fetch it with `adminListRequests({ status: "pending" }).length` on mount and whenever `MeetingsTable` or `RequestsTable` call `onChanged`, and hide it when the count is 0.

**Checkpoint**: Quickstart scenarios 9, 10, 11 and 12 pass. All three stories work together.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T031 Run the services-isolation check from quickstart scenario 16: `grep -rn "german-emirates-club.com\|servicesFetch\|SERVICES_SERVER\|/sso" src ui/src`. Expect matches only in `src/config/businessLetterConfig.ts` and `src/config/boardMeetingConfig.ts` (email address), `ui/src/Components/ShowCases/ShowCases.jsx` (marketing link), `src/controllers/sso.controller.ts`, and the generated `src/routes/routes.ts`/`swagger.json` entries for `/sso`. Remove anything else.
- [X] T032 [P] Run `npm run build` at the repo root and `(cd ui && npm run build)`. Both must finish with zero TypeScript errors. Fix unused imports left by the deletions in T010 and T017.
- [X] T033 Run `npx tsx src/seed_board_meeting_templates.ts` against the dev database twice (created, then skipped). Then open Dashboard → Email Templates and confirm the three templates render.
- [ ] T034 Run every scenario in `specs/003-board-meeting-requests/quickstart.md`, with `BOARD_MEETING_NOTIFY_TO` and `BOARD_MEETING_CC` pointing at a test inbox. The email scenarios (5, 8–10) need the `SMTP_INFO_USER`/`SMTP_INFO_PASS` login fixed first (research R2). Record any failures in this file.
  - **Partial (2026-10-08)**: The API scenarios ran against an isolated local server (port 5699) using local Mongo, a deliberately wrong `SMTP_INFO_PASS` and `example.com` recipients, so no real email was possible:
    - **Passed**: scenarios 1, 2, 3, 6, 8, 11 (`MEETING_FULL`), 12, 13 (API side), 14 and 15 (email rendering), plus the resend-on-failure path of scenario 10.
    - **Fixed during this run**: email subjects were HTML-escaped. Escaping now applies to the HTML body only.
    - **Still open**: the email delivery scenarios (5, 9, 10), which need the info@ SMTP login fixed, and the UI walkthroughs (4, 5, 7, 9, 13 and 17 in the browser).
- [ ] T035 [P] Check the Events tab, Boardroom page and Board Meetings tab at 375px, 768px and 1280px. Confirm that cards keep 16:9, badges don't overlap the date block, the tables scroll horizontally inside their container on phones, and the meeting form modal fits on screen.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 and T002 have no dependencies.
- **Foundational (Phase 2)**: T003–T007 depend on Phase 1 and block every story.
- **US1 (Phase 3)**: depends on Phase 2. It can be tested with a meeting inserted directly in Mongo.
- **US2 (Phase 4)**: depends on Phase 2 only. It can run in parallel with US1, but `ui/src/api/boardMeetings.ts` is shared (T011 before T021).
- **US3 (Phase 5)**: depends on Phase 2, T008 (notification service), T019 (admin controller file) and T024 (admin tab shell). Its realistic test also needs US1 (to create requests).
- **Polish (Phase 6)**: runs after the desired stories are complete.

### Story Completion Order

```text
Setup → Foundational ─┬─ US1 (member request, MVP) ──┐
                      └─ US2 (admin meetings CRUD) ──┴─ US3 (approve/decline/invite) → Polish
```

### Within-Story Task Graph

- **US1**: T008 → T009 → T010. T011 → T012. T013 and T014 can run in parallel. T012, T013 and T014 → T015 → T016 and T017. T011 and T012 → T018.
- **US2**: T019 → T020. T021 → T022 → T023 → T024 → T025.
- **US3**: T026 → T027. T028 → T029 → T030.

### Same-File Sequencing

These tasks edit the same file, so they never run in parallel:
- `ui/src/api/boardMeetings.ts`: T011 → T021 → T028
- `src/services/boardMeetingNotifications.ts`: T008 → T026
- `src/controllers/boardMeetingAdmin.controller.ts`: T019 → T027
- `BoardMeetings.tsx`: T024 → T029 → T030

---

## Parallel Execution Examples

### Phase 1 and 2

```text
Together: T001 (config), T002 (types)
Then together: T004 (request model), T005 (emailService), T006 (middleware). T003 (meeting model) and T007 (seed) once T001 is done.
```

### User Story 1

```text
Server track: T008 → T009 → T010
UI track (in parallel with the server track): T011, T014 together, then T012 and T013 → T015 → T016, T017, T018
```

### User Story 2 (can overlap with US1 once Phase 2 is done)

```text
Server: T019 → T020
UI: T021 (after T011) → T022 → T023 → T024 → T025
```

### User Story 3

```text
Server: T026 → T027
UI (in parallel): T028 → T029 → T030
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Insert a meeting directly in Mongo, then run quickstart 4–8 and 15–17.
4. Stop here if needed. Members can request, leadership is emailed and services.german-emirates-club.com is no longer called.

### Incremental Delivery

1. Add US2 so admins create meetings in the UI (quickstart 1–3 and 13). This makes the feature self-service.
2. Add US3 for approve, decline and invitations (quickstart 9–12). This closes the loop.
3. Finish with the Phase 6 polish and the full quickstart run.

### Notes

- Before any email scenario, the `SMTP_INFO_USER` login must pass the quickstart prerequisite check, which failed with 535 on 2026-10-08.
- In dev, always set `BOARD_MEETING_NOTIFY_TO`/`BOARD_MEETING_CC` to a test inbox so testing does not email the leadership team.
- Commit after each task or logical group, ending commit messages with the Claude co-author trailer.
