# Data Model: Recommendation Letter Editor

This feature extends feature 001's `BusinessLetterRequest` (`src/models/businessLetterRequest.model.ts`, collection `businessletterrequests`) with two optional subdocuments ([research R1](./research.md#r1--where-the-draft-lives)). Existing fields are unchanged and no migration is needed. DTOs are in [contracts/recommendation-letters.api.md](./contracts/recommendation-letters.api.md).

## `letter` — the saved draft (absent until the first save or send)

| Field | Type | Rules | Default when absent ([R3](./research.md#r3--prefill-every-time-the-admin-comes-to-this-tab-the-values-are-prefilled)) |
|---|---|---|---|
| `recipientCompany` | String | trimmed, ≤ 160 | the first part of `addressee.address` |
| `recipientStreet` | String | trimmed, ≤ 200 | the second part |
| `recipientCity` | String | trimmed, ≤ 120 | the third part |
| `recipientCountry` | String | trimmed, ≤ 120 | the remaining parts, joined with ", " |
| `letterDate` | String `YYYY-MM-DD` | valid calendar date | today (Asia/Dubai) |
| `companyName` | String | **required**, trimmed, 2–160 | `requester.company` |
| `reference` | String | trimmed, ≤ 200 | "RFQ, Tender, Project" |
| `salutation` | String | **required**, trimmed, ≤ 160 | "Dear Sir or Madam," |
| `companyLocation` | String | **required**, trimmed, ≤ 80 | "Dubai-based" |
| `industry` | String | **required**, trimmed, ≤ 200 | "" (must be filled) |
| `productsServices` | String | **required**, trimmed, ≤ 300 | "" (must be filled) |
| `projectName` | String | **required**, trimmed, ≤ 200 | `purpose` up to its first line break, cut to 200 |
| `closing` | String | **required**, trimmed, ≤ 1000 | "We wish the company every success in pursuing this opportunity and its future business development." |
| `savedBy` | ObjectId → User | set from the token | — |
| `savedAt` | Date | set on save | — |

The same rules apply to the PDF endpoint's body (unsaved values) and to saving. The one exception: an empty `industry` or `productsServices` is allowed in a **preview**, so an incomplete draft can still be viewed. It's rejected on save and send.

## `delivery` — the email send record (absent until the first send)

| Field | Type | Rules |
|---|---|---|
| `status` | String | `sent` \| `failed` |
| `sentAt` | Date \| null | time of the last successful send |
| `sentBy` | ObjectId → User | admin of the last attempt |
| `sentTo` | String | the email address used (the requester's email at send time) |
| `attemptedAt` | Date | time of the last attempt |
| `count` | Number | successful sends, incremented with `$inc` |
| `error` | String \| null | last error, ≤ 500 characters, null on success |

**Derived for the list**: `letterStatus`:
- `new`: no `letter` and no `delivery`
- `draft`: `letter` exists, no successful send
- `sent`: `delivery.status === "sent"`
- `failed`: the last attempt failed

## State transitions

```text
new ──save──▶ draft ──send ok──▶ sent ──send again ok──▶ sent (count+1)
                 │                 ▲
                 └──send fail──▶ failed ──send ok──┘

send while new (no saved draft) → 409 LETTER_NOT_SAVED, no state change
```

Editing after `sent` keeps `delivery` as it is. The list shows "Sent · edited since" when `letter.savedAt > delivery.sentAt`.

## Indexes

- Existing: unique `reference`, `{ userId: 1, createdAt: -1 }`.
- New: `{ createdAt: -1 }` for the admin list. The collection is small, but the list sorts by it on every load.

## Email template — `recommendation_letter_delivery` (emailtemplates)

| Field | Value |
|---|---|
| `subject` | `Your Letter of Recommendation – {{COMPANY_NAME}} ({{REFERENCE}})` |
| `html` | `src/email_templates/recommendation_letter_delivery.html` (GIC themed layout, same as PR #28's templates) |
| `variables` | `REQUESTER_NAME`, `COMPANY_NAME`, `REFERENCE`, `PROJECT_NAME`, `LETTER_DATE` (+ global `CURRENT_YEAR`) |

It's inserted if missing on first send ([R7](./research.md#r7--email-template-provisioning-lesson-from-pr-28)) and never overwritten.
