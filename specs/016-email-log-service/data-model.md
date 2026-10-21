# Data Model: Email Log Service

## EmailLog

Mongoose model `EmailLog`, collection `email_log` (matches the naming of `log_change` and `login_log`). Defined in `src/models/emailLog.model.ts` and exported from `src/models/index.ts`. The UI uses a shared type in `src/types/emailLog.types.ts`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | yes | Returned to clients as `id` (string). |
| `to` | string[] | yes | Lower-cased, trimmed. One record lists every "to" address of one send. |
| `cc` | string[] | no (default `[]`) | Lower-cased. |
| `bcc` | string[] | no (default `[]`) | Lower-cased. |
| `replyTo` | string | no | |
| `sender` | `"default" \| "info"` | yes | `EmailSender` account key. |
| `from` | string | no | Resolved from address (`SMTP_SENDER` / `SMTP_INFO_SENDER`); empty if the env value is missing. |
| `subject` | string | yes | Rendered subject (no placeholders). |
| `kind` | string | yes (default `"raw"`) | Template name or a named kind (`newsletter`, `newsletter_test`). |
| `runId` | string | no | UUID shared by all records of one `sendMassEmail` call. |
| `attachments` | `{ filename?: string; contentType?: string; size?: number }[]` | no (default `[]`) | Metadata only. `size` is set for Buffer or string content and left empty for `path` attachments. |
| `status` | `"pending" \| "sent" \| "failed"` | yes (default `"pending"`) | See the state transitions below. |
| `messageId` | string | no | Set when the status is `sent`. |
| `error` | string | no | Set when the status is `failed`; the error message, at most 500 chars. |
| `finishedAt` | Date | no | Set together with `sent` / `failed`. |
| `createdAt` | Date | auto | Send start time (`timestamps: { createdAt: true, updatedAt: false }`). The date filters work on this field. |

Never stored (FR-007): html or text bodies, template variables, attachment content, SMTP user or password.

### Indexes

- `{ createdAt: 1 }` TTL, `expires: "365d"`. This is the retention rule (FR-009), and it also serves the default newest-first sort.
- `{ status: 1, createdAt: -1 }`, for the outcome filter.
- `{ kind: 1, createdAt: -1 }`, for the kind filter.
- `{ to: 1 }` (multikey), for recipient lookups.
- `{ runId: 1 }` sparse, to fetch all records of a newsletter run.

### State transitions

```text
(insert) ──► pending ──► sent     (sendMail resolved: messageId, finishedAt)
                    └──► failed   (createTransport/sendMail threw: error, finishedAt)
```

A record left in `pending` means the process stopped before the outcome was saved, or the final update failed (logged to the console). No other transitions exist, and nothing in the app edits or deletes records (FR-012). They are only removed by the TTL index.

### Validation rules

- `to` must hold at least one address (inputs come from the existing callers, so no new email-format check is added).
- `status` is limited to the enum, and `sender` is limited to the `EmailSender` keys.
- `error` is trimmed to 500 characters before saving.

## Changed type: `SendRawEmailParams` (`src/services/emailService.ts`)

Two new optional fields: `kind?: string` and `runId?: string`. `SendMassEmailParams` gets `kind?: string`. Every existing field and default stays the same.
