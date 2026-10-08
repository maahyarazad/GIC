# Quickstart: Validate Board Meeting Requests

Run guide that proves the feature works end-to-end. Contracts: [contracts/board-meetings.api.md](./contracts/board-meetings.api.md). Data rules: [data-model.md](./data-model.md).

## Prerequisites

1. **SMTP info account works.** On 2026-10-08 this account failed with `535 authentication failed` ([research R2](./research.md#r2--sending-from-infogerman-industry-clubcom)). Fix the `SMTP_INFO_PASS` value, or enable SMTP AUTH for the mailbox, until this prints `AUTH OK`:
   ```bash
   node -e 'require("dotenv").config();require("nodemailer").createTransport({host:process.env.SMTP_HOST,port:+process.env.SMTP_PORT,secure:false,auth:{user:process.env.SMTP_INFO_USER,pass:process.env.SMTP_INFO_PASS}}).verify().then(()=>console.log("AUTH OK"),e=>console.log(e.responseCode,e.message))'
   ```
2. **Don't email the leadership while testing.** Add these lines to `.env` in dev, then remove them before deploying:
   ```bash
   BOARD_MEETING_NOTIFY_TO=<your-test-inbox>
   BOARD_MEETING_CC=<your-test-inbox>
   ```
3. **Seed the email templates.** This is idempotent and never overwrites edited templates:
   ```bash
   npx tsx src/seed_board_meeting_templates.ts
   ```
4. **Accounts.** You need one `admin` account and one `user` account.

## Build and run

```bash
npm run build              # tsoa routes + spec + tsc; must pass with no errors
(cd ui && npm run build)   # UI type-check + build
npm run dev                # API (and SSR) on $PORT
```

## Scenarios

The curl examples use cookies from the browser session: copy the `token` cookie for each account.

```bash
API=http://localhost:$PORT/api/v1
ADMIN="Cookie: token=<admin token>"
USER="Cookie: token=<user token>"
```

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | Admin creates a meeting (US2) | `curl -s -X POST $API/admin/board-meetings -H "$ADMIN" -H 'Content-Type: application/json' -d '{"title":"Q4 Board Meeting","date":"<future YYYY-MM-DD>","time":"18:30","venue":"GIC Boardroom","location":"DIFC, Dubai","capacity":8}'` | 201; `startsAt` is the time minus 4 h in UTC; `date`/`time` are echoed back |
| 2 | Validation (US2-2) | Same request with `"venue":""`, `"time":"25:00"` and `"capacity":0` | 400 `VALIDATION_ERROR`, with `error.details.venue`, `error.details.time` and `error.details.capacity` |
| 3 | Non-admin blocked (US2-5) | `curl -s -o /dev/null -w '%{http_code}' $API/admin/board-meetings -H "$USER"` | `403`. The Board Meetings menu item is not visible for user or procurement |
| 4 | Member sees the meeting | Sign in as the user and open Dashboard → Events | The meeting appears under Upcoming with a 16:9 card, a date block and "GIC Boardroom · 18:30". My Requests is empty |
| 5 | Request to join (US1-1..3) | Click the card, then **Send request** | Success toast "Your request has been sent to the board meeting". The card shows *Requested* and My Requests has a *Pending* row. The test inbox gets the notification (from info@, CC list as configured, Reply-To set to the user) and the receipt |
| 6 | Duplicate (US1-5, SC-005) | Click the card again. Then fire 3 quick `curl -X POST $API/board-meetings/<id>/requests -H "$USER"` calls | Info toast "already requested (Pending)". curl returns 409 `ALREADY_REQUESTED` each time. No new emails, one DB document |
| 7 | Cancel (US1-7) | Click a different upcoming meeting, then **Cancel** | No request, no network POST |
| 8 | SMTP failure (US1-4) | Set `SMTP_INFO_PASS=wrong`, restart, and request another meeting as a second user | 201 and a success toast. In the admin Requests tab, the leadership and receipt emails show as failed |
| 9 | Admin approves (US3-1) | Board Meetings → Requests, **Approve** the pending request, then confirm | Status becomes *Approved* and the "Request approved" toast shows. The invitation arrives with title, date and time (GST), venue and location, and no QR. The member's card shows *Invited* |
| 10 | Resend (US3-4) | Approve a request while SMTP is broken (scenario 8 setup), fix SMTP, then **Resend invitation** | First the message says the "invitation email failed". After the resend, the invitation status is `sent` |
| 11 | Capacity (US3-3) | Set the meeting's capacity to the approved count, then approve another request | 409 "Meeting is full" |
| 12 | Decline (US3-2) | **Decline** a pending request | *Declined* with no email. A second decide attempt returns 409 `NOT_PENDING` |
| 13 | Edit and delete (US2-3, US2-4) | Edit the venue, then reload Events as the member. Delete the meeting | The new venue shows. The delete confirm states the request count. Afterwards the meeting and its requests are gone (`GET /board-meetings` and the admin Requests list) |
| 14 | Past meeting (US1-6) | Create a meeting with a past date and open Events as the member | It is under Past and not clickable. A direct POST to it returns 409 `MEETING_PAST` |
| 15 | HTML escaping (FR-013) | Create a meeting titled `<b>X</b>` and request it | The emails show the literal `<b>X</b>` text |
| 16 | Services isolation (SC-004) | Open DevTools → Network, then use Events, Boardroom and Board Meetings | No request to `services.german-emirates-club.com`. Also `grep -rn "german-emirates-club.com\|servicesFetch\|/sso" src ui/src` matches only `businessLetterConfig.ts` (an email address), `ShowCases.jsx` (a marketing link) and `sso.controller.ts` |
| 17 | Boardroom page | Sign out and open `/boardroom`, then sign in and open it again | Signed out: the lock overlay shows and `/board-meetings` is not called. Signed in: the meetings list, and a click runs the same request flow |
