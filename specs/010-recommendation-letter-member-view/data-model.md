# Data Model: Recommendation Letter — member view, receipt email & approve/send

Collection: `businessletterrequests` (Mongoose `BusinessLetterRequestModel`). Changes are additive /
back-compatible — existing documents keep loading.

## LetterFields (letter body) — `LetterSchema` + `recommendationLetter.types.ts`

| Field | Type | Req. to save | Max | Notes |
|-------|------|--------------|-----|-------|
| recipientTitle | string | yes | 120 | unchanged |
| recipientFullName | string | yes | 160 | unchanged |
| recipientAttn | string | yes | 160 | unchanged |
| recipientAddress | string | yes | 300 | unchanged |
| recipientCity | string | yes | 120 | unchanged |
| recipientCountry | string | yes | 120 | unchanged |
| letterDate | string `YYYY-MM-DD` | yes | — | unchanged |
| companyName | string | yes (always) | 160 | min 2 |
| reference | string | yes | 200 | subject reference |
| salutation | string | yes (always) | 160 | unchanged |
| projectName | string | yes (always) | 200 | unchanged |
| **bodyIntro** | string | yes (always) | 600 | **NEW** — rendered **bold**; default = intro wording |
| **bodyMain** | string | yes (always) | 4000 | **NEW** — multi-paragraph main block (split on blank lines) |
| **bodyClosing** | string | yes (always) | 1000 | **NEW** — default = "We wish the company every success …" |
| ~~closing~~ | string | — | 1000 | **legacy** — read-only back-compat; mapped into `bodyClosing` when `body*` absent |
| companyLocation / industry / productsServices | string | no | — | legacy v1, retained, not shown |

- `LETTER_FIELD_KEYS`, `LIMITS`, `LABELS`, `ALWAYS_REQUIRED` updated to the new body fields.
- `buildBody(fields)` → `[{ text: bodyIntro, bold: true }, …bodyMain paragraphs {bold:false}, { text: bodyClosing, bold:false }]`
  (or keep the current `string[]` shape plus a parallel weight array — implementer's choice, must render intro bold).
- `buildDefaultLetter(request)`: seed `bodyIntro`/`bodyMain`/`bodyClosing` from defaults; if a legacy
  `closing` exists and new fields don't, map `closing → bodyClosing`.

### Body defaults (verbatim)

- **bodyIntro** (bold): `On behalf of the German Industry Club Dubai and its German business community, we are pleased to recommend {company} as a trusted and reliable business partner.`
- **bodyMain**: the supplied multi-paragraph block ("Based on the positive feedback … reliable business partner for this initiative.").
- **bodyClosing**: `We wish the company every success in pursuing this opportunity and its future business development.`

> `{company}` in the intro default may be pre-filled from the request company at default-build time; once
> saved it is plain editable text (no live substitution).

## Approval (new sub-doc)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| approval.status | `"pending" \| "approved"` | `"pending"` | set to `approved` by the approve endpoint |
| approval.approvedAt | Date \| null | null | set on approve |
| approval.approvedBy | ObjectId(User) \| null | null | admin who approved |

- `LetterStatus` type gains `"approved"`; `LETTER_STATUS_LABELS.approved = "Approved"`.
- `letterStatus(doc)` precedence: `sent` > `failed` (send) > `approved` > `draft` > `new`.
- `LetterRequestListItem` / `LetterRequestDetail` expose `approvalStatus` + `approvedAt` (+ approver name on detail).

## Receipt delivery (new sub-doc, mirrors `notification`)

| Field | Type | Notes |
|-------|------|-------|
| receipt.status | `"pending" \| "sent" \| "failed"` | requester receipt email outcome |
| receipt.attemptedAt | Date | |
| receipt.error | string | truncated ≤ 500 |

- Existing `notification` sub-doc (leadership) unchanged in shape; its template source changes (R5).

## letterType

- `letterType` stays on the model but becomes **optional with a default** (`business_recommendation`).
- Removed from all UI and from the leadership email variables. `formatLetterType` retained for old data.

## Validation (recommendationLetterText.ts)

- `validateLetter(value, mode)`: `ALWAYS_REQUIRED` += `bodyIntro`, `bodyMain`, `bodyClosing`; apply new
  `LIMITS`. Member save uses the same rules (members save drafts with the same completeness checks as a
  `save`, or a looser `preview` mode if a member may save partials — default to `save` rules for parity).
- No letter-type validation on create.
