# Email Contract: Business Letter Request (template `6ac4970fe31c56f3436780a0`)

Template HTML: [`business_letter_request.email.html`](./business_letter_request.email.html) — derived from the OTP Verification template (same 600px table layout, `#C8541A` header, `#D9B144` highlight, `{{CURRENT_YEAR}}` footer).

## Template record (existing — Dashboard → Email Templates)

| Field | Value |
|---|---|
| `_id` | `6ac4970fe31c56f3436780a0` (config `BUSINESS_LETTER_EMAIL_TEMPLATE_ID`, env-overridable) |
| Subject | As stored; expected `New Business Letter Request – {{REFERENCE}}` |
| HTML | As stored; source is the file above |

The implementation looks the record up **by `_id`**, never by name.

## Recipients

`BUSINESS_LETTER_RECIPIENTS` from `src/config/businessLetterConfig.ts` (env override `BUSINESS_LETTER_RECIPIENTS`, comma-separated). Default:

```ts
[
  'ricco.deutscher@german-industry-club.com',
  'philip.hoelzer@german-industry-club.com',
  'jan.hussing@german-industry-club.com',
  'thomas.hochberger@german-industry-club.com',
]
```

Sent once, all recipients in `To`, via `sendDynamicEmailToUser({ template_id: BUSINESS_LETTER_EMAIL_TEMPLATE_ID, email: recipients.join(", "), data })`.

## Variables

All user-supplied values are HTML-escaped (`escapeHtml`) before substitution. Empty optional values are sent as `—`.

| Placeholder | Source | Example |
|---|---|---|
| `{{REFERENCE}}` | `reference` | `BL-20261006-A1B2C3` |
| `{{REQUESTER_NAME}}` | `requester.name` | `Jane Doe` |
| `{{REQUESTER_EMAIL}}` | `requester.email` | `jane@example.com` |
| `{{REQUESTER_PHONE}}` | `requester.phone` or `—` | `+971 50 000 0000` |
| `{{REQUESTER_COMPANY}}` | `requester.company` or `—` | `Doe Trading GmbH` |
| `{{LETTER_TYPE}}` | label from `letterType` | `Business Recommendations` |
| `{{ADDRESSEE_ADDRESS}}` | `addressee.address` or `—` | `Abu Dhabi, UAE` |
| `{{LANGUAGE}}` | `English` / `German` | `English` |
| `{{NEEDED_BY}}` | `neededBy` formatted `DD MMM YYYY` | `20 Oct 2026` |
| `{{SUBMITTED_AT}}` | `createdAt` formatted `DD MMM YYYY, HH:mm` (Asia/Dubai) | `06 Oct 2026, 13:14` |
| `{{PURPOSE}}` | `purpose`, escaped, `\n` → `<br />` | `Business visit…` |
| `{{CURRENT_YEAR}}` | global (`getGlobalEmailVariables`) | `2026` |

## Failure behaviour

Template id invalid or record missing, or SMTP error → request `notification.status = "failed"`, `notification.error` set, error logged. The HTTP response to the member is unaffected.
