# Research: Board Meeting Requests & Local Events

Phase 0 for [plan.md](./plan.md). Every Technical Context unknown is resolved below.

## R1 — Storage for meetings and requests

- **Decision**: Two Mongoose models in GIC's Mongo database: `BoardMeeting` (collection `boardmeetings`) and `BoardMeetingRequest` (collection `boardmeetingrequests`).
- **Rationale**: Same approach as `BusinessLetterRequestModel` (feature 001): schema validation, `timestamps`, indexes declared in code. GIC already connects through Mongoose (`src/db.ts`).
- **Alternatives considered**: Raw `getCollection()` access (used by older code, no schema); keeping events on the services platform (rejected by the requirement to isolate from services.german-emirates-club.com).

## R2 — Sending from info@german-industry-club.com

- **Decision**: Add an `info` sender to `src/services/emailService.ts` that uses the same `SMTP_HOST`/`SMTP_PORT` with `SMTP_INFO_USER` / `SMTP_INFO_PASS` and `from: SMTP_INFO_SENDER`. It supports `to`, `cc`, `replyTo`. The existing `do-not-reply` sender is left unchanged.
- **Verification (2026-10-08)**: `.env` holds all three keys, `SMTP_INFO_SENDER=info@german-industry-club.com`, and the user and password values are well formed (no quotes or whitespace). `nodemailer.verify()` succeeded for the existing `SMTP_USER` account, but **`SMTP_INFO_USER` was rejected with `535 5.7.8 authentication failed`** on the same host and port. No email was sent. Before end-to-end email tests, the password needs checking, or SMTP AUTH needs enabling for the info mailbox. The design does not depend on this: requests are stored either way, and failures are recorded and can be retried (R4).
- **Alternatives considered**: Falling back to `do-not-reply@` when info@ fails. Rejected because it would silently break the "send via info@" requirement and replies would be lost.

## R3 — Email content

- **Decision**: Three templates in the existing `emailtemplates` collection, looked up by name: `board_meeting_request_notification`, `board_meeting_request_receipt` and `board_meeting_invitation`. They are rendered with the existing `{{VAR}}` substitution. An idempotent seed script `src/seed_board_meeting_templates.ts` inserts each one only if missing, so wording that admins edit in Dashboard → Email Templates is never overwritten.
- **Rationale**: This matches feature 001 and the OTP emails, and admins can change the wording without a deploy. Looking templates up by name avoids hard-coded ObjectIds that differ between dev and prod (feature 001 needs `BUSINESS_LETTER_EMAIL_TEMPLATE_ID`).
- **Escaping**: Every value is passed through `escapeHtml` (`src/utils/helpers.ts`) before substitution (FR-013).
- **Alternatives considered**: HTML hard-coded in TypeScript. Rejected because admins could not edit it and it differs from the existing pattern.

## R4 — Delivery semantics

