# API Contracts

All JSON over the existing `axiosInstance` base. Admin routes keep the `admin/` prefix + `adminOnlyMiddleware`;
member routes are new, under `api/v1/letter-requests`, guarded by normal member auth and scoped to the caller.
tsoa generates `routes.ts` + `swagger.json` — regenerate, never hand-edit.

## Member (NEW) — `api/v1/letter-requests`

Caller identity from auth; every handler filters to `requester` = the authenticated member and 404s otherwise.
There is intentionally **no** member send or approve route.

| Method | Path | Body | Returns | Notes |
|--------|------|------|---------|-------|
| GET | `/` | — | `LetterRequestListItem[]` | the caller's own requests only |
| GET | `/{id}` | — | `LetterRequestDetail` | own request; 404 if not owner |
| PUT | `/{id}/letter` | `LetterFields` | `LetterRequestDetail` | save draft (own); same validation as admin save |
| POST | `/{id}/letter/pdf?disposition=inline` | `LetterFields` | `application/pdf` | preview; server forces `{ draft:true, signatures:false }` |

## Admin — `api/v1/admin/letter-requests` (existing + additions)

| Method | Path | Body | Returns | Notes |
|--------|------|------|---------|-------|
| GET | `/` | — | `LetterRequestListItem[]` | now includes `approvalStatus`, `approvedAt` |
| GET | `/{id}` | — | `LetterRequestDetail` | now includes approval + receipt info |
| PUT | `/{id}/letter` | `LetterFields` | `LetterRequestDetail` | unchanged (new body fields) |
| POST | `/{id}/letter/pdf` | `LetterFields` | `application/pdf` | passes `{ draft:false, signatures:true }` |
| **POST** | **`/{id}/approve`** | — | `{ message, detail: LetterRequestDetail }` | **NEW** — sets `approval.status="approved"`, `approvedAt`, `approvedBy`; idempotent; does NOT gate send |
| POST | `/{id}/letter/send` | — | `{ message, detail }` | unchanged; works regardless of approval |

## PDF service contract

```ts
buildRecommendationLetterPdf(
  fields: LetterFields,
  reference: string,
  opts?: { draft?: boolean; signatures?: boolean }   // defaults: { draft:false, signatures:true }
): Promise<Uint8Array>
```

- `draft:true` → one large diagonal "DRAFT" per page, grey, ~0.2 opacity, drawn under the text.
- `signatures:false` → the signatories block is omitted entirely (no reserved space, no `file_storage` reads).
- Body: `bodyIntro` bold, then `bodyMain` paragraphs, then `bodyClosing` (all via `buildBody`).

## UI API client (`ui/src/api/recommendationLetters.ts`)

- Admin: add `approveLetter(id): Promise<{ message; detail }>`; `fetchLetterPdf` unchanged.
- Member: parallel functions against the member base (`/letter-requests`): `listMyLetters`, `getMyLetter`,
  `saveMyLetter`, `fetchMyLetterPdf` (always inline/draft). The shared components receive the right set via a
  `mode`/client prop.

## Email contracts

On submit (`POST .../business-letter`), fire-and-forget, each outcome recorded:

1. **Leadership notification** — template `BUSINESS_LETTER_REQUEST`, to `BUSINESS_LETTER_RECIPIENTS`.
   Vars: `REFERENCE, REQUESTER_NAME, REQUESTER_EMAIL, REQUESTER_PHONE, REQUESTER_COMPANY, ADDRESSEE_NAME,
   ADDRESSEE_ORGANISATION, ADDRESSEE_ADDRESS, LANGUAGE, NEEDED_BY, SUBMITTED_AT, PURPOSE, CURRENT_YEAR,
   DASHBOARD_URL`. **No `LETTER_TYPE`.** Ends with an "Open in dashboard" button → `DASHBOARD_URL`.
   Reference HTML: [business_letter_request.email.html](./business_letter_request.email.html).
2. **Requester receipt** — template `BUSINESS_LETTER_RECEIPT`, to `requester.email`.
   Vars: `REFERENCE, REQUESTER_NAME, ADDRESSEE_NAME, NEEDED_BY, SUBMITTED_AT, CURRENT_YEAR`.
   Reference HTML: [business_letter_receipt.email.html](./business_letter_receipt.email.html).

`DASHBOARD_URL` resolves to the RL section with the requests modal open, e.g.
`<base>/dashboard?section=recommendation-letters&requests=1`; the SPA reads it to open Recommendation
Letters and the requests modal.
