# Contract: newsletter subscribers

Base: `/api/v1/newsletter`

| Route | Auth | Change |
|---|---|---|
| `POST /` | public + `subscribeLimiter` (5 / 10 min / IP) | Body `{ email, active? }`. 201 subscribed / re-subscribed, 400 `EMAIL_EXISTS`, 429 `{ success:false, message:"Too many attempts. Please try again later." }`. |
| `GET /` | `adminAuthMiddleware` (was none) | Each item gains `type: "internal" \| "external"`. |
| `POST /admin/bulk` | `adminAuthMiddleware` | NEW. Body `BulkAddRequest`. 200 `{ added, reactivated, duplicates, invalid }`. 400 when `emails` is empty or over 200. |
| `PUT /{id}` | `adminAuthMiddleware` (was none) | Unchanged otherwise. |
| `DELETE /{id}` | `adminAuthMiddleware` (was none) | Unchanged otherwise. |
| `GET /email/{email}`, `PUT /email/{email}` | unchanged | Flagged follow-up: unauthenticated. |

Declare `POST /admin/bulk` before any `/{id}` route so it is not captured.
