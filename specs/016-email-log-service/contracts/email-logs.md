# Contract: email logs

## HTTP: `GET /api/v1/email-logs`

Auth: `adminOnlyMiddleware` (role `admin` only). No token or an invalid token gets 401; the `procurement` and `user` roles get 403.

| Query | Type | Default | Notes |
|---|---|---|---|
| `filters` | JSON string | none | `[{ field, operator, value }]`, where operator is `contains \| startsWith \| endsWith \| equals`. Allowed fields: `recipient` (matches `to`, `cc` or `bcc`), `subject`, `kind`, `runId`. Other fields are ignored, and values are regex-escaped. Invalid JSON gets 400 `Invalid filters JSON`. |
| `status` | `pending \| sent \| failed` | none | Omit for all. Any other value gets 400. |
| `from` | ISO datetime | none | `createdAt >= from`. |
| `to` | ISO datetime | none | `createdAt < to` (exclusive). Invalid date or `from >= to` gets 400 `Invalid date range`. |
| `limit` | number | 20 | Clamped to 1..100. |
| `skip` | number | 0 | |
| `sortBy` | `createdAt \| subject \| kind \| status \| sender` | `createdAt` | Any other value falls back to `createdAt`. |
| `sortOrder` | `asc \| desc` | `desc` | |

200 response (`createSuccessResponse`):

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "6716…",
        "to": ["member@example.com"], "cc": [], "bcc": [], "replyTo": null,
        "sender": "info", "from": "info@…",
        "subject": "Your recommendation letter",
        "kind": "recommendation_letter_delivery",
        "runId": null,
        "attachments": [{ "filename": "GIC-0042.pdf", "contentType": "application/pdf", "size": 48213 }],
        "status": "sent", "messageId": "<…@…>", "error": null,
        "createdAt": "2026-10-21T10:15:02.120Z", "finishedAt": "2026-10-21T10:15:03.004Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

Read-only: there is no POST, PUT or DELETE (FR-012). Regenerate `src/routes` and `src/swagger` with `npm run tsoa:routes && npm run tsoa:spec`.

## Internal: `sendLoggedEmail` (`src/services/emailLogService.ts`)

```ts
sendLoggedEmail(
  params: SendRawEmailParams,              // same shape sendRawEmailWithAttachments takes today
  // kind, runId taken from params; defaults kind = "raw"
): Promise<SMTPTransport.SentMessageInfo>  // same value / same thrown error as before
```

Guarantees:
1. Exactly one `email_log` record per call, `pending` before the send starts.
2. It resolves or rejects with exactly what `transporter.sendMail` resolved or threw (including config errors thrown by `createTransport`).
3. A failed log insert or update never changes 2. It is reported with `console.error("Email log …")`.
4. It is the only place in `src/` that imports `nodemailer` (check: `grep -rln "from \"nodemailer\"" src` lists only this file).

## UI: Dashboard "Email Logs" section

- Menu key `email_logs`, title "Email Logs", `accessControl: ["admin"]`, component `EmailLogs`.
- Grid columns: Sent at (`createdAt`, sortable), To (filter field `recipient`), Subject (filterable, sortable), Kind (filterable, sortable), Sender (sortable), Status (sortable; shows a badge), View (a `FaEye` button that opens a modal with every field from the response, including the error text for failed records).
- Above the grid: a Status select (All / Pending / Sent / Failed), plus From and To date inputs. Changing any of them resets to page 1. If From > To, show a toast "From date must be on or before To date" and don't fetch.
