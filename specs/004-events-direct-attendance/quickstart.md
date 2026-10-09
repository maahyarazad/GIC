# Quickstart: Validate Events – Direct Attendance

This guide proves the feature works end to end. Endpoints and codes are in [contracts/events.api.md](./contracts/events.api.md), and data rules are in [data-model.md](./data-model.md).

## Prerequisites

1. **The info@ SMTP account authenticates.** Use the same check as [003 quickstart prerequisite 1](../003-board-meeting-requests/quickstart.md#prerequisites). It must print `AUTH OK`.
2. **Keep test emails away from the leadership.** In the dev `.env`, set the following and remove both lines before deploying:
   ```bash
   EVENT_NOTIFY_TO=<test-inbox>
   EVENT_CC=<test-inbox>
   ```
3. **Seed the new templates.** This is idempotent:
   ```bash
   npx tsx src/seed_event_templates.ts
   ```
4. **Accounts.** You need one `admin` and two `user` accounts (A and B), each with a `token` cookie copied from the browser.
5. **Snapshot the 003 data before migrating.** In mongosh:
   ```js
   db.boardmeetingrequests.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }])
   ```

## Build, migrate, run

```bash
npm run build                                   # tsoa routes + tsc, must pass
(cd ui && npm run build)                        # UI type-check + build
npx tsx src/migrate_events_004.ts               # dry run: prints the planned moves per event
npx tsx src/migrate_events_004.ts --apply       # writes; add --notify to email migrated pending → confirmed members
npm run dev
```

```bash
API=http://localhost:$PORT/api/v1
ADMIN="Cookie: token=<admin>"; A="Cookie: token=<user A>"; B="Cookie: token=<user B>"
```

## Scenarios

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | Migration | Compare the dry-run output with the snapshot, then `--apply` and run it again | `approved` rows become `confirmed`. `pending` rows are confirmed up to capacity and the rest become `cancelled` (listed). `declined` rows become `cancelled`. Each `confirmedCount` equals the count of confirmed rows. The second run reports 0 changes. |
| 2 | Admin creates an event | Dashboard → **Manage Events** → Events → New, capacity 2 | It appears with `0 / 2`. Members see it under Upcoming. |
| 3 | Direct confirmation (US1) | As A, Dashboard → Events, select the card, then "Confirm attendance" | Success snackbar. The card shows *Attending* and the event is in My Events. `POST /events/{id}/attendance` returns 201 with status `confirmed`. No admin action is needed. |
| 4 | Emails at the same time | Look in the test inbox after scenario 3 | The member confirmation and the leadership notification (with CC) both arrive within 1 minute. Admin → Attendees shows `L` and `C` as sent. |
| 5 | Already attending | As A, select the same card again; also `curl -X POST -H "$A" $API/events/<id>/attendance` | Info snackbar. 409 `ALREADY_ATTENDING`. No new row and no email. |
| 6 | Capacity race | As B, and as the admin acting as a member, fire two POSTs together: `curl … & curl … & wait` | Exactly one 201 and one 409 `EVENT_FULL`. `confirmedCount` is 2 and never 3. |
| 7 | Fully booked | As any signed-in user who is not attending, view the event | The card shows *Fully booked*. Selecting it shows an info snackbar. POST returns 409 `EVENT_FULL`. |
| 8 | Capacity guard | As admin, edit the event's capacity to 1 | A field error says capacity cannot be below the 2 confirmed attendees. |
| 9 | Email failure | Set a bad `SMTP_INFO_PASS`, restart, confirm as a new user | 201 and the success snackbar anyway. The Attendees tab shows `C` failed. Restore the password, click **Resend confirmation**, and it changes to sent. |
| 10 | Past event | Create an event dated yesterday | It is listed under Past and cannot be selected. POST returns 409 `EVENT_PAST`. |
| 11 | Rename: public page (US2) | As a visitor, open `/boardroom` | It redirects to `/events`. The nav link reads "Events". The hero says "Events". Selecting a card goes to `/contact` with the *Full Name* field focused (cursor in it, no extra click). Pressing Back and Forward does not refocus it. |
| 12 | Rename: dashboard | As admin, open `/dashboard?tab=board_meetings` | The "Manage Events" section opens. No Approve/Decline buttons are shown. |
| 13 | Rename: text sweep | `grep -rniE "boardroom\|board meeting" ui/src --include=*.tsx --include=*.ts --include=*.jsx` | Only the `/boardroom` redirect route remains. |
| 14 | Removed endpoints | `curl -i -H "$ADMIN" -X POST $API/admin/board-meeting-requests/x/approve` | 404. |
| 15 | Authorization | `curl -i -H "$A" $API/admin/events` | 403. |

## Done when

All 15 scenarios pass, both builds are clean, and `migrate_events_004.ts --recount` reports no drift.
