# Data Model: Event Categories & Business Letter Requests

## 1. BusinessLetterRequest (new)

Mongoose model `BusinessLetterRequest` → collection `businessletterrequests`. File: `src/models/businessLetterRequest.model.ts`.

| Field | Type | Required | Rules / Notes |
|-------|------|----------|---------------|
| `_id` | ObjectId | yes | Pre-generated before insert (used to build `reference`). |
| `reference` | string | yes | `BL-YYYYMMDD-XXXXXX` (see research R9). Unique index. |
| `userId` | ObjectId → `users` | yes | From `req.user.userId`; never from the request body. |
| `requester.name` | string | yes | trim, 1–120 chars. Prefilled from profile, editable. |
| `requester.email` | string | yes | trim, lowercase, valid email. Taken from the signed-in user's record server-side (not editable). |
| `requester.phone` | string | no | trim, ≤ 40 chars. |
| `requester.company` | string | no | trim, ≤ 160 chars. |
| `letterType` | enum | yes | `business_recommendation` \| `partner_recommendation`. |
| `addressee.address` | string | no | trim, ≤ 500 chars. |
| `purpose` | string | yes | trim, 10–2000 chars. Stored as plain text. |
| `neededBy` | Date | yes | Date-only (stored as UTC midnight of the chosen day). Must be ≥ today (server compares by UTC calendar day with 1-day tolerance for timezones). |
| `language` | enum | yes | `en` \| `de`. Default `en`. |
| `notification.status` | enum | yes | `pending` → `sent` \| `failed`. Default `pending`. |
| `notification.attemptedAt` | Date | no | Set when the send settles. |
| `notification.error` | string | no | Short error message when `failed` (no stack traces). |
| `createdAt` / `updatedAt` | Date | auto | `timestamps: true`. |

**Indexes**: `{ reference: 1 }` unique; `{ userId: 1, createdAt: -1 }`.

**Display labels** (shared by UI, email and PDF):

| `letterType` | Label |
|---|---|
| `business_recommendation` | Business Recommendations |
| `partner_recommendation` | Partner Recommendations |

| `language` | Label |
|---|---|
| `en` | English |
| `de` | German |

### State transitions — `notification.status`

```text
pending ──(SMTP send resolves)──▶ sent
pending ──(template missing / SMTP error)──▶ failed
```

No transitions out of `sent`/`failed` in this feature (no retry UI). `failed` requests are visible in the DB and server logs for follow-up.

### Mapper / API shape

`mapBusinessLetterRequest(doc)` (in the model file, like `mapContactUsSubmission`) returns the API DTO defined in `contracts/business-letters.api.md` — `id` as string, `userId` omitted, `notification` reduced to `notificationStatus`.

Types live in `src/types/businessLetter.types.ts`: `BusinessLetterType`, `BusinessLetterLanguage`, `CreateBusinessLetterRequest`, `BusinessLetterRequestDto`, plus `LETTER_TYPE_LABELS` / `LANGUAGE_LABELS`.

## 2. Event (existing, read-only)

Type `Event` in `src/types/event.types.ts`; data comes from the external services server via `GET /api/v1/events`. No schema change.

Derived (client-only) for the Events section:

| Derived value | Rule |
|---|---|
| `eventDay` | Local calendar day parsed from `event_date` (`YYYY-MM-DD` → `new Date(y, m-1, d)`); `null` if missing/invalid. |
| `category` | `past` if `eventDay < startOfToday`; else `upcoming` (includes today and `null`). |
| `hasOwnMedia` | `!!Image` (non-empty). Otherwise the blurred GIC logo fallback is used. |
| `isWithin30Days` | Existing badge rule; evaluated only for `upcoming`. |

Sorting: `upcoming` by `eventDay` ascending, `null` last; `past` by `eventDay` descending.

## 3. EmailTemplate (existing) — new record

**Existing** document in `emailtemplates` (already created; read-only for this feature):

| Field | Value |
|---|---|
| `_id` | `ObjectId("6ac4970fe31c56f3436780a0")` — referenced via `BUSINESS_LETTER_EMAIL_TEMPLATE_ID` |
| `subject` | As stored (expected `New Business Letter Request – {{REFERENCE}}`) |
| `html` | As stored (source: `contracts/business_letter_request.email.html`) |
| placeholders | See `contracts/business-letter-email.contract.md` |
