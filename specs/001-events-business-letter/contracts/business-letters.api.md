# API Contract: Business Letter Requests

Base path: `/api/v1/business-letters` — tsoa controller `src/controllers/businessLetter.controller.ts`, tag `Business Letters`.
Auth: all endpoints `@Middlewares(authMiddleware)` (cookie `token`; roles `user`, `admin`, `procurement` all allowed).
Envelope: existing `createSuccessResponse` / `createErrorResponse` from `src/utils/helpers.ts`.

---

## POST `/api/v1/business-letters`

Create a request for the signed-in user. Extra middleware: `strictLimiter` (5 req/min/IP).

### Request body — `CreateBusinessLetterRequest`

```json
{
  "requester": {
    "name": "Jane Doe",
    "phone": "+971 50 000 0000",
    "company": "Doe Trading GmbH"
  },
  "letterType": "business_recommendation",
  "addressee": {
    "address": "Abu Dhabi, UAE"
  },
  "purpose": "Business visit to Hannover Messe, 20–24 April 2027.",
  "neededBy": "2026-10-20",
  "language": "en"
}
```

Validation (server re-validates everything; rules in `data-model.md`). `requester.email` is **not** accepted from the body — it is read from the user record.

### Responses

| Status | When | Body |
|---|---|---|
| 201 | Created | `success` envelope, `data: BusinessLetterRequestDto`, message `"Business letter request submitted"` |
| 400 | Validation failed | `error` envelope, code `VALIDATION_ERROR`, `details: { field: message }` |
| 401 | No/invalid/expired token | `{ "message": "..." }` (from `authMiddleware`) |
| 404 | User record not found | code `USER_NOT_FOUND` |
| 429 | Rate limit | `"Too many requests to this endpoint"` |
| 500 | Unexpected | code `INTERNAL_ERROR` |

Side effect: after insert, notification email is sent asynchronously (does not affect the 201). See `business-letter-email.contract.md`.

---

## GET `/api/v1/business-letters`

List the signed-in user's own requests, newest first.

### Query

| Param | Type | Default | Rules |
|---|---|---|---|
| `limit` | number | 20 | clamp 1–100 |
| `skip` | number | 0 | ≥ 0 |

### 200 response

```json
{
  "success": true,
  "message": "Business letter requests fetched",
  "data": {
    "items": [ /* BusinessLetterRequestDto[] */ ],
    "total": 3,
    "page": 1,
    "pages": 1
  }
}
```

401 as above; 500 `INTERNAL_ERROR`.

---

## GET `/api/v1/business-letters/{id}/pdf`

Download a PDF summary of one of the user's own requests.

| Status | When | Body |
|---|---|---|
| 200 | Owned request | `application/pdf` stream; header `Content-Disposition: attachment; filename="BL-20261006-A1B2C3.pdf"` |
| 401 | Not signed in | as above |
| 404 | Invalid id, not found, **or owned by another user** | `error` envelope, code `NOT_FOUND` |
| 500 | PDF generation failed | code `PDF_ERROR` |

Implementation note: return `Readable.from(pdfBytes)` (not a `Buffer`) — tsoa only pipes readable streams; everything else is sent with `res.json()`.

---

## `BusinessLetterRequestDto`

```json
{
  "id": "6702a1f0c1d2e3f4a1b2c3d4",
  "reference": "BL-20261006-A1B2C3",
  "requester": { "name": "Jane Doe", "email": "jane@example.com", "phone": "+971 50 000 0000", "company": "Doe Trading GmbH" },
  "letterType": "business_recommendation",
  "letterTypeLabel": "Business Recommendations",
  "addressee": { "address": "Abu Dhabi, UAE" },
  "purpose": "Business visit to Hannover Messe, 20–24 April 2027.",
  "neededBy": "2026-10-20",
  "language": "en",
  "notificationStatus": "sent",
  "createdAt": "2026-10-06T09:14:00.000Z"
}
```

`neededBy` is serialised as `YYYY-MM-DD`.

---

## UI contract — Dashboard

`ui/src/Pages/Dashboard/Dashboard.tsx`:

| Key | Value |
|---|---|
| `MenuItem` | `"business_letter"` |
| `accessControl.business_letter` | `["user", "admin", "procurement"]` |
| `menuTitles.business_letter` | `"Request a Business Letter"` |
| `isValidMenuItem` list | add `"business_letter"` |
| `componentMap.business_letter` | `<BusinessLetter />` |
| URL | `/dashboard?tab=business_letter` |

Client API module `ui/src/api/businessLetter.ts`: `createBusinessLetterRequest(body)`, `listBusinessLetterRequests({ limit, skip })`, `downloadBusinessLetterPdf(id, reference)` (blob → `createObjectURL` → `<a download>`).