- **Decision**:
  - **New request**: save the request, respond `201`, then send the notification and the receipt in the background with `Promise.allSettled` (fire-and-forget, as in feature 001's `notifyLeadership`). Each outcome is written to `notifications.<kind>` (`pending` → `sent` | `failed` plus error text).
  - **Approve**: the status update is atomic, then the invitation is **awaited**, so the admin's response includes `invitationStatus`. If the email fails, the approval still stands and the UI offers **Resend invitation**.
- **Rationale**: Spec FR-005 says the member never waits on SMTP or sees SMTP errors. The admin needs immediate feedback on whether the invitation went out.
- **Alternatives considered**: A job queue or outbox worker. That is over-engineered for fewer than 10 attendees per meeting and low volume.

## R5 — One request per user per meeting

- **Decision**: A unique compound index `{ meetingId: 1, userId: 1 }`. On `E11000` the API returns `409` with the existing request, and the UI shows an info snackbar with its status. The UI also blocks a second click while a request is in flight. `strictLimiter` (5 requests per minute per IP) is applied to the create endpoint.
- **Rationale**: The database guarantees no duplicates even under concurrent clicks (SC-005). Duplicate attempts send no email.

## R6 — Admin-only authorization

- **Decision**: Refactor `src/middleware/adminauth.middleware.ts` into a `requireRoles(roles)` factory. `adminAuthMiddleware` stays as `requireRoles(["admin", "procurement"])`, so existing routes are unchanged. Add `adminOnlyMiddleware = requireRoles(["admin"])` for every board-meeting management and decision route. In the UI, the new `board_meetings` menu entry is limited to `["admin"]`, like `member_requests`.
- **Rationale**: The current `ADMIN_ROLES` includes `procurement`, and the spec limits management to admins. A factory avoids copying the token, refresh and error-handling block.

## R7 — Time zone

- **Decision**: The API accepts `date` (`YYYY-MM-DD`) and `time` (`HH:mm`) as Gulf Standard Time and stores `startsAt` as a UTC `Date`. The conversion is a fixed UTC+4 offset, because Asia/Dubai has no DST. Responses return `startsAt` (ISO) plus `date` and `time` in Dubai time, so the UI never converts. Emails format with `timeZone: "Asia/Dubai"` (as `SUBMITTED_AT` in feature 001 does).
- **Past or upcoming**: A meeting is *past* when `startsAt < now`. Requests are refused (`409 MEETING_PAST`) once a meeting has started.

## R8 — Removing services.german-emirates-club.com

Removed or rewritten (FR-001, SC-004):

| Item | Action |
|---|---|
| `src/controllers/event.controller.ts` (`/events`, `/my-events`, `/my-events/{reference}/qr`) | Delete |
| `src/services/servicesServer.ts` | Delete (no other users) |
| `src/types/event.types.ts` (services `Event`, `ServicesRegistrationRow`, `MyEventRegistration`) | Delete; replaced by `boardMeeting.types.ts` |
| `ui/src/api/myEvents.ts`, `Events/MyEvents.tsx`, `Events/MyEventQr.tsx` | Delete; replaced by `api/boardMeetings.ts`, `Events/MyRequests.tsx` |
| `Events/Events.tsx` (services `/events`, `/sso` redirect) | Rewrite for local meetings and the request flow |
| `Events/EventCard.tsx` (`services…/uploads/` image base) | Use local `/uploads/…` path |
| `ui/src/Pages/Boardroom/Boardroom.tsx` (`/events`, `/sso` redirect) | Use `/board-meetings` and the same request flow |
| `src/server.ts` `envVars.SERVICES_SERVER_ORIGIN` (sent to the client, unused) | Remove |

Kept on purpose:

- `GET /api/v1/sso` (`sso.controller.ts`). It only mints a token and makes no outbound call. With its two UI callers removed it is unused. It is listed as a follow-up and not deleted, in case another system relies on it.
- `SERVICES_SERVER_ORIGIN_*` and `EXTERNAL_ACCESS_SECRET` in `.env`. They are harmless and their removal is left to ops.
- `src/config/businessLetterConfig.ts`, which contains an `office6@german-emirates-club.com` address. That is an email recipient, not a services call.

## R9 — Admin UI building blocks

- **Decision**: Plain Bootstrap tables (the same style as feature 002's My Events table), a `ModalContext` dialog holding a Formik + Yup form for create and edit (both libraries are already dependencies), and `useConfirm` for delete, approve and decline. Images come from a text input that takes a File Management path (`/uploads/<id>.<ext>`) with a live preview.
- **Rationale**: With fewer than 100 rows, `GenericDataGrid`'s server-side paging is not needed. No new dependencies.

## R10 — Recipients configuration

- **Decision**: Add `src/config/boardMeetingConfig.ts`:
  - `BOARD_MEETING_NOTIFY_TO`: defaults to `SMTP_INFO_SENDER` (info@german-industry-club.com).
  - `BOARD_MEETING_CC`: defaults to the five addresses given in the request (`DEFAULT_RECIPIENTS`).
  - Both can be overridden by environment variables with the same names (comma-separated for CC), following `BUSINESS_LETTER_RECIPIENTS`.
- **Rationale**: In dev, both can point at a test inbox so testing does not email the leadership team.

## R11 — Testing approach

- **Decision**: The repo has no test runner (feature 002 R10 still applies). Validation uses `npm run build` (tsoa and tsc), the UI build, curl scenarios against the API, and manual UI walkthroughs in [quickstart.md](./quickstart.md), with recipient overrides pointing at a test inbox.

## R12 — Capacity enforcement

- **Decision**: On approve, `countDocuments({ meetingId, status: "approved" }) < capacity`, otherwise `409 MEETING_FULL`. After that check, a conditional `findOneAndUpdate({ _id, status: "pending" })` moves the request to approved.
- **Rationale**: Only a few admins act on these requests. The narrow race between the count and the update is acceptable, so no transaction or counter document is used. Capacity accepts 1–50 and defaults to 10.
