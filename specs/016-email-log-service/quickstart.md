# Quickstart: validate the Email Log Service

## Prerequisites

- Local Mongo running (`NODE_ENV=DEVELOPMENT`, which uses `MONGO_URI_LOCAL` or `mongodb://localhost:27017`) and valid `SMTP_*` / `SMTP_INFO_*` values in `.env`.
- `npm run dev` (it regenerates the tsoa routes and spec, then starts the server) and the UI dev server in `ui/`.
- An admin account, a procurement account, and an admin JWT in `$ADMIN` (`$PROC` for procurement).

## 1. Every send is logged (US1, FR-002/003)

1. Request an OTP through the normal registration or event flow.
2. `mongosh "$DB" --eval 'db.email_log.find().sort({createdAt:-1}).limit(1)'`
   - Expected: `kind: "otp_verification"`, `to: ["<you>"]`, `status: "sent"`, a `messageId` and a `finishedAt`. There are **no** `html`, `text` or OTP fields.
3. Send a recommendation letter (admin, Manage Letter of Recommendation).
   - Expected: `sender: "info"`, `replyTo` set, `attachments[0]` with `filename`, `contentType: "application/pdf"` and `size > 0`.

## 2. Failure is recorded and the error is unchanged (US1-2, FR-005)

1. Set `SMTP_PORT` to an unused port, restart, and request an OTP.
   - Expected: the API returns the same error response as on `main` with the same setting. The newest record has `status: "failed"` and a non-empty `error`.
2. Restore `SMTP_PORT`.

## 3. Bulk run, one record per recipient (US2, FR-004, SC-003)

1. Make sure 2–3 active subscribers exist, including one undeliverable address if your SMTP rejects it, then send a newsletter from the dashboard.
2. `db.email_log.aggregate([{ $match: { kind: { $ne: "newsletter_test" }, runId: { $exists: true } } }, { $sort: { createdAt: -1 } }, { $group: { _id: "$runId", n: { $sum: 1 }, sent: { $sum: { $cond: [{ $eq: ["$status","sent"] }, 1, 0] } } } }, { $limit: 1 }])`
   - Expected: `n` equals the active subscriber count, and `sent` equals the "Total successful emails" number in the server log.

## 4. Logging never blocks email (US3, FR-006)

1. Temporarily make the insert fail. For example, in `mongosh`: `db.runCommand({ collMod: "email_log", validator: { $expr: false }, validationAction: "error" })`.
2. Request an OTP.
   - Expected: the email arrives, the API succeeds, and the server log shows `Email log …` errors.
3. Undo it: `db.runCommand({ collMod: "email_log", validator: {} })`.

## 5. Only nodemailer entry point (FR-001)

`grep -rln 'from "nodemailer"' src` should list only `src/services/emailLogService.ts`.

## 6. Admin endpoint (FR-008, FR-011)

```bash
curl -s -H "Authorization: Bearer $ADMIN" "http://localhost:$PORT/api/v1/email-logs?status=failed&limit=5"            # 200, only failed
curl -s -H "Authorization: Bearer $ADMIN" "http://localhost:$PORT/api/v1/email-logs?filters=%5B%7B%22field%22%3A%22recipient%22%2C%22operator%22%3A%22contains%22%2C%22value%22%3A%22example%22%7D%5D"  # 200, matching to/cc/bcc
curl -s -H "Authorization: Bearer $ADMIN" "http://localhost:$PORT/api/v1/email-logs?from=2026-10-22T00:00:00Z&to=2026-10-21T00:00:00Z"  # 400 Invalid date range
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $PROC" "http://localhost:$PORT/api/v1/email-logs"    # 403
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:$PORT/api/v1/email-logs"                                    # 401
```

Use the Authorization header or cookie that the other admin endpoints use; see `src/middleware/adminauth.middleware.ts`.

## 7. Dashboard (US4)

1. As admin, open the dashboard. "Email Logs" is in the menu, and the grid shows the newest record first.
2. Type part of an address in the To filter, pick Status = Failed, and set From and To to today. Only matching rows show, and the pager resets to page 1.
3. Set From after To. A toast appears and the grid doesn't change.
4. Click a row's View button. The modal shows the cc, bcc, reply-to, attachments, run id, error and both timestamps.
5. Sign in as procurement. There's no "Email Logs" menu item, and opening `?tab=email_logs` falls back to the default tab.

## 8. Retention index (FR-009)

`db.email_log.getIndexes()` includes `{ createdAt: 1 }` with `expireAfterSeconds: 31536000`.
